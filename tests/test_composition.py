from logic.composition_scoring import analyze_composition, list_elements, normalize_composition
from fastapi import FastAPI
from fastapi.testclient import TestClient
from server_routes.composition import router


app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_catalog_contains_exactly_the_recognized_periodic_table():
    elements = list_elements()
    assert len(elements) == 118
    assert elements[0]["symbol"] == "H"
    assert elements[-1]["symbol"] == "Og"


def test_normalization_accepts_case_insensitive_arbitrary_elements():
    raw, normalized = normalize_composition({"ar": 2, "TC": 1, "og": 1})
    assert raw == {"Ar": 2.0, "Tc": 1.0, "Og": 1.0}
    assert normalized == {"Ar": 0.5, "Tc": 0.25, "Og": 0.25}


def test_analysis_discloses_projection_for_unobserved_elements():
    result = analyze_composition({"Ar": 2, "Tc": 1, "Og": 1}, "Breast Cancer")
    assert result["formula"] == "Ar2TcOg"
    assert result["analysis_mode"] == "projected"
    assert 0 <= result["exploration_score"] <= 1
    assert 0 <= result["evidence_coverage"] < 1
    assert {item["symbol"] for item in result["projected_elements"]} == {"Ar", "Tc", "Og"}


def test_analysis_handles_mixed_direct_and_projected_elements():
    result = analyze_composition({"C": 6, "H": 12, "O": 6, "Og": 0.01}, "Melanoma")
    assert result["analysis_mode"] == "hybrid"
    assert {"C", "H", "O"}.issubset(result["direct_elements"])
    assert result["descriptors"]["category_count"] >= 2


def test_composition_api_returns_catalog_and_analysis():
    catalog = client.get("/composition/catalog")
    assert catalog.status_code == 200
    assert catalog.json()["element_count"] == 118

    response = client.post(
        "/composition/analyze",
        json={
            "cancer_type": "Breast Cancer",
            "elements": {"Ar": 2, "Tc": 1, "Og": 1},
        },
    )
    assert response.status_code == 200
    assert response.json()["formula"] == "Ar2TcOg"
