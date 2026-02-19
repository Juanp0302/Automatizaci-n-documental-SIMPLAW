import sys
import os

# Ensure backend dir is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

import bcrypt
# Patch bcrypt for passlib compatibility
bcrypt.__about__ = type("about", (object,), {"__version__": bcrypt.__version__})

from app.api.api_v1.endpoints import login
from app.db.session import SessionLocal
from app import schemas

def test_login():
    print("Starting debug login...")
    db = SessionLocal()
    try:
        # Simulate OAuth2PasswordRequestForm
        class FormData:
            def __init__(self):
                self.username = "admin@example.com"
                self.password = "admin"
        
        form_data = FormData()
        
        print(f"Attempting login for {form_data.username}")
        # Call the endpoint function directly
        # Note: endpoint signature might require db and form_data
        result = login.login_access_token(db=db, form_data=form_data)
        print("Login successful!")
        print(result)
        
    except Exception as e:
        print("Login failed with exception:")
        print(e)
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_login()
