# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sqlite3
import os

from app.handover_generator import generate_handover_report

app = FastAPI(title="ShiftSignal API", description="Production Intelligence Backend")

# Enable CORS so the React frontend can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # The port Vite uses for React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup database path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "shiftsignal.db")

# Define the expected JSON payload for updates
class IssueUpdate(BaseModel):
    status: str
    supervisor_notes: Optional[str] = None

def get_db_connection():
    """Helper function to create a database connection."""
    conn = sqlite3.connect(DB_PATH)
    # This allows us to access columns by name (e.g., row['machine_id']) instead of just index
    conn.row_factory = sqlite3.Row 
    return conn

@app.get("/")
def read_root():
    return {"message": "ShiftSignal API is running. Access /docs for the API interface."}

@app.get("/api/overview")
def get_overview_stats():
    """Returns high-level statistics for the dashboard overview."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Count total machines
        cursor.execute("SELECT COUNT(*) as count FROM machines")
        machine_count = cursor.fetchone()['count']
        
        # Count total anomalies
        cursor.execute("SELECT COUNT(*) as count FROM anomalies")
        anomaly_count = cursor.fetchone()['count']
        
        # Count OPEN issues
        cursor.execute("SELECT COUNT(*) as count FROM issues WHERE status = 'OPEN'")
        open_issues_count = cursor.fetchone()['count']
        
    return {
        "total_machines": machine_count,
        "total_detected_anomalies": anomaly_count,
        "active_open_issues": open_issues_count
    }

@app.get("/api/anomalies")
def get_anomalies():
    """Returns all detected anomalies."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Fetch all anomalies, sorting by the most recent date
        cursor.execute("SELECT * FROM anomalies ORDER BY date DESC, shift DESC")
        anomalies = cursor.fetchall()
        
        # Convert the SQLite row objects into standard Python dictionaries
        return [dict(row) for row in anomalies]

@app.get("/api/issues")
def get_issues():
    """Returns all issues with their associated anomaly details."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Use a SQL JOIN to combine issue data with the anomaly data that triggered it
        cursor.execute("""
            SELECT i.issue_id, i.machine_id, i.status, i.created_at, 
                   a.anomaly_type, a.date as anomaly_date, a.shift as anomaly_shift, a.evidence
            FROM issues i
            JOIN anomalies a ON i.anomaly_id = a.anomaly_id
            ORDER BY i.created_at DESC
        """)
        issues = cursor.fetchall()
        
        return [dict(row) for row in issues]

@app.put("/api/issues/{issue_id}")
def update_issue(issue_id: int, update_data: IssueUpdate):
    """Updates the status and notes of a specific issue."""
    valid_statuses = ["OPEN", "ACKNOWLEDGED", "RESOLVED"]
    
    if update_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # We use a CASE statement to automatically stamp 'resolved_at' if status is RESOLVED
        cursor.execute("""
            UPDATE issues 
            SET status = ?, 
                supervisor_notes = ?, 
                resolved_at = CASE WHEN ? = 'RESOLVED' THEN CURRENT_TIMESTAMP ELSE resolved_at END
            WHERE issue_id = ?
        """, (update_data.status, update_data.supervisor_notes, update_data.status, issue_id))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Issue not found")
            
        return {
            "message": "Issue updated successfully",
            "issue_id": issue_id,
            "new_status": update_data.status
        }

@app.get("/api/handover")
def get_handover_report(date: str, shift: str):
    """Generates the deterministic shift handover report for a given date and shift."""
    report_text = generate_handover_report(target_date=date, target_shift=shift)
    
    return {
        "target_date": date,
        "target_shift": shift,
        "handover_report": report_text
    }