import os

class Settings:
    PROJECT_NAME: str = "FinAudit AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./finaudit.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "finaudit-ai-super-secret-production-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Storage
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    REPORT_DIR: str = os.path.join(BASE_DIR, "reports")
    SAMPLE_DIR: str = os.path.join(BASE_DIR, "app", "sample_data", "files")
    
    # LLM Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Audit Risk Thresholds (Configurable)
    HIGH_RISK_AMOUNT_THRESHOLD: float = 25000.0
    MEDIUM_RISK_AMOUNT_THRESHOLD: float = 5000.0
    ANOMALY_CONTAMINATION: float = 0.08  # 8% expected anomalies
    FUZZY_MATCH_THRESHOLD: float = 0.82  # 82% similarity threshold

settings = Settings()

# Ensure required directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)
os.makedirs(settings.SAMPLE_DIR, exist_ok=True)
