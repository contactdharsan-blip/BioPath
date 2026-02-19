"""Configuration management for BioPath"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    app_name: str = "BioPath"
    app_version: str = "1.0.0"
    debug: bool = False

    # Redis (optional - can be disabled if not available)
    redis_url: str = "redis://localhost:6379/0"
    redis_enabled: bool = False  # Disabled by default for Railway compatibility

    # Celery (uses in-memory backend if Redis not available)
    celery_broker_url: str = "memory://"
    celery_result_backend: str = "cache+memory://"
    celery_task_time_limit: int = 600  # 10 minutes

    # Cache settings
    cache_ttl: int = 86400  # 24 hours
    disk_cache_dir: str = "/tmp/biopath_cache"  # Use /tmp for Railway compatibility

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
    enable_ml_target_prediction: bool = False  # Disabled by default for Railway

    # Pharmacophore-based target prediction fallback
    # Analyzes functional groups/drug classes to predict targets and pathways
    # Used when ChEMBL, Reactome, and Open Targets all return no data
    enable_pharmacophore_prediction: bool = True

    # Deep Learning Model Configuration (DeepPurpose/DeepChem)
    # Use trained neural networks for 70-85% accurate target prediction
    enable_deeplearning_prediction: bool = False  # Disabled by default for Railway (requires GPU/large models)
    deeplearning_model_type: str = "SMILES_GCN_CNN"  # SMILES_GCN_CNN or SMILES_Transformer
    deeplearning_model_path: str = "/tmp/biopath_models"  # Use /tmp for Railway compatibility
    deeplearning_use_gpu: bool = False  # Disabled for Railway (no GPU available)

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
