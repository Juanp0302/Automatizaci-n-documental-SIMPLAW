import sys
import os

# Add the project root to sys.path
sys.path.append("c:/Users/Usuario/Documents/Proyectos AUT/Automatización Documental")

try:
    from app.models import User, Template, Document
    from app.schemas import UserCreate, TemplateCreate, DocumentCreate
    from app.db.session import engine, Base
    
    print("Imports successful!")
    
    # Try to create tables (this will just print SQL if we used a mock engine, but here it might try to connect)
    # To be safe, we just print that we are ready.
    # actually, let's try to generate the CREATE TABLE sql without executing if possible, 
    # but for now, just successfull import is a good step.
    
    print("Models found:", User.__tablename__, Template.__tablename__, Document.__tablename__)
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
