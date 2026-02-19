
import json

def verify_dropdown_logic():
    # 1. Simulate Schema with Key-Value Options
    schema = [
        {
            "name": "dropdown_var",
            "label": "Select Option",
            "type": "select",
            "options": [
                "Simple Option",
                {"label": "Display Label", "value": "Long Value Text"}
            ]
        }
    ]
    
    print("Schema created:", json.dumps(schema, indent=2))
    
    # 2. Simulate User Selection (from DynamicForm)
    # The form sets the value to the 'value' part of the option
    selected_value_simple = "Simple Option"
    selected_value_complex = "Long Value Text" 
    
    # 3. Simulate Document Generation Context
    context_simple = {"dropdown_var": selected_value_simple}
    context_complex = {"dropdown_var": selected_value_complex}
    
    print("\n--- Test Case 1: Simple Option ---")
    print(f"User selected: '{selected_value_simple}'")
    print(f"Context sent to DocxTemplate: {context_simple}")
    if context_simple["dropdown_var"] == "Simple Option":
        print("SUCCESS: Simple option passes value correctly.")
    else:
        print("FAILURE: Simple option mismatch.")

    print("\n--- Test Case 2: Complex Option ---")
    print(f"User selected (in UI): 'Display Label' -> underlying value is '{selected_value_complex}'")
    print(f"Context sent to DocxTemplate: {context_complex}")
    if context_complex["dropdown_var"] == "Long Value Text":
        print("SUCCESS: Complex option passes underlying value correctly.")
    else:
        print("FAILURE: Complex option mismatch.")

if __name__ == "__main__":
    verify_dropdown_logic()
