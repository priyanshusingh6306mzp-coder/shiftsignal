
import pandas as pd

from app.analytics.features import engineer_features
from app.detection.statistical_detector import detect_anomalies

# Load data
production = pd.read_csv("data/generated/production_records.csv")
ground_truth = pd.read_csv("data/ground_truth/ground_truth_anomalies.csv")

# Generate predictions without using ground-truth labels
featured = engineer_features(production)
predictions = detect_anomalies(featured)

# Add ground-truth labels ONLY for evaluation
actual_ids = set(ground_truth["record_id"])

predictions["actual_anomaly"] = (
    predictions["record_id"].isin(actual_ids)
)

# Calculate confusion matrix values
tp = (
    predictions["is_anomaly"] & predictions["actual_anomaly"]
).sum()

fp = (
    predictions["is_anomaly"] & ~predictions["actual_anomaly"]
).sum()

fn = (
    ~predictions["is_anomaly"] & predictions["actual_anomaly"]
).sum()

tn = (
    ~predictions["is_anomaly"] & ~predictions["actual_anomaly"]
).sum()

# Calculate metrics
precision = tp / (tp + fp) if (tp + fp) else 0
recall = tp / (tp + fn) if (tp + fn) else 0

f1 = (
    2 * precision * recall / (precision + recall)
    if (precision + recall) else 0
)

print("CONFUSION MATRIX")
print("----------------")
print("True Positives :", tp)
print("False Positives:", fp)
print("False Negatives:", fn)
print("True Negatives :", tn)

print("\nEVALUATION METRICS")
print("------------------")
print(f"Precision: {precision:.3f}")
print(f"Recall:    {recall:.3f}")
print(f"F1-score:  {f1:.3f}")

# Evaluate each anomaly type separately
print("\nDETECTION BY ANOMALY TYPE")
print("-------------------------")

comparison = predictions.merge(
    ground_truth[["record_id", "anomaly_type"]],
    on="record_id",
    how="inner"
)

print(
    comparison.groupby("anomaly_type")["is_anomaly"]
    .agg(["count", "sum"])
    .rename(columns={"count": "actual_records", "sum": "detected_records"})
)
