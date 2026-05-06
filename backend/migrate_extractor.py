import logging
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    logger.info("Starting migration for Extractor module...")
    
    # 1. Create new tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("New tables created successfully (or already existed).")
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
    
    # 2. Add has_extractor_access to users table
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN has_extractor_access BOOLEAN DEFAULT 0"))
        logger.info("Column 'has_extractor_access' added to users table.")
    except Exception as e:
        if "duplicate column name" in str(e).lower():
            logger.info("Column 'has_extractor_access' already exists.")
        else:
            logger.error(f"Error adding column to users: {e}")

if __name__ == "__main__":
    migrate()
