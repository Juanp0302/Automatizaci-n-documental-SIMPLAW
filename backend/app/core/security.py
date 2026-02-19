from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
import bcrypt
# Patch bcrypt for passlib compatibility
bcrypt.__about__ = type("about", (object,), {"__version__": bcrypt.__version__})

from passlib.context import CryptContext
from app.core.config import settings


# Replaced passlib with direct bcrypt due to version incompatibility
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # return pwd_context.verify(plain_password, hashed_password)
    if not plain_password or not hashed_password:
        return False
    # bcrypt.checkpw expects bytes
    try:
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)
    except Exception as e:
        print(f"Error checking password: {e}")
        return False

def get_password_hash(password: str) -> str:
    # return pwd_context.hash(password)
    if not password:
        raise ValueError("Password cannot be empty")
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
