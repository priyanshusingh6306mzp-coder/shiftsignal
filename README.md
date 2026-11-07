# ShiftSignal ⚡ | Industrial Production Intelligence & Shift Handover Engine

ShiftSignal is an industrial manufacturing intelligence prototype designed to monitor machine telemetry, detect operational anomalies with statistical rigor, and generate deterministic, evidence-backed shift handover reports.

Unlike black-box LLM systems prone to hallucinating root causes or non-existent equipment faults, ShiftSignal enforces explainability by deriving every operational insight directly from deterministic database facts and robust statistical baselines.

---

## 🛠 System Architecture

```text
[ Synthetic Telemetry Engine ]
  ↳ 6 Machines, 60 Days, Baseline vs Degraded Profiles
         │
         ▼
[ Statistical Anomaly Pipeline ]
  ↳ Median Absolute Deviation (Robust Z-Score) Evaluation
         │
         ▼
[ SQLite Relational Store ]
  ↳ Tables: machines, anomalies, issues (Lifecycle State Engine)
         │
         ▼
[ FastAPI Backend (Port 8000) ]
  ↳ REST API: /api/overview, /api/issues, /api/handover
         │
         ▼
[ React + Vite Frontend (Port 5173) ]
  ↳ Industrial Dark Mode, Recharts Incident Timeline, In-Table Issue Lifecycle