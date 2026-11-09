# app/handover_generator.py
import sqlite3
from datetime import datetime
from typing import Dict, Any, List

SHIFT_MAP = {'A': 0, 'B': 1, 'C': 2}
REV_SHIFT = {0: 'A', 1: 'B', 2: 'C'}
NEXT_SHIFT = {'A': 'B', 'B': 'C', 'C': 'A'}
DB_PATH = "app/database/shiftsignal.db"

def shift_ordinal(d_str: str, s_char: str) -> int:
    """Calculates an integer shift ordinal: date.toordinal() * 3 + shift_index."""
    dt = datetime.strptime(d_str, "%Y-%m-%d").date()
    return dt.toordinal() * 3 + SHIFT_MAP.get(s_char, 0)

def compute_streak(shift_ordinals: List[int]) -> int:
    """Calculates the unbroken run of consecutive shifts ending at the latest anomaly."""
    if not shift_ordinals:
        return 0
    unique_ords = sorted(list(set(shift_ordinals)))
    streak = 1
    for i in range(len(unique_ords) - 1, 0, -1):
        if unique_ords[i] - unique_ords[i - 1] == 1:
            streak += 1
        else:
            break
    return streak

def calculate_severity(streak: int, count: int) -> str:
    """
    Fixed severity thresholds:
    - critical: streak >= 6 or count >= 10
    - warning:  streak >= 2 or count >= 2
    - info:     otherwise
    """
    if streak >= 6 or count >= 10:
        return "critical"
    if streak >= 2 or count >= 2:
        return "warning"
    return "info"

def build_handover(target_date: str, target_shift: str, db_path: str = DB_PATH) -> Dict[str, Any]:
    if target_shift not in SHIFT_MAP:
        raise ValueError("Shift must be A, B, or C")

    target_ord = shift_ordinal(target_date, target_shift)
    next_s = NEXT_SHIFT[target_shift]
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Anomalies strictly during target_date and target_shift
    cursor.execute("""
        SELECT a.anomaly_id, a.machine_id, a.anomaly_type, a.evidence, i.issue_id, i.status,
               a.date as a_date, a.shift as a_shift
        FROM anomalies a
        LEFT JOIN issues i ON a.anomaly_id = i.anomaly_id
        WHERE a.date = ? AND a.shift = ?
        ORDER BY a.anomaly_id ASC
    """, (target_date, target_shift))
    this_shift_rows = cursor.fetchall()

    this_shift = []
    for r in this_shift_rows:
        this_shift.append({
            "machine_id": r["machine_id"],
            "anomaly_type": r["anomaly_type"] or "STATISTICAL ANOMALY",
            "evidence": r["evidence"] or "-",
            "issue_id": r["issue_id"],
            "status": r["status"] or "UNASSIGNED"
        })

    # 2. Pending issues: status IN ('OPEN', 'ACKNOWLEDGED') originated AT or BEFORE selected shift
    cursor.execute("""
        SELECT i.issue_id, i.machine_id, a.anomaly_type, a.evidence,
               a.date as orig_date, a.shift as orig_shift,
               i.status, i.supervisor_notes
        FROM issues i
        JOIN anomalies a ON i.anomaly_id = a.anomaly_id
        WHERE i.status IN ('OPEN', 'ACKNOWLEDGED')
        ORDER BY a.date ASC, a.shift ASC
    """)
    all_pending = cursor.fetchall()
    conn.close()

    eligible_pending = []
    for r in all_pending:
        r_ord = shift_ordinal(r["orig_date"], r["orig_shift"])
        if r_ord <= target_ord:
            eligible_pending.append(r)

    # 3. Group by machine and calculate statistics
    grouped = {}
    for r in eligible_pending:
        m = r["machine_id"]
        grouped.setdefault(m, []).append(r)

    carry_over = []
    for m_id, rows in grouped.items():
        ords = [shift_ordinal(r["orig_date"], r["orig_shift"]) for r in rows]
        streak = compute_streak(ords)
        count = len(rows)
        open_cnt = sum(1 for r in rows if r["status"] == "OPEN")
        ack_cnt = sum(1 for r in rows if r["status"] == "ACKNOWLEDGED")
        first_d = rows[0]["orig_date"]
        last_d = rows[-1]["orig_date"]
        sev = calculate_severity(streak, count)

        issue_list = [{
            "issue_id": r["issue_id"],
            "date": r["orig_date"],
            "shift": r["orig_shift"],
            "status": r["status"],
            "notes": r["supervisor_notes"] or "-"
        } for r in rows]

        carry_over.append({
            "machine_id": m_id,
            "count": count,
            "open": open_cnt,
            "acknowledged": ack_cnt,
            "first": first_d,
            "last": last_d,
            "streak": streak,
            "severity": sev,
            "issues": issue_list
        })

    # Sort carry_over by severity (critical > warning > info), then count descending
    sev_rank = {"critical": 0, "warning": 1, "info": 2}
    carry_over.sort(key=lambda x: (sev_rank[x["severity"]], -x["count"]))

    # 4. Deterministic next steps
    next_steps = []
    for co in carry_over:
        if co["severity"] == "critical":
            next_steps.append(
                f"{co['machine_id']}: {co['count']} unresolved incidents with an unbroken streak of {co['streak']} shifts ({co['first']} to {co['last']}). Escalate for physical inspection prior to next run."
            )
        elif co["severity"] == "warning":
            next_steps.append(
                f"{co['machine_id']}: {co['count']} unresolved incidents. Monitor sensor telemetry closely and verify supervisor assignment."
            )
    if not next_steps:
        next_steps.append("Proceed with standard shift operations.")

    # 5. Formatted monospace text for backward compatibility
    lines = [
        "==================================================",
        f"SHIFT HANDOVER REPORT | SHIFT {target_shift} -> SHIFT {next_s}",
        f"Operating Date: {target_date} | Shift: {target_shift}",
        f"Generated: {generated_at}",
        "==================================================\n",
        f"1. DURING SHIFT {target_shift}",
        "--------------------------------------------------"
    ]
    if not this_shift:
        lines.append("• No anomalies flagged during this shift.\n")
    else:
        for itm in this_shift:
            lines.append(f"• Machine {itm['machine_id']}: {itm['anomaly_type']} (Issue #{itm['issue_id']} - {itm['status']})")
            lines.append(f"  Evidence: {itm['evidence']}")
        lines.append("")

    lines.extend([
        "2. CARRY-OVER ISSUES REQUIRING ATTENTION",
        "--------------------------------------------------"
    ])
    if not carry_over:
        lines.append("• Zero unresolved operational issues.\n")
    else:
        for co in carry_over:
            lines.append(f"• Machine {co['machine_id']} [{co['severity'].upper()}] - {co['count']} unresolved ({co['open']} open, {co['acknowledged']} ack) · {co['first']} to {co['last']} · {co['streak']} consecutive shifts:")
            for iss in co["issues"]:
                note_info = f" | Notes: {iss['notes']}" if iss["notes"] != "-" else ""
                lines.append(f"  - Issue #{iss['issue_id']} ({iss['date']} Shift {iss['shift']} - {iss['status']}){note_info}")
        lines.append("")

    lines.extend([
        "3. RECOMMENDED NEXT STEPS",
        "--------------------------------------------------"
    ])
    for ns in next_steps:
        lines.append(f"• {ns}")

    report_text = "\n".join(lines)

    return {
        "date": target_date,
        "shift": target_shift,
        "next_shift": next_s,
        "generated_at": generated_at,
        "summary": {
            "events_this_shift": len(this_shift),
            "pending_total": len(eligible_pending),
            "machines_affected": len(carry_over)
        },
        "this_shift": this_shift,
        "carry_over": carry_over,
        "next_steps": next_steps,
        "text": report_text
    }

def generate_shift_handover_report(target_shift: str, target_date: str, db_path: str = DB_PATH) -> str:
    return build_handover(target_date, target_shift, db_path)["text"]