# tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "ShiftSignal API is running" in response.json()["message"]

def test_get_overview():
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_machines" in data
    assert "total_detected_anomalies" in data
    assert "active_open_issues" in data
    assert data["total_machines"] == 6

def test_get_issues_structure():
    response = client.get("/api/issues")
    assert response.status_code == 200
    issues = response.json()
    assert isinstance(issues, list)
    if len(issues) > 0:
        first_issue = issues[0]
        assert "issue_id" in first_issue
        assert "machine_id" in first_issue
        assert "status" in first_issue
        assert "evidence" in first_issue

def test_update_issue_invalid_status():
    response = client.put("/api/issues/1", json={
        "status": "INVALID_STATUS",
        "supervisor_notes": "Testing invalid payload"
    })
    assert response.status_code == 400

def test_deterministic_handover_report():
    response = client.get("/api/handover?date=2026-02-27&shift=B")
    assert response.status_code == 200
    data = response.json()
    assert data["target_date"] == "2026-02-27"
    assert data["target_shift"] == "B"
    assert "SHIFT HANDOVER REPORT" in data["handover_report"]
    assert "PREVIOUS SHIFT SUMMARY & ANOMALIES" in data["handover_report"]