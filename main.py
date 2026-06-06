import json
import logging
import os
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import DYNAMIC_CANCER_TYPE_MAP, MODEL_PATH, predictor_metadata
from logic.element_utils import get_elements_data
from server_routes.leaderboard import router as leaderboard_router
from server_routes.predict import router as predict_router
from server_routes.simulate import router as simulate_router
from server_routes.top_synthetic import router as top_synthetic_router

logger = logging.getLogger(__name__)
PREDICTOR_SUPPORTED_CANCERS = set(predictor_metadata.get("supported_cancer_types", []))

app = FastAPI(
    title="Mona Cancer Simulation",
    description=(
        "Machine learning powered cancer treatment simulation API. "
        "Predicts effectiveness of chemical elements and compounds against "
        "various cancer types."
    ),
    version="2.0.2",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulate_router)
app.include_router(top_synthetic_router)
app.include_router(predict_router)
app.include_router(leaderboard_router)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PERIODIC_PATH = os.path.join(DATA_DIR, "periodic_table.csv")
CANCER_TYPES_PATH = os.path.join(DATA_DIR, "cancer_types.json")

try:
    with open(CANCER_TYPES_PATH, "r", encoding="utf-8") as f:
        cancer_json = json.load(f)
except FileNotFoundError:
    cancer_json = []
    logger.warning("Missing file %s. Cancer type metadata unavailable.", CANCER_TYPES_PATH)


def get_specific_cancer_types(general_type: str) -> List[str]:
    return [ct["name"] for ct in cancer_json if ct.get("general_type") == general_type]


@app.get("/elements")
def list_elements():
    if not os.path.exists(PERIODIC_PATH):
        raise HTTPException(status_code=500, detail="Periodic table data missing.")

    return [element["symbol"] for element in get_elements_data() if element.get("symbol")]


@app.get("/cancer-types")
def list_cancer_types():
    result = []

    for cancer_type in DYNAMIC_CANCER_TYPE_MAP.keys():
        specific_types = get_specific_cancer_types(cancer_type)
        cancer_info = next((c for c in cancer_json if c.get("name") == cancer_type), {})
        result.append(
            {
                "name": cancer_type,
                "supported_by_model": cancer_type in PREDICTOR_SUPPORTED_CANCERS,
                "specific_types": specific_types,
                "description": cancer_info.get("description", ""),
                "tissue": cancer_info.get("tissue", ""),
                "aggressiveness_score": cancer_info.get("aggressiveness_score", 0),
            }
        )

    return result


@app.get("/status")
def api_status():
    status = {
        "server": "online",
        "model_loaded": False,
        "model_file_exists": os.path.exists(MODEL_PATH),
        "model_path": MODEL_PATH if os.path.exists(MODEL_PATH) else None,
        "periodic_table_exists": os.path.exists(PERIODIC_PATH),
        "cancer_types_loaded": len(cancer_json) > 0,
        "num_cancer_types": len(DYNAMIC_CANCER_TYPE_MAP),
        "predictor_supported_cancers": len(PREDICTOR_SUPPORTED_CANCERS),
        "data_dir": DATA_DIR,
    }

    if all(
        [
            status["model_file_exists"],
            status["periodic_table_exists"],
            status["cancer_types_loaded"],
        ]
    ):
        status["health"] = "Healthy"
    else:
        status["health"] = "Partial: one or more components missing"

    return status


if __name__ == "__main__":
    print("ELEMENTS_DIR resolved to:", os.path.join(os.getcwd(), "data", "elements"))
    print("\nValidating cancer type mappings...")
    print("----------------------------------------")
    for cancer_type in DYNAMIC_CANCER_TYPE_MAP:
        specific = get_specific_cancer_types(cancer_type)
        mapped = ", ".join(specific) if specific else cancer_type
        print(f"'{cancer_type}' -> {mapped}")
    print("----------------------------------------\n")

    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
