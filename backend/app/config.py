"""Configuration management for BioPath"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    app_name: str = "BioPath"
    app_version: str = "1.0.0"
    debug: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    celery_task_time_limit: int = 600  # 10 minutes

    # Cache settings
    cache_ttl: int = 86400  # 24 hours
    disk_cache_dir: str = "./cache"

    # API rate limiting (requests per second)
    pubchem_rate_limit: float = 5.0  # PubChem allows 5 req/sec
    chembl_rate_limit: float = 10.0
    reactome_rate_limit: float = 10.0

    # API endpoints
    pubchem_base_url: str = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
    chembl_base_url: str = "https://www.ebi.ac.uk/chembl/api/data"
    reactome_base_url: str = "https://reactome.org/ContentService"
    open_targets_url: str = "https://api.platform.opentargets.org/api/v4/graphql"

    # DrugBank fallback (uses free Open Targets API when Reactome has no pathways)
    enable_drugbank_fallback: bool = True

    # ML-based target prediction fallback (DeepPurpose-like)
    # Predicts targets when ChEMBL has no data based on chemical structure
    enable_ml_target_prediction: bool = True

    # Pharmacophore-based target prediction fallback
    # Analyzes functional groups/drug classes to predict targets and pathways
    # Used when ChEMBL, Reactome, and Open Targets all return no data
    enable_pharmacophore_prediction: bool = True

    # Retry configuration
    max_retries: int = 3
    retry_backoff_factor: float = 2.0

    # Plugin configuration
    enable_docking_plugin: bool = False
    docking_plugin_path: Optional[str] = None

    # PlantNet API (for plant identification from images)
    plantnet_api_key: Optional[str] = None

    # Scoring weights
    measured_target_weight: float = 1.0
    predicted_target_weight: float = 0.3
    potency_weight: float = 0.7
    pathway_coverage_weight: float = 0.3

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


settings = Settings()
