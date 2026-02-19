import sys
import logging

# Add the project root to sys.path
sys.path.append("c:/Users/Usuario/Documents/Proyectos AUT/Automatización Documental/backend")

from app.db.session import SessionLocal
from app import crud

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_password() -> None:
    db = SessionLocal()
    email = "admin@example.com"
    new_password = "admin"
    
    user = crud.user.get_by_email(db, email=email)
    if user:
        logger.info(f"User {email} found. Resetting password...")
        user_in = {"password": new_password}
        crud.user.update(db, db_obj=user, obj_in=user_in)
        logger.info("Password reset successfully.")
    else:
        logger.error(f"User {email} not found.")

if __name__ == "__main__":
    reset_password()
