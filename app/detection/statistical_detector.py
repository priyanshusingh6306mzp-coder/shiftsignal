
import pandas as pd


FEATURES = [
    "output_deviation_pct",
    "defect_rate_pct",
    "downtime_pct",
]

THRESHOLD = 3.5
TRAINING_DAYS = 15


def detect_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    result["date"] = pd.to_datetime(result["date"])

    # First 15 days are the reference period
    start_date = result["date"].min()
    training_mask = result["date"] < (
        start_date + pd.Timedelta(days=TRAINING_DAYS)
    )

    training = result.loc[training_mask]

    if training.empty:
        raise ValueError("Training data is empty.")

    for feature in FEATURES:
        grouped = training.groupby("machine_id")[feature]

        medians = grouped.median()

        mads = grouped.apply(
            lambda values: (values - values.median()).abs().median()
        )

        stds = grouped.std()

        # Robust scale estimate with fallback
        scales = 1.4826 * mads
        scales = scales.where(scales > 0, stds)
        scales = scales.fillna(1).replace(0, 1)

        # Apply training baselines to all observations
        result[f"{feature}_zscore"] = (
            result[feature] - result["machine_id"].map(medians)
        ) / result["machine_id"].map(scales)

        result[f"{feature}_zscore"] = (
            result[f"{feature}_zscore"].fillna(0)
        )

    result["output_anomaly"] = (
        result["output_deviation_pct_zscore"].abs() > THRESHOLD
    )

    result["defect_anomaly"] = (
        result["defect_rate_pct_zscore"] > THRESHOLD
    )

    result["downtime_anomaly"] = (
        result["downtime_pct_zscore"] > THRESHOLD
    )

    flag_columns = [
        "output_anomaly",
        "defect_anomaly",
        "downtime_anomaly",
    ]

    result["is_anomaly"] = result[flag_columns].any(axis=1)

    # Training records are not part of the evaluation period
    result.loc[training_mask, "is_anomaly"] = False

    def get_reasons(row):
        reasons = []

        if row["output_anomaly"]:
            reasons.append("Unusual output deviation")

        if row["defect_anomaly"]:
            reasons.append("Unusually high defect rate")

        if row["downtime_anomaly"]:
            reasons.append("Unusually high downtime")

        return ", ".join(reasons)

    result["anomaly_reasons"] = result.apply(get_reasons, axis=1)

    return result
