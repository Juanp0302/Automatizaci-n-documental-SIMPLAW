
import os
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath("backend/app/core/config.py"))))
db_path = os.path.join(base_dir, "sql_app.db")
print(f"Base Dir: {base_dir}")
print(f"DB Path: {db_path}")
print(f"Exists: {os.path.exists(db_path)}")
