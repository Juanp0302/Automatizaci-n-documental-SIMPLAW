import sys
import os

# Ensure backend dir is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from app.db.session import SessionLocal
from app import crud, schemas
from app.core.security import get_password_hash

def reset_admin():
    db = SessionLocal()
    try:
        user = crud.user.get_by_email(db, email="admin@example.com")
        if not user:
            print("Admin user not found. Creating...")
            user_in = schemas.UserCreate(
                email="admin@example.com",
                password="admin",
                is_superuser=True,
                full_name="Admin User",
            )
            user = crud.user.create(db, obj_in=user_in)
            print("Admin user created.")
            print("Admin user found. Resetting password...")
            
            # Use app's security module to hash password
            hashed = get_password_hash("admin")
            
            # Update user directly in DB
            user.hashed_password = hashed
            db.add(user)
            db.commit()
            print("Password reset to 'admin' using app.core.security.")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
