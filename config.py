import json
import logging
import os

import joblib

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PERIODIC_PATH = os.path.join(DATA_DIR, "periodic_table.csv")
CANCER_TYPES_PATH = os.path.join(DATA_DIR, "cancer_types.json")
SYNTHETIC_SCORES_PATH = os.path.join(DATA_DIR, "synthetic_element_scores.csv")
MODEL_PATH = os.path.join(DATA_DIR, "rf_auc_predictor.joblib")
PREDICTOR_METADATA_PATH = os.path.join(DATA_DIR, "predictor_metadata.json")

ELEMENTS_ORDER = [
    "C", "H", "F", "N", "O", "Cl", "Br", "S", "I", "P", "K", "As", "B", "Na",
    "Sb", "Au", "V", "Bi", "Y", "Pt", "Zn", "Si", "Co", "Se", "Mn", "Fe",
    "Gd", "Ga", "In", "Li", "Hg", "Mg", "Ge", "Ag", "Sr", "Ti",
]

logger = logging.getLogger(__name__)
_model = None
_model_error = None

with open(CANCER_TYPES_PATH, encoding="utf-8") as f:
    cancer_json = json.load(f)

DYNAMIC_CANCER_TYPE_MAP = {entry["name"].strip(): idx for idx, entry in enumerate(cancer_json)}


def get_model():
    global _model, _model_error

    if _model is not None:
        return _model

    if _model_error is not None:
        return None

    try:
        # Memory-map the trained model when possible so smaller hosts do not
        # pull the entire artifact into RAM during startup.
        _model = joblib.load(MODEL_PATH, mmap_mode="r")
        logger.info("Model loaded successfully from %s", MODEL_PATH)
    except Exception as exc:
        logger.warning("Failed to load model from %s: %s", MODEL_PATH, exc)
        _model_error = exc
        _model = None

    return _model


def get_model_error():
    return _model_error

try:
    with open(PREDICTOR_METADATA_PATH, encoding="utf-8") as f:
        predictor_metadata = json.load(f)
except FileNotFoundError:
    logger.warning("Predictor metadata file not found at %s", PREDICTOR_METADATA_PATH)
    predictor_metadata = {}
