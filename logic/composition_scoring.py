"""Evidence-aware scoring for arbitrary periodic-table compositions.

This module deliberately separates direct observations from projections. The
historical synthetic dataset covers a subset of elements and cancer profiles;
unseen elements are estimated from nearby elements in period/group/category
space and are always reported as projected.
"""

from __future__ import annotations

import csv
import math
import os
from collections import defaultdict
from functools import lru_cache
from typing import Any

from config import PERIODIC_PATH, SYNTHETIC_SCORES_PATH

MAX_ATOMIC_NUMBER = 118


def _number(value: Any, default: float = 0.0) -> float:
    try:
        parsed = float(value)
        return parsed if math.isfinite(parsed) else default
    except (TypeError, ValueError):
        return default


@lru_cache(maxsize=1)
def element_catalog() -> dict[str, dict[str, Any]]:
    catalog: dict[str, dict[str, Any]] = {}
    with open(PERIODIC_PATH, newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            symbol = (row.get("symbol") or "").strip()
            atomic_number = int(_number(row.get("number")))
            if not symbol or not 1 <= atomic_number <= MAX_ATOMIC_NUMBER:
                continue
            catalog[symbol] = {
                "symbol": symbol,
                "name": (row.get("name") or symbol).strip(),
                "atomic_number": atomic_number,
                "atomic_mass": _number(row.get("atomic_mass"), atomic_number),
                "period": int(_number(row.get("period"))),
                "group": int(_number(row.get("group"))),
                "block": (row.get("block") or "").strip(),
                "category": (row.get("category") or "unknown").strip(),
                "phase": (row.get("phase") or "Unknown").strip(),
                "summary": (row.get("summary") or "").strip(),
            }
    return catalog


@lru_cache(maxsize=1)
def _evidence_scores() -> tuple[dict[tuple[str, str], float], dict[str, float], set[str]]:
    totals: dict[tuple[str, str], list[float]] = defaultdict(lambda: [0.0, 0.0])
    global_totals: dict[str, list[float]] = defaultdict(lambda: [0.0, 0.0])
    cancer_types: set[str] = set()

    if not os.path.exists(SYNTHETIC_SCORES_PATH):
        return {}, {}, set()

    with open(SYNTHETIC_SCORES_PATH, newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            cancer_type = (row.get("cancer_type") or "").strip()
            symbol = (row.get("element") or "").strip()
            confidence = _number(row.get("confidence"), -1)
            if not cancer_type or not symbol or confidence < 0:
                continue
            totals[(cancer_type, symbol)][0] += confidence
            totals[(cancer_type, symbol)][1] += 1
            global_totals[symbol][0] += confidence
            global_totals[symbol][1] += 1
            cancer_types.add(cancer_type)

    direct = {key: value[0] / value[1] for key, value in totals.items() if value[1]}
    global_scores = {
        symbol: value[0] / value[1] for symbol, value in global_totals.items() if value[1]
    }
    return direct, global_scores, cancer_types


def list_elements() -> list[dict[str, Any]]:
    return sorted(element_catalog().values(), key=lambda item: item["atomic_number"])


def supported_cancer_types() -> list[str]:
    return sorted(_evidence_scores()[2])


def normalize_composition(elements: dict[str, float]) -> tuple[dict[str, float], dict[str, float]]:
    if not isinstance(elements, dict):
        raise ValueError("Elements must be an object keyed by chemical symbol.")

    catalog = element_catalog()
    canonical = {symbol.lower(): symbol for symbol in catalog}
    raw: dict[str, float] = {}

    for supplied_symbol, supplied_amount in elements.items():
        symbol = canonical.get(str(supplied_symbol).strip().lower())
        if not symbol:
            raise ValueError(f"Unsupported element: {supplied_symbol}")
        amount = _number(supplied_amount, -1)
        if amount < 0:
            raise ValueError(f"Amount for {symbol} must be a finite number greater than zero.")
        if amount > 0:
            raw[symbol] = raw.get(symbol, 0.0) + amount

    if not raw:
        raise ValueError("Select at least one element with an amount greater than zero.")

    total = sum(raw.values())
    normalized = {symbol: amount / total for symbol, amount in raw.items()}
    return raw, normalized


def _distance(left: dict[str, Any], right: dict[str, Any]) -> float:
    group_distance = abs(left["group"] - right["group"]) if left["group"] and right["group"] else 8
    return (
        abs(left["period"] - right["period"]) * 1.6
        + group_distance * 0.45
        + (0 if left["block"] == right["block"] else 1.8)
        + (0 if left["category"] == right["category"] else 1.0)
    )


def _project_score(
    element: dict[str, Any],
    cancer_type: str,
    direct: dict[tuple[str, str], float],
    global_scores: dict[str, float],
) -> tuple[float, list[str], str]:
    cancer_candidates = {
        symbol: score
        for (candidate_cancer, symbol), score in direct.items()
        if candidate_cancer == cancer_type
    }
    source = "cancer-neighbor"
    candidates = cancer_candidates
    if not candidates:
        candidates = global_scores
        source = "global-neighbor"

    catalog = element_catalog()
    nearest = sorted(
        (
            (_distance(element, catalog[symbol]), symbol, score)
            for symbol, score in candidates.items()
            if symbol in catalog
        ),
        key=lambda item: item[0],
    )[:3]

    if not nearest:
        return 0.5, [], "neutral-baseline"

    weighted_total = 0.0
    weight_total = 0.0
    for distance, _symbol, score in nearest:
        weight = 1 / (1 + distance)
        weighted_total += score * weight
        weight_total += weight
    return weighted_total / weight_total, [item[1] for item in nearest], source


def _formula(raw: dict[str, float]) -> str:
    catalog = element_catalog()
    ordered = sorted(raw.items(), key=lambda item: catalog[item[0]]["atomic_number"])
    parts: list[str] = []
    for symbol, amount in ordered:
        formatted = f"{amount:.3f}".rstrip("0").rstrip(".")
        parts.append(f"{symbol}{'' if formatted == '1' else formatted}")
    return "".join(parts)


def analyze_composition(elements: dict[str, float], cancer_type: str) -> dict[str, Any]:
    raw, normalized = normalize_composition(elements)
    catalog = element_catalog()
    direct, global_scores, supported_cancers = _evidence_scores()
    cancer_has_direct_data = cancer_type in supported_cancers

    component_scores: list[dict[str, Any]] = []
    direct_elements: list[str] = []
    projected_elements: list[dict[str, Any]] = []
    evidence_coverage = 0.0

    for symbol, weight in normalized.items():
        key = (cancer_type, symbol)
        if key in direct:
            score = direct[key]
            source = "direct"
            neighbors: list[str] = []
            direct_elements.append(symbol)
            evidence_coverage += weight
        elif symbol in global_scores and not cancer_has_direct_data:
            score = global_scores[symbol]
            source = "global-observation"
            neighbors = [symbol]
            evidence_coverage += weight * 0.65
            projected_elements.append({"symbol": symbol, "based_on": neighbors, "source": source})
        else:
            score, neighbors, source = _project_score(
                catalog[symbol], cancer_type, direct, global_scores
            )
            evidence_coverage += weight * (0.45 if symbol in global_scores else 0.2)
            projected_elements.append({"symbol": symbol, "based_on": neighbors, "source": source})

        component_scores.append(
            {
                "symbol": symbol,
                "weight": round(weight, 6),
                "raw_signal": round(score, 6),
                "source": source,
            }
        )

    raw_signal = sum(item["raw_signal"] * item["weight"] for item in component_scores)
    # Historical confidence values cluster around 0.5. Rescaling the useful
    # observed range makes the exploratory signal readable without claiming a
    # calibrated treatment probability.
    exploration_score = max(0.0, min(1.0, (raw_signal - 0.25) / 0.5))

    categories = {catalog[symbol]["category"] for symbol in normalized}
    weighted_atomic_number = sum(
        catalog[symbol]["atomic_number"] * weight for symbol, weight in normalized.items()
    )
    weighted_atomic_mass = sum(
        catalog[symbol]["atomic_mass"] * weight for symbol, weight in normalized.items()
    )

    if exploration_score >= 0.72:
        signal_band = "Elevated exploratory signal"
    elif exploration_score >= 0.52:
        signal_band = "Promising exploratory signal"
    elif exploration_score >= 0.35:
        signal_band = "Mixed exploratory signal"
    else:
        signal_band = "Low exploratory signal"

    mode = "hybrid" if direct_elements and projected_elements else "direct" if direct_elements else "projected"
    interpretation = (
        f"The composition resolves to a {signal_band.lower()} for {cancer_type}. "
        f"{round(evidence_coverage * 100)}% of its weighted signal is covered by direct or "
        "closely related observations."
    )

    return {
        "cancer_type": cancer_type,
        "formula": _formula(raw),
        "elements": {symbol: round(amount, 6) for symbol, amount in raw.items()},
        "normalized_elements": {
            symbol: round(amount, 6) for symbol, amount in normalized.items()
        },
        "analysis_mode": mode,
        "exploration_score": round(exploration_score, 4),
        "raw_signal": round(raw_signal, 4),
        "signal_band": signal_band,
        "evidence_coverage": round(min(evidence_coverage, 1.0), 4),
        "direct_elements": direct_elements,
        "projected_elements": projected_elements,
        "components": component_scores,
        "descriptors": {
            "weighted_atomic_number": round(weighted_atomic_number, 4),
            "weighted_atomic_mass": round(weighted_atomic_mass, 4),
            "category_count": len(categories),
            "categories": sorted(categories),
        },
        "interpretation": interpretation,
        "limitations": [
            "This is an exploratory ranking signal, not a treatment probability.",
            "Projected elements use periodic neighbors when direct observations are unavailable.",
            "Laboratory and clinical validation are required before biological conclusions.",
        ],
    }
