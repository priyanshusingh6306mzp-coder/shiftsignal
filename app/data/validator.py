
from pathlib import Path
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = PROJECT_ROOT / "data" / "generated"
LABEL_DIR = PROJECT_ROOT / "data" / "ground_truth"

production = pd.read_csv(DATA_DIR / "production_records.csv")
machines = pd.read_csv(DATA_DIR / "machines.csv")
ground_truth = pd.read_csv(
    LABEL_DIR / "ground_truth_anomalies.csv"
)

# 1. Check dataset size
assert len(production) == 1080
assert len(machines) == 6

# 2. Check unique production records
assert production["record_id"].is_unique

# 3. Check missing values
assert production.isnull().sum().sum() == 0

# 4. Check production values
assert (production["planned_output"] > 0).all()
assert (production["actual_output"] > 0).all()
assert (production["defect_count"] >= 0).all()
assert (
    production["defect_count"] <= production["actual_output"]
).all()

# 5. Check downtime and operating time
assert (
    production["downtime_minutes"]
    <= production["shift_duration_minutes"]
).all()

assert (
    production["operating_minutes"]
    + production["downtime_minutes"]
    == production["shift_duration_minutes"]
).all()

# 6. Check anomaly labels
assert len(ground_truth) == 27

assert set(ground_truth["record_id"]).issubset(
    set(production["record_id"])
)

expected_anomalies = {
    "downtime_spike",
    "defect_surge",
    "production_drop",
    "gradual_deterioration"
}

assert set(ground_truth["anomaly_type"]) == expected_anomalies

# 7. Ensure labels are not included in model input records
assert "anomaly_type" not in production.columns

print("\nALL DATA VALIDATION CHECKS PASSED!")
print("----------------------------------")
print("Production rows:", len(production))
print("Machine count:", len(machines))
print("Ground-truth anomaly rows:", len(ground_truth))
print("Missing values:", production.isnull().sum().sum())
print("Unique record IDs:", production["record_id"].nunique())

