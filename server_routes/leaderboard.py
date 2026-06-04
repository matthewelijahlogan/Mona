import json
import os
from datetime import datetime, timezone
from threading import Lock
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from config import ELEMENTS_ORDER
from logic.predictor_scoring import score_feature_vector

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEADERBOARD_PATH = os.getenv(
    "MONA_LEADERBOARD_PATH",
    os.path.join(BASE_DIR, "data", "recipe_leaderboard.json"),
)
LEADERBOARD_LOCK = Lock()


class RecipeSubmissionRequest(BaseModel):
    recipe_name: str = Field(..., min_length=1, max_length=80)
    submitted_by: str = Field(default="Anonymous", max_length=80)
    cancer_type: str = Field(..., min_length=1)
    elements: dict[str, float]


def _load_entries() -> list[dict[str, Any]]:
    if not os.path.exists(LEADERBOARD_PATH):
        return []

    try:
        with open(LEADERBOARD_PATH, "r", encoding="utf-8") as file:
            data = json.load(file)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Leaderboard storage is unreadable.") from exc

    return data if isinstance(data, list) else []


def _save_entries(entries: list[dict[str, Any]]) -> None:
    os.makedirs(os.path.dirname(LEADERBOARD_PATH), exist_ok=True)
    with open(LEADERBOARD_PATH, "w", encoding="utf-8") as file:
        json.dump(entries, file, indent=2)


def _normalize_elements(elements: dict[str, float]) -> dict[str, float]:
    normalized: dict[str, float] = {}

    for symbol, raw_amount in elements.items():
        if symbol not in ELEMENTS_ORDER:
            raise ValueError(f"Unsupported element: {symbol}")

        try:
            amount = float(raw_amount)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Invalid amount for {symbol}") from exc

        if amount < 0:
            raise ValueError(f"Element amounts must be zero or greater: {symbol}")

        if amount > 0:
            normalized[symbol] = round(amount, 4)

    if not normalized:
        raise ValueError("At least one element amount greater than zero is required.")

    return normalized


def _format_amount(amount: float) -> str:
    if float(amount).is_integer():
        return str(int(amount))
    return f"{amount:.2f}".rstrip("0").rstrip(".")


def _build_formula(elements: dict[str, float]) -> str:
    parts: list[str] = []
    for symbol in ELEMENTS_ORDER:
        amount = elements.get(symbol)
        if amount:
            parts.append(f"{symbol}{_format_amount(amount)}")
    return "".join(parts)


def _build_feature_vector(elements: dict[str, float]) -> list[float]:
    return [float(elements.get(symbol, 0.0)) for symbol in ELEMENTS_ORDER]


def _sorted_entries(
    entries: list[dict[str, Any]],
    cancer_type: str | None,
    limit: int,
) -> list[dict[str, Any]]:
    filtered = [
        entry for entry in entries if cancer_type is None or entry.get("cancer_type") == cancer_type
    ]
    filtered.sort(
        key=lambda entry: (float(entry.get("prediction", 0.0)), entry.get("created_at", "")),
        reverse=True,
    )
    return filtered[:limit]


@router.get("")
def get_leaderboard(
    cancer_type: str | None = None,
    limit: int = Query(10, ge=1, le=50),
):
    try:
        entries = _load_entries()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    ranked_entries = _sorted_entries(entries, cancer_type, limit)
    return {
        "cancer_type": cancer_type,
        "entries": ranked_entries,
        "total": len(ranked_entries),
    }


@router.post("/submit")
def submit_recipe(req: RecipeSubmissionRequest):
    try:
        normalized_elements = _normalize_elements(req.elements)
        scoring = score_feature_vector(_build_feature_vector(normalized_elements), req.cancer_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to score recipe: {exc}") from exc

    created_at = datetime.now(timezone.utc).isoformat()
    entry = {
        "id": f"{req.cancer_type}:{req.recipe_name}:{created_at}",
        "recipe_name": req.recipe_name.strip(),
        "submitted_by": req.submitted_by.strip() or "Anonymous",
        "cancer_type": req.cancer_type,
        "elements": normalized_elements,
        "formula": _build_formula(normalized_elements),
        "prediction": scoring["prediction"],
        "raw_prediction": scoring["raw_prediction"],
        "predicted_auc": scoring["predicted_auc"],
        "sensitivity_band": scoring["sensitivity_band"],
        "sensitivity_percentile": scoring["sensitivity_percentile"],
        "effective": scoring["effective"],
        "threshold_auc": scoring["threshold_auc"],
        "created_at": created_at,
    }

    with LEADERBOARD_LOCK:
        try:
            entries = _load_entries()
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

        entries.append(entry)
        _save_entries(entries)
        ranked_entries = _sorted_entries(entries, req.cancer_type, 10)

    rank = next(
        (
            index + 1
            for index, ranked_entry in enumerate(ranked_entries)
            if ranked_entry.get("id") == entry["id"]
        ),
        None,
    )

    return {
        "entry": entry,
        "rank": rank,
        "leaderboard": ranked_entries,
    }
