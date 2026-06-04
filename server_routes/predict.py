from bisect import bisect_right
from typing import List

import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import ELEMENTS_ORDER, model, predictor_metadata

EXPECTED_FEATURE_COUNT = len(ELEMENTS_ORDER)
SUPPORTED_CANCER_TYPES = predictor_metadata.get("supported_cancer_types", [])
AUC_REFERENCE_VALUES = predictor_metadata.get("auc_reference_values", [])
SENSITIVITY_THRESHOLD_AUC = predictor_metadata.get("sensitivity_threshold_auc", 0.0)

router = APIRouter()


class PredictRequest(BaseModel):
    features: List[float]
    cancer_type: str


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


@router.post("/predict")
def predict_auc(req: PredictRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded.")

    if not req.features or len(req.features) != EXPECTED_FEATURE_COUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Features must be a list of {EXPECTED_FEATURE_COUNT} floats.",
        )

    if req.cancer_type not in SUPPORTED_CANCER_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown cancer type: {req.cancer_type}. "
                f"Valid predictor options: {SUPPORTED_CANCER_TYPES}"
            ),
        )

    input_payload = {
        **{element: value for element, value in zip(ELEMENTS_ORDER, req.features)},
        "cancer_type": req.cancer_type,
    }

    try:
        input_df = pd.DataFrame([input_payload], columns=[*ELEMENTS_ORDER, "cancer_type"])
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create input DataFrame: {exc}",
        ) from exc

    try:
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
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {exc}",
        ) from exc
