"""Tests for scoring engine"""

import pytest
from app.services.scoring import ScoringEngine
from app.models.schemas import TargetEvidence, PredictedInteraction, ConfidenceTier


@pytest.fixture
def scorer():
    """Create scoring engine instance"""
    return ScoringEngine()


def test_calculate_potency_score(scorer):
    """Test potency score calculation"""
    targets = [
        TargetEvidence(
            target_id="P1",
            target_name="Target 1",
            pchembl_value=8.0,  # High potency
            standard_type="IC50"
        ),
        TargetEvidence(
            target_id="P2",
            target_name="Target 2",
            pchembl_value=6.0,  # Moderate potency
            standard_type="IC50"
        )
    ]

    score = scorer._calculate_potency_score(targets)

    # Should use max potency (8.0)
    # Normalized: (8.0 - 5.0) / 4.0 = 0.75
    assert score == 0.75


def test_calculate_coverage_score(scorer):
    """Test pathway coverage calculation"""
    # 2 out of 100 targets
    score = scorer._calculate_coverage_score(2, 100)

    # Log scaling: log(3) / log(101) ≈ 0.238
    assert 0.2 < score < 0.3

    # 10 out of 10 targets
    score = scorer._calculate_coverage_score(10, 10)
    assert score == 1.0


def test_determine_confidence_tier_a(scorer):
    """Test Tier A confidence determination"""
    targets = [
        TargetEvidence(
            target_id="P1",
            target_name="Target 1",
            pchembl_value=7.5,
            standard_type="IC50"
        )
    ]

    tier, confidence = scorer._determine_confidence(targets, [])

    assert tier == ConfidenceTier.TIER_A
    assert confidence == 0.9


def test_determine_confidence_tier_c(scorer):
    """Test Tier C confidence determination"""
    predicted = [
        PredictedInteraction(
            target_id="P1",
            target_name="Target 1",
            prediction_score=0.8,
            prediction_method="Docking"
        )
    ]

    tier, confidence = scorer._determine_confidence([], predicted)

    assert tier == ConfidenceTier.TIER_C
    assert confidence < 0.5


def test_calculate_pathway_impact(scorer):
    """Test full pathway impact calculation"""
    measured_targets = [
        TargetEvidence(
            target_id="P35354",
            target_name="COX-2",
            pchembl_value=7.0,
            standard_type="IC50"
        )
    ]

    pathway_participants = ["P35354", "P12345", "P67890"]

    pathway_match = scorer.calculate_pathway_impact(
        pathway_id="R-HSA-123",
        pathway_name="Test Pathway",
        measured_targets=measured_targets,
        predicted_targets=[],
        pathway_participants=pathway_participants,
        pathway_url="https://reactome.org/content/detail/R-HSA-123"
    )

    assert pathway_match is not None
    assert pathway_match.pathway_name == "Test Pathway"
    assert pathway_match.measured_targets_count == 1
    assert pathway_match.impact_score > 0
    assert "COX-2" in pathway_match.explanation
