
import pandas as pd

from app.analytics.features import engineer_features
from app.detection.statistical_detector import detect_anomalies
from app.detection.isolation_forest import detect_with_isolation_forest


# ==================================================
# 1. LOAD DATA
# ==================================================

production = pd.read_csv(
    "data/generated/production_records.csv"
)

ground_truth = pd.read_csv(
    "data/ground_truth/ground_truth_anomalies.csv"
)

production["date"] = pd.to_datetime(production["date"])

# Ensure record IDs use the same data type
production["record_id"] = production["record_id"].astype(str)
ground_truth["record_id"] = ground_truth["record_id"].astype(str)

print("=" * 55)
print("SHIFTSIGNAL - ANOMALY DETECTOR EVALUATION")
print("=" * 55)

print("Total production records:", len(production))
print("Ground-truth anomalies:", len(ground_truth))


# ==================================================
# 2. FEATURE ENGINEERING
# ==================================================

featured = engineer_features(production)

print("\nFeature engineering completed.")
print("Features shape:", featured.shape)


# ==================================================
# 3. RUN BOTH DETECTORS
# ==================================================

statistical = detect_anomalies(featured)

isolation = detect_with_isolation_forest(featured)

# Both detectors use the first 15 days as training.
# Derive the common test start date dynamically.

start_date = featured["date"].min()

test_start = start_date + pd.Timedelta(days=15)

print("\nTRAINING AND TESTING PERIOD")
print("-" * 55)
print("Dataset start:", start_date.date())
print("Test starts:", test_start.date())

# Keep the same test period for both detectors
statistical["date"] = pd.to_datetime(statistical["date"])
isolation["date"] = pd.to_datetime(isolation["date"])

statistical = statistical[
    statistical["date"] >= test_start
].copy()

isolation = isolation[
    isolation["date"] >= test_start
].copy()

# Sort consistently
statistical = statistical.sort_values("record_id").reset_index(drop=True)
isolation = isolation.sort_values("record_id").reset_index(drop=True)

# Check both detectors evaluate identical records
assert statistical["record_id"].equals(isolation["record_id"]), (
    "Error: Both detectors are not evaluating the same records."
)

print("Test records:", len(statistical))


# ==================================================
# 4. ATTACH GROUND TRUTH FOR EVALUATION ONLY
# ==================================================

actual_ids = set(ground_truth["record_id"])

for df in [statistical, isolation]:

    df["actual"] = df["record_id"].isin(actual_ids)

    # Ensure predictions are boolean
    df["prediction"] = df[
        "is_anomaly" if df is statistical
        else "isolation_anomaly"
    ].astype(bool)


# ==================================================
# 5. METRIC CALCULATION
# ==================================================

def calculate_metrics(actual, predicted):

    actual = actual.astype(bool)
    predicted = predicted.astype(bool)

    tp = int((actual & predicted).sum())
    fp = int((~actual & predicted).sum())
    fn = int((actual & ~predicted).sum())
    tn = int((~actual & ~predicted).sum())

    precision = tp / (tp + fp) if tp + fp else 0
    recall = tp / (tp + fn) if tp + fn else 0

    f1 = (
        2 * precision * recall / (precision + recall)
        if precision + recall else 0
    )

    accuracy = (
        (tp + tn) / (tp + tn + fp + fn)
        if tp + tn + fp + fn else 0
    )

    return {
        "Detected": int(predicted.sum()),
        "TP": tp,
        "FP": fp,
        "FN": fn,
        "TN": tn,
        "Precision": round(precision, 3),
        "Recall": round(recall, 3),
        "F1": round(f1, 3),
        "Accuracy": round(accuracy, 3),
    }


# ==================================================
# 6. OVERALL DETECTOR COMPARISON
# ==================================================

stat_metrics = calculate_metrics(
    statistical["actual"],
    statistical["prediction"]
)

if_metrics = calculate_metrics(
    isolation["actual"],
    isolation["prediction"]
)

comparison = pd.DataFrame(
    [stat_metrics, if_metrics],
    index=["Robust Z-score", "Isolation Forest"]
)

print("\n" + "=" * 55)
print("OVERALL DETECTOR COMPARISON")
print("=" * 55)

print(comparison.to_string())


# ==================================================
# 7. DETECTION BY ANOMALY TYPE
# ==================================================

print("\n" + "=" * 55)
print("DETECTION BY ANOMALY TYPE")
print("=" * 55)

# Only test-period ground-truth records
test_labels = ground_truth[
    ground_truth["record_id"].isin(statistical["record_id"])
].copy()

# Join predictions with ground-truth anomaly types
stat_breakdown = test_labels.merge(
    statistical[["record_id", "prediction"]],
    on="record_id",
    how="left"
)

if_breakdown = test_labels.merge(
    isolation[["record_id", "prediction"]],
    on="record_id",
    how="left"
)

for name, breakdown in [
    ("ROBUST Z-SCORE", stat_breakdown),
    ("ISOLATION FOREST", if_breakdown),
]:

    print(f"\n{name}")
    print("-" * 55)

    result = (
        breakdown.groupby("anomaly_type")["prediction"]
        .agg(
            actual_records="count",
            detected_records="sum"
        )
    )

    result["missed_records"] = (
        result["actual_records"] - result["detected_records"]
    )

    result["detection_rate_pct"] = (
        result["detected_records"]
        / result["actual_records"] * 100
    ).round(2)

    print(result.to_string())


# ==================================================
# 8. INSPECT FALSE POSITIVES
# ==================================================

print("\n" + "=" * 55)
print("FALSE POSITIVE ANALYSIS")
print("=" * 55)

for name, df in [
    ("ROBUST Z-SCORE", statistical),
    ("ISOLATION FOREST", isolation),
]:

    false_positives = df[
        (~df["actual"]) & (df["prediction"])
    ]

    print(f"\n{name}: {len(false_positives)} false positives")

    if false_positives.empty:
        print("No false positives.")
    else:
        print(
            false_positives[
                [
                    "record_id",
                    "machine_id",
                    "date",
                    "shift"
                ]
            ].to_string(index=False)
        )


# ==================================================
# 9. FINAL RESULT
# ==================================================

print("\n" + "=" * 55)
print("EXPERIMENT COMPLETED")
print("=" * 55)

winner = comparison["F1"].idxmax()

print("Best detector by F1-score:", winner)
print("F1-score:", comparison.loc[winner, "F1"])

print("\nNote:")
print("Ground-truth labels were used only for evaluation.")
print("All production records are synthetic.")

# ==================================================
# 10. EXPORT ANOMALIES FOR BACKEND
# ==================================================
import os

# Filter for records that the Z-Score actually flagged as anomalies
detected_anomalies = statistical[statistical["prediction"] == True].copy()

# Save to the generated data folder
output_csv_path = os.path.join("data", "generated", "zscore_anomalies.csv")
detected_anomalies.to_csv(output_csv_path, index=False)

print(f"\nSaved {len(detected_anomalies)} detected anomalies to: {output_csv_path}")