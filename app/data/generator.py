
from pathlib import Path

import numpy as np
import pandas as pd


# --------------------------------------------------
# 1. PROJECT CONFIGURATION
# --------------------------------------------------

SEED = 42
TOTAL_DAYS = 60
SHIFTS = ["A", "B", "C"]
SHIFT_DURATION = 480  # 8 hours in minutes

rng = np.random.default_rng(SEED)

PROJECT_ROOT = Path(__file__).resolve().parents[2]

GENERATED_DIR = PROJECT_ROOT / "data" / "generated"
GROUND_TRUTH_DIR = PROJECT_ROOT / "data" / "ground_truth"

GENERATED_DIR.mkdir(parents=True, exist_ok=True)
GROUND_TRUTH_DIR.mkdir(parents=True, exist_ok=True)

NOTICE = "SYNTHETIC DATA - SIMULATED MANUFACTURING SCENARIOS"


# --------------------------------------------------
# 2. MACHINE CONFIGURATION
# --------------------------------------------------

machines = [
    {"machine_id": "M-01", "line_id": "L-01",
     "baseline_output": 500, "baseline_downtime": 20,
     "defect_rate": 0.020},

    {"machine_id": "M-02", "line_id": "L-01",
     "baseline_output": 450, "baseline_downtime": 25,
     "defect_rate": 0.030},

    {"machine_id": "M-03", "line_id": "L-01",
     "baseline_output": 600, "baseline_downtime": 15,
     "defect_rate": 0.015},

    {"machine_id": "M-04", "line_id": "L-02",
     "baseline_output": 400, "baseline_downtime": 30,
     "defect_rate": 0.025},

    {"machine_id": "M-05", "line_id": "L-02",
     "baseline_output": 550, "baseline_downtime": 20,
     "defect_rate": 0.020},

    {"machine_id": "M-06", "line_id": "L-02",
     "baseline_output": 480, "baseline_downtime": 18,
     "defect_rate": 0.018},
]

machines_df = pd.DataFrame(machines)
machines_df["dataset_notice"] = NOTICE


# --------------------------------------------------
# 3. GENERATE NORMAL PRODUCTION RECORDS
# --------------------------------------------------

production_records = []
ground_truth = []

start_date = pd.Timestamp("2026-01-01")

for day in range(TOTAL_DAYS):

    current_date = start_date + pd.Timedelta(days=day)

    for shift in SHIFTS:

        for machine in machines:

            machine_id = machine["machine_id"]

            planned = machine["baseline_output"]

            # Normal random variation
            output_factor = rng.normal(0.96, 0.025)
            actual = int(planned * output_factor)

            downtime = int(
                rng.normal(machine["baseline_downtime"], 5)
            )
            downtime = int(np.clip(downtime, 0, 120))

            defects = int(
                rng.binomial(actual, machine["defect_rate"])
            )

            record_id = (
                f"{current_date.strftime('%Y%m%d')}"
                f"-{shift}-{machine_id}"
            )

            anomaly_type = None
            severity = None
            description = None

            # --------------------------------------
            # 4. INJECT KNOWN ANOMALIES
            # --------------------------------------

            # Scenario 1: Downtime spike
            if (
                machine_id == "M-01"
                and day == 20
                and shift == "B"
            ):
                downtime = 150
                anomaly_type = "downtime_spike"
                severity = "high"
                description = "Unusually high machine downtime"

            # Scenario 2: Defect surge
            elif (
                machine_id == "M-02"
                and day == 30
                and shift == "A"
            ):
                defects = int(actual * 0.12)
                anomaly_type = "defect_surge"
                severity = "high"
                description = "Defect rate increased significantly"

            # Scenario 3: Sudden production drop
            elif (
                machine_id == "M-04"
                and day == 40
                and shift == "C"
            ):
                actual = int(actual * 0.45)
                defects = min(defects, actual)
                anomaly_type = "production_drop"
                severity = "high"
                description = "Sudden reduction in production output"

            # Scenario 4: Gradual deterioration
            elif machine_id == "M-06" and day >= 52:

                deterioration = 0.95 - (
                    (day - 52) * 0.06
                )

                actual = int(actual * deterioration)
                defects = min(defects, actual)

                anomaly_type = "gradual_deterioration"
                severity = "medium"
                description = "Gradual decline in production output"

            # --------------------------------------
            # 5. STORE PRODUCTION RECORD
            # --------------------------------------

            production_records.append({
                "record_id": record_id,
                "date": current_date.date(),
                "shift": shift,
                "machine_id": machine_id,
                "line_id": machine["line_id"],
                "planned_output": planned,
                "actual_output": actual,
                "defect_count": defects,
                "downtime_minutes": downtime,
                "operating_minutes": SHIFT_DURATION - downtime,
                "shift_duration_minutes": SHIFT_DURATION,
                "dataset_notice": NOTICE
            })

            # --------------------------------------
            # 6. STORE GROUND-TRUTH LABEL SEPARATELY
            # --------------------------------------

            if anomaly_type is not None:

                ground_truth.append({
                    "record_id": record_id,
                    "machine_id": machine_id,
                    "date": current_date.date(),
                    "shift": shift,
                    "anomaly_type": anomaly_type,
                    "severity": severity,
                    "description": description,
                    "dataset_notice": NOTICE
                })


# --------------------------------------------------
# 7. CONVERT TO DATAFRAMES
# --------------------------------------------------

production_df = pd.DataFrame(production_records)
ground_truth_df = pd.DataFrame(ground_truth)


# --------------------------------------------------
# 8. CREATE ISSUE EVENTS
# --------------------------------------------------

issue_events = []

for index, anomaly_type in enumerate(
    ground_truth_df["anomaly_type"].unique(), start=1
):

    first_record = ground_truth_df[
        ground_truth_df["anomaly_type"] == anomaly_type
    ].iloc[0]

    issue_events.append({
        "issue_id": f"ISS-{index:03d}",
        "machine_id": first_record["machine_id"],
        "date": first_record["date"],
        "shift": first_record["shift"],
        "event_type": anomaly_type,
        "description": first_record["description"],
        "status": "OPEN",
        "dataset_notice": NOTICE
    })

issues_df = pd.DataFrame(issue_events)


# --------------------------------------------------
# 9. SAVE CSV FILES
# --------------------------------------------------

production_df.to_csv(
    GENERATED_DIR / "production_records.csv",
    index=False
)

machines_df.to_csv(
    GENERATED_DIR / "machines.csv",
    index=False
)

issues_df.to_csv(
    GENERATED_DIR / "issue_events.csv",
    index=False
)

ground_truth_df.to_csv(
    GROUND_TRUTH_DIR / "ground_truth_anomalies.csv",
    index=False
)


# --------------------------------------------------
# 10. DISPLAY GENERATION SUMMARY
# --------------------------------------------------

print("\nSHIFT SIGNAL DATA GENERATION COMPLETE")
print("--------------------------------------")

print("Dataset:", NOTICE)
print("Total production records:", len(production_df))
print("Total machines:", production_df["machine_id"].nunique())
print("Total days:", production_df["date"].nunique())
print("Total shifts:", production_df["shift"].nunique())

print("\nAnomaly distribution:")
print(ground_truth_df["anomaly_type"].value_counts())

print("\nSaved files:")
print("1. data/generated/production_records.csv")
print("2. data/generated/machines.csv")
print("3. data/generated/issue_events.csv")
print("4. data/ground_truth/ground_truth_anomalies.csv")
