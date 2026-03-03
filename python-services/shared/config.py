import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Application settings and configuration"""
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://localhost/vistabite"
    )
    
    # Groq API
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Services
    CONTENT_ANALYSIS_PORT: int = int(os.getenv("CONTENT_ANALYSIS_PORT", 8001))
    ANALYTICS_PORT: int = int(os.getenv("ANALYTICS_PORT", 8002))
    
    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()
