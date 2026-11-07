
import pandas as pd
from app.analytics.features import engineer_features

df = pd.read_csv("data/generated/production_records.csv")

featured_df = engineer_features(df)

print("Original shape:", df.shape)
print("New shape:", featured_df.shape)

print("\nNew features:")
print(featured_df[
    [
        "machine_id",
        "date",
        "shift",
        "achievement_pct",
        "defect_rate_pct",
        "downtime_pct",
        "yield_pct",
        "output_deviation_pct",
    ]
].head())

print("\nFeature summary:")
print(featured_df[
    [
        "achievement_pct",
        "defect_rate_pct",
        "downtime_pct",
        "yield_pct",
        "output_deviation_pct",
    ]
].describe())
