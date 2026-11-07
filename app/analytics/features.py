
import pandas as pd


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate operational KPIs from production records.
    Returns a copy; the original dataset remains unchanged.
    """

    required_columns = [
        "planned_output",
        "actual_output",
        "defect_count",
        "downtime_minutes",
        "shift_duration_minutes",
    ]

    missing = [col for col in required_columns if col not in df.columns]

    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    if (df["planned_output"] <= 0).any():
        raise ValueError("Planned output must be greater than zero.")

    if (df["actual_output"] <= 0).any():
        raise ValueError("Actual output must be greater than zero.")

    if (df["shift_duration_minutes"] <= 0).any():
        raise ValueError("Shift duration must be greater than zero.")

    result = df.copy()

    result["achievement_pct"] = (
        result["actual_output"] / result["planned_output"]
    ) * 100

    result["defect_rate_pct"] = (
        result["defect_count"] / result["actual_output"]
    ) * 100

    result["downtime_pct"] = (
        result["downtime_minutes"] / result["shift_duration_minutes"]
    ) * 100

    result["yield_pct"] = (
        (result["actual_output"] - result["defect_count"])
        / result["actual_output"]
    ) * 100

    result["output_deviation_pct"] = (
        (result["actual_output"] - result["planned_output"])
        / result["planned_output"]
    ) * 100

    return result
