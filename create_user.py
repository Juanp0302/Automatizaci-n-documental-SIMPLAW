import sys
import os
sys.path.append('/app')

from app.db.session import SessionLocal
from app import crud, schemas

db = SessionLocal()
try:
    existing = crud.user.get_by_email(db, email="contacto@simplaw.co")
    if existing:
        print("Usuario ya existe, actualizando contraseña...")
        from app.core.security import get_password_hash
        existing.hashed_password = get_password_hash("juanp0302")
        existing.is_active = True
        existing.is_superuser = True
        db.add(existing)
        db.commit()
        print("Contraseña actualizada correctamente.")
    else:
        print("Creando usuario nuevo...")
        user_in = schemas.UserCreate(
            email="contacto@simplaw.co",
            password="juanp0302",
            is_superuser=True,
            full_name="Juan SIMPLAW",
        )
        user = crud.user.create(db, obj_in=user_in)
        db.commit()
        print(f"Usuario creado: id={user.id} email={user.email} superuser={user.is_superuser}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
