
import pandas as pd

from app.analytics.features import engineer_features
from app.detection.isolation_forest import detect_with_isolation_forest

production = pd.read_csv("data/generated/production_records.csv")

featured = engineer_features(production)

detected = detect_with_isolation_forest(featured)

test_data = detected[
    pd.to_datetime(detected["date"]) >= "2026-01-16"
]

print("Total test records:", len(test_data))
print(
    "Isolation Forest anomalies:",
    test_data["isolation_anomaly"].sum()
)

print("\nDetected records:")

print(
    test_data.loc[
        test_data["isolation_anomaly"],
        [
            "record_id",
            "machine_id",
            "date",
            "shift",
            "output_deviation_pct",
            "defect_rate_pct",
            "downtime_pct",
        ]
    ].to_string(index=False)
)

print("\nAnomalies by machine:")

print(
    test_data.groupby("machine_id")["isolation_anomaly"].sum()
)

