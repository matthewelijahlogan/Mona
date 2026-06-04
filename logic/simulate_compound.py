# File: logic/simulate_compound.py

import re
from typing import Dict, Any, List
from logic.simulate_interaction import simulate_interaction

def parse_formula_to_dict(formula: str) -> Dict[str, float]:
    pattern = r'([A-Z][a-z]*)(\d*(?:\.\d+)?)?'
    matches = re.findall(pattern, formula)
    elements = {}

    for symbol, qty in matches:
        if not symbol:
            continue
        qty = float(qty) if qty else 1.0
        elements[symbol] = elements.get(symbol, 0.0) + qty

    return elements

def simulate_compound_interaction(
    formula: str,
    cancer_type: str,
    elements_data: List[Dict[str, Any]],
    cancer_data: List[Dict[str, Any]]
) -> float:
    """
    Simulate the interaction of a compound (e.g., C2H5O) against a cancer type.

    Returns an average weighted confidence score.
    """
    compound = parse_formula_to_dict(formula)

    scores = []
    total_amount = 0.0

    for symbol, amount in compound.items():
        sim = simulate_interaction(symbol, cancer_type, elements_data, cancer_data)
        scores.append(sim["confidence"] * amount)
        total_amount += amount

    if not scores or total_amount == 0:
        return 0.0

    return round(sum(scores) / total_amount, 4)
