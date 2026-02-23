import sys
import os

backend_dir = r"C:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\backend"
sys.path.insert(0, backend_dir)

try:
    import app.main
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
