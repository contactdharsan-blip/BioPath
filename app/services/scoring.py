"""Scoring engine for pathway impact analysis"""

import math
from typing import List, Dict, Any
import logging

from app.config import settings
from app.models.schemas import (
    TargetEvidence,
    PredictedInteraction,
    PathwayMatch,
    ConfidenceTier
)

logger = logging.getLogger(__name__)


class ScoringEngine:
    """Calculate pathway impact scores from target evidence"""

    def __init__(self):
        self.measured_weight = settings.measured_target_weight
        self.predicted_weight = settings.predicted_target_weight
        self.potency_weight = settings.potency_weight
        self.coverage_weight = settings.pathway_coverage_weight

    def calculate_pathway_impact(
        self,
        pathway_id: str,
        pathway_name: str,
        measured_targets: List[TargetEvidence],
        predicted_targets: List[PredictedInteraction],
        pathway_participants: List[str],
        pathway_url: str
    ) -> PathwayMatch:
        """
        Calculate impact score for a pathway.

        Scoring formula:
        - Base score from potency (pChEMBL values for measured targets)
        - Weighted by evidence type (measured > predicted)
        - Adjusted by pathway coverage (% of targets hit)

        Args:
            pathway_id: Reactome pathway ID
            pathway_name: Pathway display name
            measured_targets: Targets with bioassay evidence
            predicted_targets: Predicted target interactions
            pathway_participants: All proteins in pathway
            pathway_url: Reactome URL for pathway

        Returns:
            PathwayMatch with impact score and explanation
        """
        # Identify which targets are in this pathway
        pathway_target_ids = set(pathway_participants)

        matched_measured = [
            t for t in measured_targets
            if t.target_id in pathway_target_ids
        ]
        matched_predicted = [
            t for t in predicted_targets
            if t.target_id in pathway_target_ids
        ]

        if not matched_measured and not matched_predicted:
            # No targets match this pathway
            return None

        # Calculate potency score from measured targets
        potency_score = self._calculate_potency_score(matched_measured)

        # Calculate prediction score
        prediction_score = self._calculate_prediction_score(matched_predicted)

        # Calculate coverage score
        coverage_score = self._calculate_coverage_score(
            len(matched_measured) + len(matched_predicted),
            len(pathway_target_ids)
        )

        # Weighted impact score
        impact_score = (
            self.potency_weight * potency_score +
            self.coverage_weight * coverage_score +
            (1 - self.potency_weight - self.coverage_weight) * prediction_score
        )

        # Normalize to [0, 1]
        impact_score = max(0.0, min(1.0, impact_score))

        # Determine confidence tier
        confidence_tier, confidence_score = self._determine_confidence(
            matched_measured,
            matched_predicted
        )

        # Generate explanation
        explanation = self._generate_explanation(
            pathway_name,
            matched_measured,
            matched_predicted,
            impact_score
        )

        # Get matched target IDs
        matched_target_ids = [t.target_id for t in matched_measured]
        matched_target_ids.extend([t.target_id for t in matched_predicted])

        return PathwayMatch(
            pathway_id=pathway_id,
            pathway_name=pathway_name,
            matched_targets=matched_target_ids,
            measured_targets_count=len(matched_measured),
            predicted_targets_count=len(matched_predicted),
            impact_score=round(impact_score, 3),
            confidence_tier=confidence_tier,
            confidence_score=round(confidence_score, 3),
            explanation=explanation,
            pathway_url=pathway_url
        )

    def _calculate_potency_score(self, targets: List[TargetEvidence]) -> float:
        """
        Calculate score from target potency values.

        pChEMBL scale:
        - pChEMBL 9+ (IC50 < 10nM) -> very high potency
        - pChEMBL 7-9 (10nM - 1uM) -> high potency
        - pChEMBL 5-7 (1uM - 100uM) -> moderate potency
        - pChEMBL < 5 -> low potency
        """
        if not targets:
            return 0.0

        potencies = []
        for target in targets:
            if target.pchembl_value is not None:
                # Map pChEMBL to [0, 1] score
                # pChEMBL 5 -> 0.1, pChEMBL 9+ -> 1.0
                normalized = (target.pchembl_value - 5.0) / 4.0
                normalized = max(0.0, min(1.0, normalized))
                potencies.append(normalized)

        if not potencies:
            return 0.5  # Default if no pChEMBL values

        # Use max potency (best target)
        return max(potencies)

    def _calculate_prediction_score(self, targets: List[PredictedInteraction]) -> float:
        """Calculate score from predicted interactions"""
        if not targets:
            return 0.0

        # Use average prediction score
        scores = [t.prediction_score for t in targets]
        return sum(scores) / len(scores) if scores else 0.0

    def _calculate_coverage_score(self, matched_count: int, total_count: int) -> float:
        """
        Calculate pathway coverage score.

        Uses log scaling to avoid over-penalizing large pathways.
        """
        if total_count == 0:
            return 0.0

        coverage_ratio = matched_count / total_count

        # Log scaling: hitting 1/100 targets is still meaningful
        # Formula: log(matched + 1) / log(total + 1)
        coverage_score = math.log(matched_count + 1) / math.log(total_count + 1)

        return min(1.0, coverage_score)

    def _determine_confidence(
        self,
        measured: List[TargetEvidence],
        predicted: List[PredictedInteraction]
    ) -> tuple[ConfidenceTier, float]:
        """
        Determine overall confidence tier and score.

        Tier A: Only measured targets with high potency
        Tier B: Measured targets with lower potency OR mixed measured/predicted
        Tier C: Only predicted targets
        """
        if measured and not predicted:
            # Only measured - check potency
            avg_pchembl = sum(
                t.pchembl_value for t in measured if t.pchembl_value
            ) / len([t for t in measured if t.pchembl_value])

            if avg_pchembl >= 7.0:
                return ConfidenceTier.TIER_A, 0.9
            else:
                return ConfidenceTier.TIER_B, 0.7

        elif measured and predicted:
            # Mixed evidence
            return ConfidenceTier.TIER_B, 0.6

        elif predicted:
            # Only predicted
            avg_pred_score = sum(t.prediction_score for t in predicted) / len(predicted)
            return ConfidenceTier.TIER_C, avg_pred_score * 0.5

        else:
            return ConfidenceTier.TIER_B, 0.5

    def _generate_explanation(
        self,
        pathway_name: str,
        measured: List[TargetEvidence],
        predicted: List[PredictedInteraction],
        impact_score: float
    ) -> str:
        """Generate natural language explanation of pathway impact"""

        # Impact level
        if impact_score >= 0.7:
            impact_level = "high"
        elif impact_score >= 0.4:
            impact_level = "moderate"
        else:
            impact_level = "low"

        # Build explanation
        parts = [f"This compound shows {impact_level} impact on {pathway_name}"]

        if measured:
            target_names = [t.target_name for t in measured[:3]]  # Top 3
            potencies = [
                f"{t.pchembl_value:.1f}" for t in measured[:3]
                if t.pchembl_value
            ]

            if len(measured) == 1:
                parts.append(
                    f"via measured interaction with {target_names[0]} "
                    f"(pChEMBL {potencies[0]})"
                )
            else:
                parts.append(
                    f"via measured interactions with {len(measured)} targets including "
                    f"{', '.join(target_names[:2])}"
                )

        if predicted:
            parts.append(
                f"and {len(predicted)} predicted interaction(s) (computational hypothesis)"
            )

        explanation = " ".join(parts) + "."

        return explanation
