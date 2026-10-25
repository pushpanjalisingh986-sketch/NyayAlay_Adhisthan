from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    internal_service_key: str = "change_me_internal_service_key_min_32_chars"
    app_name: str = "NyayAlay AI Service"
    debug: bool = True

    # LLM
    llm_provider: str = "mock"  # mock | openai
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    openai_base_url: Optional[str] = None

    # Optional later
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()