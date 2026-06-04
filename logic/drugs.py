import json
import os

DRUG_DATA_PATH = "data/drugs.json"  # You can change this once you have real data

def load_drug_data():
    if not os.path.exists(DRUG_DATA_PATH):
        return []

    with open(DRUG_DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def find_drugs_by_element(symbol, drugs):
    matched = []
    for drug in drugs:
        elements = drug.get("elements", [])
        if symbol in elements:
            matched.append(drug)
    return matched

def summarize_drug(drug):
    return {
        "name": drug.get("name"),
        "mechanism": drug.get("mechanism", "Unknown"),
        "targets": drug.get("targets", []),
        "elements": drug.get("elements", []),
        "pubchem_id": drug.get("pubchem_id")
    }
