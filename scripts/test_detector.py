
import pandas as pd

from app.analytics.features import engineer_features
from app.detection.statistical_detector import detect_anomalies

# Load synthetic production data
df = pd.read_csv("data/generated/production_records.csv")

# Calculate operational features
featured_df = engineer_features(df)

# Detect anomalies without using ground-truth labels
detected_df = detect_anomalies(featured_df)

print("Total production records:", len(detected_df))
print("Detected anomalies:", detected_df["is_anomaly"].sum())

print("\nDetected records:")
print(
    detected_df.loc[
        detected_df["is_anomaly"],
        [
            "record_id",
            "machine_id",
            "date",
            "shift",
            "output_deviation_pct",
            "defect_rate_pct",
            "downtime_pct",
            "anomaly_reasons",
        ],
    ].to_string(index=False)
)

print("\nAnomalies by machine:")
print(
    detected_df.groupby("machine_id")["is_anomaly"]
    .sum()
)
