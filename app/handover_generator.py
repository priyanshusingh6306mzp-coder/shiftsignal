# app/handover_generator.py
import sqlite3
import os
from datetime import datetime

# Setup database path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "shiftsignal.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def generate_handover_report(target_shift: str, target_date: str):
    """
    Generates a deterministic shift handover report based on database facts.
    """
    report_lines = []
    report_lines.append("=======================================================")
    report_lines.append(f"SHIFT HANDOVER REPORT")
    report_lines.append(f"Date: {target_date} | Shift: {target_shift}")
    report_lines.append(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("=======================================================\n")

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Fetch anomalies that occurred DURING this specific shift
        cursor.execute("""
            SELECT a.machine_id, a.anomaly_type, a.evidence, i.issue_id, i.status 
            FROM anomalies a
            LEFT JOIN issues i ON a.anomaly_id = i.anomaly_id
            WHERE a.date = ? AND a.shift = ?
        """, (target_date, target_shift))
        shift_anomalies = cursor.fetchall()

        report_lines.append("1. PREVIOUS SHIFT SUMMARY & ANOMALIES")
        report_lines.append("-------------------------------------------------------")
        if not shift_anomalies:
            report_lines.append("No abnormal machine behavior detected during this shift.\n")
        else:
            for row in shift_anomalies:
                status_text = f" (Issue #{row['issue_id']} - {row['status']})" if row['issue_id'] else ""
                report_lines.append(f"• Machine {row['machine_id']}: {row['anomaly_type'].replace('_', ' ').title()}")
                report_lines.append(f"  Evidence: {row['evidence']}{status_text}")
            report_lines.append("\n")

        # 2. Fetch ALL unresolved issues (including those from past shifts)
        cursor.execute("""
            SELECT i.issue_id, i.machine_id, a.date, a.shift, a.anomaly_type, i.supervisor_notes
            FROM issues i
            JOIN anomalies a ON i.anomaly_id = a.anomaly_id
            WHERE i.status IN ('OPEN', 'ACKNOWLEDGED')
            ORDER BY i.created_at ASC
        """)
        unresolved_issues = cursor.fetchall()

        report_lines.append("2. PENDING ISSUES (REQUIRES ATTENTION)")
        report_lines.append("-------------------------------------------------------")
        if not unresolved_issues:
            report_lines.append("No pending issues. All clear.\n")
        else:
            for row in unresolved_issues:
                notes = f" | Notes: {row['supervisor_notes']}" if row['supervisor_notes'] else ""
                report_lines.append(
                    f"• Issue #{row['issue_id']} [Machine {row['machine_id']}]: "
                    f"{row['anomaly_type'].replace('_', ' ').title()} "
                    f"(Originated: {row['date']} Shift {row['shift']}){notes}"
                )
            report_lines.append("\n")

        report_lines.append("3. RECOMMENDED NEXT STEPS")
        report_lines.append("-------------------------------------------------------")
        if unresolved_issues:
            report_lines.append("• Review the pending issues listed above.")
            report_lines.append("• Inspect the associated machines and update the issue status to RESOLVED once fixed.")
        else:
            report_lines.append("• Proceed with standard shift operations.")

    return "\n".join(report_lines)

if __name__ == "__main__":
    # Test the generator using a known date/shift from your test dataset
    # We will use '2026-02-27' Shift 'B' since your Z-score caught a false positive there, 
    # ensuring we get some data to look at.
    print(generate_handover_report(target_date="2026-02-27", target_shift="B"))