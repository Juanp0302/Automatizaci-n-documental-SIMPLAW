from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def reset_password(email: str, new_password: str):
    db: Session = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        print(f"Password for {email} successfully reset to: {new_password}")
    else:
        print(f"User {email} not found.")
    db.close()

if __name__ == "__main__":
    reset_password("contacto@simplaw.co", "Simplaw2026!")
