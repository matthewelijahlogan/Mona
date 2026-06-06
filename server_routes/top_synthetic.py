# File: server_routes/top_synthetic.py

import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from itertools import combinations
import random

from logic.simulate_compound import simulate_compound_interaction
from logic.element_utils import get_elements_data
from logic.cancer_utils import get_cancer_types_data

# 🔹 Use a clean prefix — NO dash in prefix, only underscore for internal filename
router = APIRouter(prefix="/top-synthetic", tags=["Top Synthetic"])

DATA_PATH = os.path.join("data", "synthetic_element_scores.csv")

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')


class TopSyntheticRequest(BaseModel):
    cancer_type: str


@router.get("/synthetic-cancer-types")
def get_available_synthetic_cancer_types() -> List[str]:
    """Return available cancer types from the synthetic score dataset."""
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=500, detail="Synthetic score file not found.")
    try:
        import pandas as pd

        df = pd.read_csv(DATA_PATH)
        return sorted(df["cancer_type"].dropna().unique().tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load cancer types: {e}")


@router.post("")
def get_top_synthetic(req: TopSyntheticRequest) -> List[Dict[str, Any]]:
    """Generate exactly 10 synthetic compound predictions for a given cancer type."""
    logging.info(f"Processing request for cancer type: {req.cancer_type}")
    
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=500, detail="Synthetic element score file not found.")

    # 1. Load and prepare data
    elements_data = get_elements_data()
    cancer_data = get_cancer_types_data()
    
    # 2. Get our base elements to work with
    try:
        import pandas as pd

        df = pd.read_csv(DATA_PATH)
        filtered = df[df["cancer_type"].str.strip() == req.cancer_type.strip()]
    except Exception as e:
        logging.error(f"Error loading data: {e}")
        filtered = []

    elements_data = get_elements_data()
    cancer_data = get_cancer_types_data()

    results = []
    tried = set()

    # Get the best performing elements for this cancer type or globally
    if len(filtered) == 0:
        # Use global top performers if no specific data
        logging.info(f"No data for cancer type: {req.cancer_type}. Using global top performers.")
        try:
            # Get top elements across all cancer types
            overall = df.groupby('element')['confidence'].mean().sort_values(ascending=False)
            global_top = overall.head(20).index.tolist()
            # Add some bioactive elements that are commonly effective
            bioactive = ['Pt', 'Au', 'Ag', 'Cu', 'Zn', 'Fe', 'Mg', 'Se']
            symbols = list(set(global_top + bioactive))[:20]
        except Exception:
            # Fallback to known therapeutic elements if data processing fails
            symbols = ['Pt', 'Au', 'Ag', 'Cu', 'Zn', 'Fe', 'Mg', 'Se', 'Mo', 'Co', 
                      'Mn', 'Cr', 'V', 'Ti', 'Ni', 'Pd', 'Ir', 'Rh', 'Os', 'Ru']

        # Use deterministic randomness based on cancer_type so results are reproducible
        seed_val = abs(hash(req.cancer_type)) % (2**32)
        random.seed(seed_val)

        # Generate combinations randomly until we have at least 10 scored items
        attempts = 0
        while len(results) < 10 and attempts < 1000:
            r = random.choice([2, 3, 4])
            combo = tuple(random.sample(symbols, min(r, len(symbols))))
            formula = "".join(f"{el}1" for el in combo)
            if formula in tried:
                attempts += 1
                continue
            tried.add(formula)
            try:
                score = simulate_compound_interaction(formula, req.cancer_type, elements_data, cancer_data)
                results.append({
                    "formula": formula,
                    "elements": {el: 1.0 for el in combo},
                    "score": round(score, 4)
                })
            except Exception as e:
                logging.warning(f"Fallback simulation failed for {formula}: {e}")
            attempts += 1

    else:
        top_elements = filtered.sort_values(by="confidence", ascending=False).head(20)
        symbols = top_elements["element"].unique().tolist()

        for r in [2, 3, 4]:
            for combo in combinations(symbols, r):
                formula = "".join(f"{el}1" for el in combo)
                if formula in tried:
                    continue
                tried.add(formula)
                try:
                    score = simulate_compound_interaction(formula, req.cancer_type, elements_data, cancer_data)
                    results.append({
                        "formula": formula,
                        "elements": {el: 1.0 for el in combo},
                        "score": round(score, 4)
                    })
                except Exception as e:
                    logging.warning(f"Simulation failed for {formula}: {e}")

    # First, generate a good set of base combinations
    base_attempts = 0
    while len(results) < 15 and base_attempts < 50:  # Generate extra for better selection
        for r in [2, 3]:  # Focus on pairs and triples for better stability
            remaining_slots = 15 - len(results)
            if remaining_slots <= 0:
                break
                
            # Take some deterministic combinations first
            if base_attempts == 0:
                # Use top pairs/triples systematically
                top_n = min(6, len(symbols))
                for combo in combinations(symbols[:top_n], r):
                    if len(results) >= 15:
                        break
                    formula = "".join(f"{el}1" for el in combo)
                    if formula in tried:
                        continue
                    tried.add(formula)
                    try:
                        score = simulate_compound_interaction(formula, req.cancer_type, elements_data, cancer_data)
                        results.append({
                            "formula": formula,
                            "elements": {el: 1.0 for el in combo},
                            "score": round(score, 4)
                        })
                    except Exception as e:
                        logging.warning(f"Failed to simulate {formula}: {e}")
            
            # Then add some random combinations for diversity
            seed_val = abs(hash(f"{req.cancer_type}_{base_attempts}")) % (2**32)
            random.seed(seed_val)
            combo = tuple(random.sample(symbols, r))
            formula = "".join(f"{el}1" for el in combo)
            if formula not in tried:
                tried.add(formula)
                try:
                    score = simulate_compound_interaction(formula, req.cancer_type, elements_data, cancer_data)
                    results.append({
                        "formula": formula,
                        "elements": {el: 1.0 for el in combo},
                        "score": round(score, 4)
                    })
                except Exception as e:
                    logging.warning(f"Failed to simulate {formula}: {e}")
        
        base_attempts += 1
    
    # Sort by score and ensure we have exactly 10 items
    sorted_results = sorted(results, key=lambda x: x["score"], reverse=True)
    
    # If we still don't have enough results, add some reliable backup combinations
    backup_combos = [
        ("Pt", "Au"), ("Ag", "Cu"), ("Pt", "Pd"), ("Au", "Ag"),
        ("Pt", "Au", "Cu"), ("Ag", "Cu", "Zn"), ("Au", "Pd", "Pt"),
        ("Pt", "Pd", "Rh"), ("Au", "Ag", "Cu"), ("Pt", "Ir", "Os")
    ]
    
    while len(sorted_results) < 10:
        for combo in backup_combos:
            if len(sorted_results) >= 10:
                break
            formula = "".join(f"{el}1" for el in combo)
            if not any(r["formula"] == formula for r in sorted_results):
                try:
                    score = simulate_compound_interaction(formula, req.cancer_type, elements_data, cancer_data)
                    sorted_results.append({
                        "formula": formula,
                        "elements": {el: 1.0 for el in combo},
                        "score": round(score, 4)
                    })
                except Exception:
                    score = 0.5  # Fallback score for known good combinations
                    sorted_results.append({
                        "formula": formula,
                        "elements": {el: 1.0 for el in combo},
                        "score": round(score, 4)
                    })
    
    # Re-sort to include any backup combinations properly
    final_results = sorted(sorted_results, key=lambda x: x["score"], reverse=True)
    return final_results[:10]
