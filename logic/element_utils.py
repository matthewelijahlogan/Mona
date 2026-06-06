# logic/element_utils.py
import os

def get_elements_data():
    """
    Loads element data from CSV into a list of dictionaries.
    """
    import pandas as pd

    path = os.path.join(os.path.dirname(__file__), "..", "data", "periodic_table.csv")
    return pd.read_csv(path).to_dict(orient="records")

def find_element_by_symbol(elements, symbol):
    """
    Search for an element by its chemical symbol (case-insensitive).
    Returns the element dict or None if not found.
    """
    if not elements or not symbol:
        return None
    return next((el for el in elements if el.get('symbol', '').lower() == symbol.lower()), None)

def find_elements_by_type(elements, element_type):
    """
    Return a list of elements that match a type (e.g. 'Metal', 'Nonmetal').
    """
    if not elements or not element_type:
        return []
    return [el for el in elements if el.get('type', '').lower() == element_type.lower()]

def find_elements_by_group(elements, group):
    """
    Return a list of elements in a specific group (e.g. 'Transition Metal').
    """
    if not elements or not group:
        return []
    return [el for el in elements if el.get('group', '').lower() == group.lower()]

def list_all_symbols(elements):
    """
    Return a list of all element symbols.
    """
    if not elements:
        return []
    return [el.get('symbol') for el in elements if el.get('symbol')]

def summarize_element(element):
    """
    Returns a summary string of an element.
    """
    if not element:
        return "Element not found."
    name = element.get('name', 'Unknown')
    symbol = element.get('symbol', 'Unknown')
    elem_type = element.get('type', 'Unknown')
    group = element.get('group', 'Unknown')
    return f"{name} ({symbol}): A {elem_type} in the {group} group."

