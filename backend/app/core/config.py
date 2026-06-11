from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "SIAI"
    API_V1_STR: str = "/api/v1"

    MONGODB_URI: str
    MONGODB_DB: str = "siai"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = "http://localhost:5173"

    # --- Detección de equipos en línea (ping) ---
    PING_ENABLED: bool = True
    PING_INTERVAL_MINUTES: int = 5      # barrido automático cada N minutos
    PING_TIMEOUT_MS: int = 1000         # timeout por equipo
    PING_CONCURRENCY: int = 50          # pings simultáneos máximos


settings = Settings()
