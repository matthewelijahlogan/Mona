# File: server_routes/simulate.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import traceback

from config import DYNAMIC_CANCER_TYPE_MAP
from logic.data_loader import load_all_elements, load_cancer_types
from logic.simulate_interaction import simulate_all_elements_for_cancer

router = APIRouter()

SYNTHETIC_SCORES_PATH = "data/synthetic_element_scores.csv"
elements_data = load_all_elements()
cancer_types = load_cancer_types()

class SimulateRequest(BaseModel):
    element: str
    type: str

class SimulateAllElementsRequest(BaseModel):
    cancer_type: str
    element: str | None = None

@router.post("/simulate")
def simulate(req: SimulateRequest):
    if not req.element or not req.type:
        raise HTTPException(status_code=400, detail="Missing element or cancer type")
    # fallback to your existing simulate_interaction if you still need it
    from logic.simulate_interaction import simulate_interaction
    return simulate_interaction(req.element, req.type, elements_data, cancer_types)

@router.post("/simulate-all-elements")
def simulate_all_elements(req: SimulateAllElementsRequest):
    try:
        cancer_type = req.cancer_type.strip()
        if cancer_type not in DYNAMIC_CANCER_TYPE_MAP:
            raise HTTPException(status_code=400, detail=f"Unknown cancer type: '{cancer_type}'")

        results = simulate_all_elements_for_cancer(cancer_type, elements_data, cancer_types)
        for r in results:
            c = r["confidence"]
            if c >= 0.7:
                r["result"] = "Effective"
            elif c >= 0.4:
                r["result"] = "Moderate"
            else:
                r["result"] = "Ineffective"

        results.sort(key=lambda x: x["confidence"], reverse=True)
        return {"cancer_type": cancer_type, "top_predictions": results}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
