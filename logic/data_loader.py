import os
import json

# Go up one directory from logic to cancer-sim-app root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
ELEMENTS_DIR = os.path.join(DATA_DIR, 'elements')

print("ELEMENTS_DIR resolved to:", ELEMENTS_DIR)

def load_all_elements():
    elements = []
    for filename in sorted(os.listdir(ELEMENTS_DIR)):
        if filename.endswith('.json'):
            filepath = os.path.join(ELEMENTS_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                elements.extend(data)
    return elements

def load_cancer_types():
    with open(os.path.join(DATA_DIR, 'cancer_types.json')) as f:
        return json.load(f)

def load_diagnoses():
    with open(os.path.join(DATA_DIR, 'cancer_types_diagnoses.json')) as f:
        return json.load(f)

def load_model_csv():
    import pandas as pd

    return pd.read_csv(os.path.join(DATA_DIR, 'Model.csv'))

def load_mutation_data():
    import pandas as pd

    return pd.read_csv(os.path.join(DATA_DIR, 'OmicsSomaticMutationsProfile.csv'))
