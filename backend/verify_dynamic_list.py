import os
import sys

# Add backend to path
sys.path.append(os.path.abspath(r"c:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\backend"))

from app.api.api_v1.endpoints.documents import expand_numbered_elements

def test_expansion():
    # Simulate DB having no schema
    template_schema = None
    
    # Simulate an auto-detected schema
    detected_schema = [
        {
            "type": "numbered_elements",
            "name": "servicio",
            "label": "Servicios",
            "fields": [{"name": "nombre", "label": "Nombre"}, {"name": "precio", "label": "Precio"}]
        }
    ]
    
    # Simulate frontend payload
    context = {
        "cliente": "Empresa Ficticia SA",
        "servicio_items": [
            {'nombre': 'Desarrollo Web', 'precio': '3000'},
            {'nombre': 'Hosting Anual', 'precio': '150'},
            {'nombre': 'Mantenimiento', 'precio': '500'}
        ]
    }
    
    # Simulate endpoint logic
    if not template_schema:
        # Here we pretend we auto-detected it
        template_schema = detected_schema
        
    expanded = expand_numbered_elements(context, template_schema)
    
    print("--- Original Context ---")
    print(context)
    print("\n--- Expanded Context ---")
    for k, v in expanded.items():
        print(f"{k}: {v}")

    assert "servicio_1_nombre" in expanded
    assert expanded["servicio_1_nombre"] == "Consultoria"
    assert "servicio_2_precio" in expanded
    assert expanded["servicio_2_precio"] == "2500"
    assert "lista_servicio" in expanded
    assert "total_servicio" in expanded
    assert "precio_total_servicio" in expanded

if __name__ == "__main__":
    test_expansion()
    print("\nTest passed successfully!")
