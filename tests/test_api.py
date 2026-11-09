import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.handover_generator import (
    compute_streak,
    calculate_severity,
    shift_ordinal,
    build_handover,
)

client = TestClient(app)


def test_read_root():
    res = client.get("/")
    assert res.status_code == 200
    assert "ShiftSignal API is running" in res.json()["message"]


def test_get_overview():
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_machines" in data
    assert "total_detected_anomalies" in data
    assert "active_open_issues" in data
    assert data["total_machines"] == 6


def test_get_issues_structure():
    res = client.get("/api/issues")
    assert res.status_code == 200
    issues = res.json()
    assert isinstance(issues, list)
    if len(issues) > 0:
        first_issue = issues[0]
        assert "issue_id" in first_issue
        assert "machine_id" in first_issue
        assert "status" in first_issue
        assert "evidence" in first_issue


def test_update_issue_invalid_status():
    res = client.put(
        "/api/issues/1",
        json={
            "status": "INVALID_STATUS",
            "supervisor_notes": "Testing invalid payload",
        },
    )
    assert res.status_code == 400


def test_deterministic_handover_report_text():
    res = client.get("/api/handover?date=2026-02-27&shift=B")
    assert res.status_code == 200
    report = res.json()["handover_report"]
    assert "DURING SHIFT B" in report
    # Future issues (originating after selected shift/date) must not appear
    assert "2026-03-01" not in report


def test_handover_structured_endpoint():
    res = client.get("/api/handover/structured?date=2026-02-27&shift=B")
    assert res.status_code == 200
    data = res.json()
    assert data["date"] == "2026-02-27"
    assert data["shift"] == "B"
    assert data["next_shift"] == "C"
    assert "summary" in data
    assert "this_shift" in data
    assert "carry_over" in data
    assert "next_steps" in data
    assert "text" in data

    # Verify M-06 classification
    m06 = next((m for m in data["carry_over"] if m["machine_id"] == "M-06"), None)
    if m06:
        assert m06["severity"] == "critical"
        assert m06["streak"] >= 6


def test_handover_invalid_shift():
    res = client.get("/api/handover/structured?date=2026-02-27&shift=Z")
    assert res.status_code == 400


def test_shift_ordinal_progression():
    ord_a = shift_ordinal("2026-02-27", "A")
    ord_b = shift_ordinal("2026-02-27", "B")
    ord_c = shift_ordinal("2026-02-27", "C")
    ord_next_a = shift_ordinal("2026-02-28", "A")

    assert ord_b == ord_a + 1
    assert ord_c == ord_b + 1
    assert ord_next_a == ord_c + 1


def test_streak_calculation():
    # Consecutive ordinals: 10, 11, 12 -> unbroken streak of 3
    assert compute_streak([10, 11, 12]) == 3
    # Broken sequence: 10, 12, 13 -> streak ending at 13 is 2
    assert compute_streak([10, 12, 13]) == 2
    # Single anomaly
    assert compute_streak([50]) == 1
    # Empty
    assert compute_streak([]) == 0


def test_severity_rules():
    assert calculate_severity(streak=6, count=6) == "critical"
    assert calculate_severity(streak=1, count=10) == "critical"
    assert calculate_severity(streak=2, count=3) == "warning"
    assert calculate_severity(streak=1, count=2) == "warning"
    assert calculate_severity(streak=1, count=1) == "info"