import json
import os

def get_cancer_types_data():
    """
    Loads cancer types data from JSON and returns as list of dicts.
    """
    path = os.path.join(os.path.dirname(__file__), "..", "data", "cancer_types.json")
    try:
        with open(path) as f:
            return json.load(f)
    except Exception as e:
        print(f"Failed to load cancer types data: {e}")
        return []

def find_cancer_by_name(cancer_data, name):
    """
    Search for a cancer type by name (case-insensitive substring match).
    Returns the cancer dict or None if not found.
    """
    if not cancer_data or not name:
        return None
    name_lower = name.lower()
    return next((c for c in cancer_data if name_lower in c.get('name', '').lower()), None)

def list_all_cancer_names(cancer_data):
    """
    Return a list of all cancer names.
    """
    if not cancer_data:
        return []
    return [c.get('name') for c in cancer_data if c.get('name')]

def find_by_category(cancer_data, category):
    """
    Find all cancers that belong to a certain category (case-insensitive).
    """
    if not cancer_data or not category:
        return []
    category_lower = category.lower()
    return [c for c in cancer_data if c.get('category', '').lower() == category_lower]

def summarize_cancer(cancer):
    """
    Return a readable summary string for a cancer type.
    """
    if not cancer:
        return "Cancer type not found."
    name = cancer.get('name', 'Unknown')
    desc = cancer.get('description', 'No description available.')
    return f"{name}: {desc}"

def get_dynamic_cancer_type_map():
    """
    Builds a dynamic map of cancer names to indices based on their order in cancer_types.json.
    Used for model indexing.
    """
    path = os.path.join(os.path.dirname(__file__), "..", "data", "cancer_types.json")
    try:
        with open(path) as f:
            data = json.load(f)
        return {entry["name"].strip(): idx for idx, entry in enumerate(data)}
    except Exception as e:
        print(f"Failed to build dynamic cancer type map: {e}")
        return {}
