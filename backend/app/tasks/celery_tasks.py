"""Celery tasks for async analysis jobs"""

from celery import Celery
import logging

from app.config import settings
from app.models.schemas import IngredientInput, BodyImpactReport
from app.services.analysis import AnalysisService

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    "biopath",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_time_limit=settings.celery_task_time_limit,
    task_soft_time_limit=settings.celery_task_time_limit - 60,
)


@celery_app.task(name="analyze_ingredient", bind=True)
def analyze_ingredient_task(self, ingredient_data: dict) -> dict:
    """
    Async task to analyze an ingredient.

    Args:
        ingredient_data: Dict with ingredient_name and enable_predictions

    Returns:
        BodyImpactReport as dict
    """
    try:
        logger.info(f"Starting async analysis: {ingredient_data}")

        # Parse input
        ingredient_input = IngredientInput(**ingredient_data)

        # Run analysis
        service = AnalysisService()
        report = service.analyze_ingredient(ingredient_input)

        logger.info(f"Async analysis complete: {ingredient_input.ingredient_name}")

        return report.model_dump()

    except Exception as e:
        logger.error(f"Async analysis failed: {e}", exc_info=True)
        # Update task state
        self.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise
