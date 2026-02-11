"""Base interface for prediction plugins"""

from abc import ABC, abstractmethod
from typing import List

from app.models.schemas import PredictedInteraction


class PredictionPlugin(ABC):
    """Base class for target prediction plugins"""

    @abstractmethod
    def predict_targets(self, smiles: str) -> List[PredictedInteraction]:
        """
        Predict protein targets for a compound.

        Args:
            smiles: Canonical SMILES string

        Returns:
            List of PredictedInteraction objects
        """
        pass

    @abstractmethod
    def get_plugin_name(self) -> str:
        """Return plugin name/version"""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if plugin dependencies are available"""
        pass
