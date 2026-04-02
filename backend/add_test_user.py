from app.db.session import SessionLocal
from app.crud.crud_user import user as crud_user
from app.schemas.user import UserCreate

def create_admin():
    db = SessionLocal()
    user = crud_user.get_by_email(db, email="screenshot@example.com")
    if not user:
        user_in = UserCreate(
            email="screenshot@example.com",
            password="screentest",
            is_superuser=True,
            full_name="Admin Screenshot"
        )
        crud_user.create(db, obj_in=user_in)
        print("Usuario admin creado.")
    else:
        print("El usuario admin ya existe.")

if __name__ == "__main__":
    create_admin()
