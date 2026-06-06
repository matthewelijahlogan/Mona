from bisect import bisect_right

from config import DYNAMIC_CANCER_TYPE_MAP, ELEMENTS_ORDER, get_model, predictor_metadata

EXPECTED_FEATURE_COUNT = len(ELEMENTS_ORDER)
SUPPORTED_CANCER_TYPES = predictor_metadata.get("supported_cancer_types", [])
AUC_REFERENCE_VALUES = predictor_metadata.get("auc_reference_values", [])
SENSITIVITY_THRESHOLD_AUC = predictor_metadata.get("sensitivity_threshold_auc", 0.0)


def get_sensitivity_band(score: float) -> str:
    if score >= 0.9:
        return "Exceptional sensitivity"
    if score >= 0.75:
        return "Strong sensitivity"
    if score >= 0.5:
        return "Above-median sensitivity"
    if score >= 0.25:
        return "Limited sensitivity"
    return "Weak sensitivity"


def calculate_sensitivity_score(predicted_auc: float) -> tuple[float, float]:
    if not AUC_REFERENCE_VALUES:
        return 0.0, 0.0

    auc_percentile = bisect_right(AUC_REFERENCE_VALUES, predicted_auc) / len(AUC_REFERENCE_VALUES)
    sensitivity_score = 1.0 - auc_percentile
    return sensitivity_score, auc_percentile


def score_feature_vector(features: list[float], cancer_type: str) -> dict[str, float | str | bool]:
    model = get_model()

    if model is None:
        raise RuntimeError("Model not loaded.")

    if len(features) != EXPECTED_FEATURE_COUNT:
        raise ValueError(f"Features must be a list of {EXPECTED_FEATURE_COUNT} floats.")

    if cancer_type not in SUPPORTED_CANCER_TYPES:
        raise ValueError(
            f"Unknown cancer type: {cancer_type}. Valid predictor options: {SUPPORTED_CANCER_TYPES}"
        )

    input_payload = {
        **{element: value for element, value in zip(ELEMENTS_ORDER, features)},
        "cancer_type_index": DYNAMIC_CANCER_TYPE_MAP[cancer_type],
    }

    import pandas as pd

    input_df = pd.DataFrame([input_payload], columns=[*ELEMENTS_ORDER, "cancer_type_index"])
    predicted_auc = float(model.predict(input_df)[0])
    sensitivity_score, auc_percentile = calculate_sensitivity_score(predicted_auc)
    sensitivity_band = get_sensitivity_band(sensitivity_score)

    return {
        "prediction": round(sensitivity_score, 4),
        "raw_prediction": round(predicted_auc, 4),
        "predicted_auc": round(predicted_auc, 4),
        "sensitivity_score": round(sensitivity_score, 4),
        "sensitivity_percentile": round(sensitivity_score * 100, 2),
        "auc_percentile": round(auc_percentile * 100, 2),
        "sensitivity_band": sensitivity_band,
        "effective": predicted_auc <= SENSITIVITY_THRESHOLD_AUC,
        "threshold_auc": SENSITIVITY_THRESHOLD_AUC,
    }
