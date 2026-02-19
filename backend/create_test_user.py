import sys
# Add the project root to sys.path
sys.path.append("c:/Users/Usuario/Documents/Proyectos AUT/Automatización Documental/backend")

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app import crud, schemas
from app.core.security import get_password_hash

def create_user():
    db = SessionLocal()
    try:
        user = crud.user.get_by_email(db, email="admin@example.com")
        if user:
            print("User admin@example.com already exists. Updating password...")
            # Update password
            user.hashed_password = get_password_hash("admin")
            db.add(user)
            db.commit()
            print("Password updated successfully.")
        else:
            user_in = schemas.UserCreate(
                email="admin@example.com",
                password="admin",
                full_name="Admin User",
                is_superuser=True
            )
            user = crud.user.create(db, obj_in=user_in)
            print("User admin@example.com created successfully.")
    except Exception as e:
        print(f"Error creating/updating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_user()
