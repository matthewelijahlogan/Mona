import json
import os
from datetime import datetime, timezone
from threading import Lock
from typing import Any

import requests
from jose import jwt
from jose.exceptions import JWTError

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from config import ELEMENTS_ORDER
from logic.predictor_scoring import score_feature_vector

# Optional Supabase client — only used if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided
_supabase_client = None
try:
    from supabase import create_client

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
except Exception:
    _supabase_client = None

# Auth0 configuration (optional). If not set, endpoints will accept anonymous submissions as before.
AUTH0_ISSUER = os.getenv("AUTH0_ISSUER_BASE_URL")  # e.g., https://your-tenant.us.auth0.com
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")

# Cache JWKS for a short period in-memory to avoid fetching on every request
_JWKS_CACHE: dict | None = None
_JWKS_CACHE_TIMESTAMP: float | None = None


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


def _get_jwks():
    global _JWKS_CACHE, _JWKS_CACHE_TIMESTAMP
    if AUTH0_ISSUER is None:
        return None
    # Simple cache; refresh every 300 seconds
    import time

    now = time.time()
    if _JWKS_CACHE and _JWKS_CACHE_TIMESTAMP and now - _JWKS_CACHE_TIMESTAMP < 300:
        return _JWKS_CACHE

    jwks_url = AUTH0_ISSUER.rstrip("/") + "/.well-known/jwks.json"
    try:
        resp = requests.get(jwks_url, timeout=5)
        resp.raise_for_status()
        _JWKS_CACHE = resp.json()
        _JWKS_CACHE_TIMESTAMP = now
        return _JWKS_CACHE
    except Exception:
        return None


def _verify_auth0_jwt(token: str) -> dict | None:
    """Verify an Auth0-issued RS256 JWT and return its claims, or None if verification fails or is not configured."""
    if not AUTH0_ISSUER:
        return None

    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        return None

    jwks = _get_jwks()
    if not jwks:
        return None

    kid = unverified_header.get("kid")
    key = None
    for jwk in jwks.get("keys", []):
        if jwk.get("kid") == kid:
            key = jwk
            break
    if key is None:
        return None

    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=AUTH0_ISSUER,
        )
        return claims
    except JWTError:
        return None


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
async def submit_recipe(req: RecipeSubmissionRequest, request: Request):
    # Attempt to extract user info from Authorization header (Bearer token)
    auth_header = request.headers.get("authorization")
    user_info = None
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
        claims = _verify_auth0_jwt(token)
        if claims:
            user_info = {"sub": claims.get("sub"), "name": claims.get("name") or claims.get("email")}

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
    submitter = req.submitted_by.strip() or (user_info and user_info.get("name")) or "Anonymous"
    entry = {
        "id": f"{req.cancer_type}:{req.recipe_name}:{created_at}",
        "recipe_name": req.recipe_name.strip(),
        "submitted_by": submitter,
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

    # Persist to local JSON leaderboard as before
    with LEADERBOARD_LOCK:
        try:
            entries = _load_entries()
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

        entries.append(entry)
        _save_entries(entries)
        ranked_entries = _sorted_entries(entries, req.cancer_type, 10)

    # Attempt to write to Supabase findings table if configured. Fail silently (log) to avoid breaking API
    if _supabase_client:
        try:
            payload = {
                "user_id": user_info.get("sub") if user_info else None,
                "user_display": submitter,
                "title": entry["recipe_name"],
                "composition": entry["elements"],
                "drugs_referenced": None,
                "computed_score": float(entry.get("prediction") or 0.0),
                "validation_state": "pending",
                "metadata": {"source": "leaderboard_submission"},
                "created_at": entry["created_at"],
            }
            _supabase_client.table("findings").insert(payload).execute()
        except Exception:
            # Do not raise — keep original behavior. In production, log to monitoring.
            pass

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
