"""Celery tasks for async processing"""

from .celery_tasks import celery_app, analyze_ingredient_task

__all__ = ["celery_app", "analyze_ingredient_task"]
