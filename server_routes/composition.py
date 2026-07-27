from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from logic.composition_scoring import (
    analyze_composition,
    list_elements,
    supported_cancer_types,
)

router = APIRouter(prefix="/composition", tags=["Composition"])


class CompositionRequest(BaseModel):
    elements: dict[str, float] = Field(..., min_length=1)
    cancer_type: str = Field(..., min_length=1, max_length=120)


@router.get("/catalog")
def composition_catalog() -> dict[str, Any]:
    return {
        "elements": list_elements(),
        "element_count": len(list_elements()),
        "direct_cancer_types": supported_cancer_types(),
    }


@router.post("/analyze")
def analyze(req: CompositionRequest) -> dict[str, Any]:
    try:
        return analyze_composition(req.elements, req.cancer_type.strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Element data unavailable: {exc}") from exc
