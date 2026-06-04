from typing import List, Dict, Any
from logic.element_utils import find_element_by_symbol
from logic.cancer_utils import find_cancer_by_name
import hashlib

FEATURE_BOUNDS = {
    'electronegativity_pauling': (0.0, 4.0),     # Pauling scale typical range
    'atomic_mass':               (1.0, 300.0),   # Approximate element mass range
    'density':                   (0.0001, 22.6), # g/cm³: from light gas to osmium
    'atomic_radius':             (30.0, 300.0),  # picometers typical range
}

def normalize(value: Any, vmin: float, vmax: float) -> float:
    """
    Clamp and normalize a value to the range [0, 1].
    Returns 0 if value is invalid or out of range.
    """
    try:
        val = float(value)
        normalized = (val - vmin) / (vmax - vmin)
        return max(0.0, min(normalized, 1.0))
    except (TypeError, ValueError):
        return 0.0

def simulate_interaction(
    element_symbol: str,
    cancer_name: str,
    elements_data: List[Dict[str, Any]],
    cancer_types_data: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Calculate a confidence score reflecting the potential effectiveness
    of an element against a cancer type.

    :param element_symbol: Chemical symbol of element (e.g. 'C', 'Fe')
    :param cancer_name: Name of the cancer type
    :param elements_data: List/dict of element info with features
    :param cancer_types_data: List/dict of cancer info with aggressiveness etc.
    :return: dict with 'result' message and 'confidence' score (0.0 - 1.0)
    """
    element = find_element_by_symbol(elements_data, element_symbol)
    cancer = find_cancer_by_name(cancer_types_data, cancer_name)

    if not element or not cancer:
        return {"result": "Invalid element or cancer type", "confidence": 0.0}

    # Extract element features or fallback to 0.0 if missing
    eneg = element.get('electronegativity_pauling', 0.0)
    mass = element.get('atomic_mass', 0.0)
    density = element.get('density', 0.0)
    radius = element.get('atomic_radius', 0.0)

    # Normalize features
    eneg_n = normalize(eneg, *FEATURE_BOUNDS['electronegativity_pauling'])
    mass_n = normalize(mass, *FEATURE_BOUNDS['atomic_mass'])
    density_n = normalize(density, *FEATURE_BOUNDS['density'])
    radius_n = normalize(radius, *FEATURE_BOUNDS['atomic_radius'])

    # Weighted sum to produce an element score
    elem_score = (
        0.35 * eneg_n +
        0.35 * density_n +
        0.15 * mass_n +
        0.15 * radius_n
    )

    # Get cancer aggressiveness score (default 0.5 if missing)
    cancer_aggr = cancer.get('aggressiveness_score', 0.5)

    # Generate a consistent variability multiplier based on combination hash
    hash_input = f"{cancer_name}-{element_symbol}".encode('utf-8')
    combo_hash = int(hashlib.md5(hash_input).hexdigest(), 16) % 1000 / 1000  # 0.0 to 0.999
    interaction_multiplier = 0.7 + (combo_hash * 0.6)  # scales between 0.7 and 1.3

    # Combine weighted element and cancer aggressiveness scores
    combined_score = (0.3 * elem_score + 0.7 * cancer_aggr) * interaction_multiplier

    # Clamp confidence to [0, 1]
    confidence = max(0.0, min(combined_score, 1.0))

    # Generate descriptive message based on confidence score
    if confidence > 0.7:
        message = f"The element {element_symbol} shows strong potential vs. {cancer_name}."
    elif confidence > 0.4:
        message = f"{element_symbol} has moderate potential vs. {cancer_name}."
    else:
        message = f"{element_symbol} is unlikely to significantly affect {cancer_name}."

    return {
        "result": message,
        "confidence": round(confidence, 4)
    }

def simulate_all_elements_for_cancer(
    cancer_name: str,
    elements_data: List[Dict[str, Any]],
    cancer_types_data: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Simulate effectiveness for all elements against a specific cancer.
    Returns a list of dicts with element symbol, confidence, and message,
    sorted descending by confidence.
    """
    results = []

    for element in elements_data:
        symbol = element.get('symbol', '')
        if not symbol:
            continue
        sim_result = simulate_interaction(symbol, cancer_name, elements_data, cancer_types_data)
        results.append({
            'element': symbol,
            'confidence': sim_result['confidence'],
            'message': sim_result['result']
        })

    # Sort results by confidence descending
    results.sort(key=lambda x: x['confidence'], reverse=True)
    return results
