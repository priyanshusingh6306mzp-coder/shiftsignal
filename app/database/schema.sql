-- app/database/schema.sql

CREATE TABLE IF NOT EXISTS machines (
    machine_id TEXT PRIMARY KEY,
    production_line TEXT,
    baseline_output INTEGER
);

CREATE TABLE IF NOT EXISTS anomalies (
    anomaly_id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    date TEXT NOT NULL,
    shift TEXT NOT NULL,
    anomaly_type TEXT NOT NULL, -- e.g., 'downtime_spike', 'gradual_deterioration'
    severity_score REAL NOT NULL, -- The z-score value
    evidence TEXT NOT NULL -- e.g., 'Downtime 150m exceeds median 30m'
);

CREATE TABLE IF NOT EXISTS issues (
    issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    anomaly_id INTEGER,
    machine_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, ACKNOWLEDGED, RESOLVED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    supervisor_notes TEXT,
    FOREIGN KEY(anomaly_id) REFERENCES anomalies(anomaly_id)
);