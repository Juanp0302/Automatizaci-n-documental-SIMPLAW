import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Legal Document Automation API"
    PROJECT_VERSION: str = "0.1.0"
    
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8000", "http://localhost:3001", "http://localhost:8001", "http://localhost:8002"]
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    
    # Resolved base directory (backend/)
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    @property
    def GENERATED_DOCS_DIR(self) -> str:
        path = os.path.join(self.BASE_DIR, "generated_docs")
        os.makedirs(path, exist_ok=True)
        return path
    
    @property
    def TEMPLATES_DIR(self) -> str:
        path = os.path.join(self.BASE_DIR, "templates")
        os.makedirs(path, exist_ok=True)
        return path

    @property
    def TEMP_DIR(self) -> str:
        path = os.path.join(self.BASE_DIR, "temp")
        os.makedirs(path, exist_ok=True)
        return path
    
    @property
    def DATABASE_URL(self) -> str:
        db_path = os.path.join(self.BASE_DIR, "sql_app.db")
        return f"sqlite:///{db_path}"

settings = Settings()
