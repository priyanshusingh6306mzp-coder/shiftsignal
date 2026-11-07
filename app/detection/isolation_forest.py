
import pandas as pd
from sklearn.ensemble import IsolationForest


FEATURES = [
    "output_deviation_pct",
    "defect_rate_pct",
    "downtime_pct",
]


def detect_with_isolation_forest(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()

    result["date"] = pd.to_datetime(result["date"])

    result = result.sort_values(
        ["date", "shift", "machine_id"]
    ).copy()

    # Split chronologically
    training_mask = result["date"] < (
        result["date"].min() + pd.Timedelta(days=15)
    )

    X_train = result.loc[training_mask, FEATURES].copy()
    X_test = result.loc[~training_mask, FEATURES].copy()

    if X_train.empty or X_test.empty:
        raise ValueError("Training or testing dataset is empty.")

    # Calculate machine-specific training baselines
    training = result.loc[training_mask].copy()
    testing = result.loc[~training_mask].copy()

    medians = training.groupby("machine_id")[FEATURES].median()

    mads = training.groupby("machine_id")[FEATURES].agg(
        lambda col: (col - col.median()).abs().median()
    )

    scales = 1.4826 * mads

    # Fallback when MAD is zero
    stds = training.groupby("machine_id")[FEATURES].std()
    scales = scales.where(scales > 0, stds)
    scales = scales.fillna(1).replace(0, 1)

    def normalize(data):
        values = data[FEATURES].copy()

        for machine in data["machine_id"].unique():
            mask = data["machine_id"] == machine

            values.loc[mask] = (
                data.loc[mask, FEATURES] - medians.loc[machine]
            ) / scales.loc[machine]

        return values

    X_train_scaled = normalize(training)
    X_test_scaled = normalize(testing)

    # Train model on normalized training data
    model = IsolationForest(
        n_estimators=200,
        contamination=0.03,
        random_state=42
    )

    model.fit(X_train_scaled)

    predictions = model.predict(X_test_scaled)

    result["isolation_anomaly"] = False

    result.loc[
        testing.index,
        "isolation_anomaly"
    ] = predictions == -1

    return result
