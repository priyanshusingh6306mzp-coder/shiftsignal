# app/main.py
import sqlite3
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.handover_generator import build_handover, generate_shift_handover_report

app = FastAPI(title="ShiftSignal API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "app/database/shiftsignal.db"


class IssueUpdate(BaseModel):
    status: str
    supervisor_notes: Optional[str] = None


@app.get("/")
def read_root():
    return {"message": "ShiftSignal API is running"}


@app.get("/api/overview")
def get_overview():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM machines")
    total_machines = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM anomalies")
    total_anomalies = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM issues WHERE status != 'RESOLVED'")
    active_issues = cursor.fetchone()[0]
    conn.close()
    return {
        "total_machines": total_machines,
        "total_detected_anomalies": total_anomalies,
        "active_open_issues": active_issues,
    }


@app.get("/api/issues")
def get_issues():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT i.issue_id, i.machine_id, a.anomaly_type,
               a.date as anomaly_date, a.shift as anomaly_shift,
               a.evidence, i.status, i.supervisor_notes
        FROM issues i
        JOIN anomalies a ON i.anomaly_id = a.anomaly_id
        ORDER BY i.issue_id ASC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.put("/api/issues/{issue_id}")
def update_issue(issue_id: int, payload: IssueUpdate):
    if payload.status not in ["OPEN", "ACKNOWLEDGED", "RESOLVED"]:
        raise HTTPException(status_code=400, detail="Invalid status transition")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE issues 
        SET status = ?, supervisor_notes = COALESCE(?, supervisor_notes)
        WHERE issue_id = ?
    """,
        (payload.status, payload.supervisor_notes, issue_id),
    )
    conn.commit()
    conn.close()
    return {"success": True, "issue_id": issue_id, "status": payload.status}


@app.get("/api/handover")
def get_handover(date: str = Query(...), shift: str = Query(...)):
    if shift not in ["A", "B", "C"]:
        raise HTTPException(status_code=400, detail="Shift must be A, B, or C")
    try:
        report_text = generate_shift_handover_report(shift, date, DB_PATH)
        return {
            "target_date": date,
            "target_shift": shift,
            "handover_report": report_text,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/handover/structured")
def get_handover_structured(date: str = Query(...), shift: str = Query(...)):
    if shift not in ["A", "B", "C"]:
        raise HTTPException(status_code=400, detail="Shift must be A, B, or C")
    try:
        return build_handover(date, shift, DB_PATH)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))