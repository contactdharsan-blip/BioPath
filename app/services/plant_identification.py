"""Plant identification service - orchestrates image to pathway analysis

Flow: Image → PlantNet → Species → Plant Compounds DB → ChEMBL Analysis
"""

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from app.clients.plantnet import PlantNetClient
from app.data.plant_compounds import (
    get_plant_compounds,
    search_plant_fuzzy,
    PlantCompoundInfo
)
from app.services.analysis import AnalysisService
from app.models.schemas import IngredientInput, BodyImpactReport

logger = logging.getLogger(__name__)


@dataclass
class PlantIdentificationResult:
    """Result of plant identification"""
    success: bool
    scientific_name: Optional[str] = None
    common_names: List[str] = None
    confidence: float = 0.0
    family: Optional[str] = None
    plant_info: Optional[PlantCompoundInfo] = None
    error: Optional[str] = None

    def __post_init__(self):
        if self.common_names is None:
            self.common_names = []


@dataclass
class PlantAnalysisResult:
    """Complete result of plant image analysis"""
    identification: PlantIdentificationResult
    compounds_found: List[Dict[str, Any]]
    compound_reports: List[BodyImpactReport]
    aggregate_pathways: List[Dict[str, Any]]
    summary: Dict[str, Any]


class PlantIdentificationService:
    """
    Service that identifies plants from images and analyzes their compounds.

    Pipeline:
    1. Send image to PlantNet API for species identification
    2. Look up species in plant compounds database
    3. For each compound, run ChEMBL pathway analysis
    4. Aggregate and return results
    """

    def __init__(self):
        self.plantnet = PlantNetClient()
        self.analysis_service = AnalysisService()

    def identify_plant_from_image(
        self,
        image_data: bytes,
        organs: List[str] = None
    ) -> PlantIdentificationResult:
        """
        Identify a plant species from an image.

        Args:
            image_data: Raw image bytes (JPEG, PNG)
            organs: Plant organs visible (leaf, flower, fruit, bark)

        Returns:
            PlantIdentificationResult with species info
        """
        # Call PlantNet API
        plantnet_result = self.plantnet.identify_plant(image_data, organs)

        if not plantnet_result.get("success"):
            return PlantIdentificationResult(
                success=False,
                error=plantnet_result.get("error", "PlantNet identification failed")
            )

        best_match = plantnet_result.get("best_match")
        if not best_match:
            return PlantIdentificationResult(
                success=False,
                error="No plant species identified"
            )

        scientific_name = best_match.get("scientific_name", "")
        confidence = best_match.get("score", 0)

        # Look up in our plant compounds database
        plant_info = get_plant_compounds(scientific_name)

        # If not found by exact match, try fuzzy search
        if not plant_info:
            fuzzy_results = search_plant_fuzzy(scientific_name.split()[0])  # Search by genus
            if fuzzy_results:
                plant_info = fuzzy_results[0]
                logger.info(f"Found plant via fuzzy match: {plant_info.scientific_name}")

        return PlantIdentificationResult(
            success=True,
            scientific_name=scientific_name,
            common_names=best_match.get("common_names", []),
            confidence=confidence,
            family=best_match.get("family", ""),
            plant_info=plant_info
        )

    def identify_from_base64(
        self,
        base64_data: str,
        organs: List[str] = None
    ) -> PlantIdentificationResult:
        """
        Identify a plant from base64-encoded image.

        Args:
            base64_data: Base64-encoded image string
            organs: Plant organs visible

        Returns:
            PlantIdentificationResult
        """
        import base64

        try:
            # Remove data URL prefix if present
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]

            image_data = base64.b64decode(base64_data)
            return self.identify_plant_from_image(image_data, organs)

        except Exception as e:
            logger.error(f"Error decoding base64 image: {e}")
            return PlantIdentificationResult(
                success=False,
                error=f"Invalid image data: {e}"
            )

    def analyze_plant_from_image(
        self,
        image_data: bytes,
        organs: List[str] = None,
        max_compounds: int = 5,
        enable_predictions: bool = False
    ) -> PlantAnalysisResult:
        """
        Complete pipeline: identify plant and analyze its compounds.

        Args:
            image_data: Raw image bytes
            organs: Plant organs visible in image
            max_compounds: Maximum compounds to analyze (for performance)
            enable_predictions: Whether to enable ML predictions

        Returns:
            PlantAnalysisResult with full pathway analysis
        """
        # Step 1: Identify the plant
        identification = self.identify_plant_from_image(image_data, organs)

        if not identification.success:
            return PlantAnalysisResult(
                identification=identification,
                compounds_found=[],
                compound_reports=[],
                aggregate_pathways=[],
                summary={"error": identification.error}
            )

        # Step 2: Get compounds from database
        compounds_found = []
        if identification.plant_info:
            compounds_found = identification.plant_info.compounds[:max_compounds]
            logger.info(
                f"Found {len(compounds_found)} compounds for "
                f"{identification.scientific_name}"
            )
        else:
            logger.warning(
                f"Plant {identification.scientific_name} not in compounds database"
            )
            return PlantAnalysisResult(
                identification=identification,
                compounds_found=[],
                compound_reports=[],
                aggregate_pathways=[],
                summary={
                    "plant_identified": identification.scientific_name,
                    "confidence": identification.confidence,
                    "warning": "Plant not found in compounds database. "
                               "Try searching for specific compounds manually."
                }
            )

        # Step 3: Analyze each compound
        compound_reports = []
        for compound in compounds_found:
            compound_name = compound["name"]
            logger.info(f"Analyzing compound: {compound_name}")

            try:
                ingredient_input = IngredientInput(
                    ingredient_name=compound_name,
                    enable_predictions=enable_predictions
                )
                report = self.analysis_service.analyze_ingredient(ingredient_input)
                compound_reports.append(report)
            except Exception as e:
                logger.error(f"Error analyzing {compound_name}: {e}")

        # Step 4: Aggregate pathways across all compounds
        aggregate_pathways = self._aggregate_pathways(compound_reports)

        # Step 5: Generate summary
        summary = self._generate_plant_summary(
            identification,
            compounds_found,
            compound_reports,
            aggregate_pathways
        )

        return PlantAnalysisResult(
            identification=identification,
            compounds_found=compounds_found,
            compound_reports=compound_reports,
            aggregate_pathways=aggregate_pathways,
            summary=summary
        )

    def analyze_plant_from_base64(
        self,
        base64_data: str,
        organs: List[str] = None,
        max_compounds: int = 5,
        enable_predictions: bool = False
    ) -> PlantAnalysisResult:
        """
        Complete pipeline from base64 image.

        Args:
            base64_data: Base64-encoded image
            organs: Plant organs visible
            max_compounds: Maximum compounds to analyze
            enable_predictions: Enable ML predictions

        Returns:
            PlantAnalysisResult
        """
        import base64 as b64

        try:
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]

            image_data = b64.b64decode(base64_data)
            return self.analyze_plant_from_image(
                image_data, organs, max_compounds, enable_predictions
            )

        except Exception as e:
            logger.error(f"Error decoding base64 image: {e}")
            return PlantAnalysisResult(
                identification=PlantIdentificationResult(
                    success=False,
                    error=f"Invalid image data: {e}"
                ),
                compounds_found=[],
                compound_reports=[],
                aggregate_pathways=[],
                summary={"error": f"Invalid image data: {e}"}
            )

    def _aggregate_pathways(
        self,
        compound_reports: List[BodyImpactReport]
    ) -> List[Dict[str, Any]]:
        """
        Aggregate pathways across multiple compound analyses.
        Pathways affected by multiple compounds get higher scores.
        """
        pathway_scores: Dict[str, Dict[str, Any]] = {}

        for report in compound_reports:
            for pathway in report.pathways:
                pathway_id = pathway.pathway_id

                if pathway_id not in pathway_scores:
                    pathway_scores[pathway_id] = {
                        "pathway_id": pathway_id,
                        "pathway_name": pathway.pathway_name,
                        "pathway_url": pathway.pathway_url,
                        "compounds": [],
                        "total_impact": 0.0,
                        "max_impact": 0.0,
                        "confidence_tier": pathway.confidence_tier.value,
                    }

                pathway_scores[pathway_id]["compounds"].append(
                    report.ingredient_name
                )
                pathway_scores[pathway_id]["total_impact"] += pathway.impact_score
                pathway_scores[pathway_id]["max_impact"] = max(
                    pathway_scores[pathway_id]["max_impact"],
                    pathway.impact_score
                )

        # Calculate aggregate score (higher if multiple compounds affect pathway)
        aggregated = []
        for pathway_id, info in pathway_scores.items():
            num_compounds = len(info["compounds"])
            # Aggregate score: weighted combination of max impact and compound count
            aggregate_score = (
                info["max_impact"] * 0.6 +
                min(num_compounds / 3, 1.0) * 0.4  # Cap at 3 compounds
            )

            aggregated.append({
                "pathway_id": pathway_id,
                "pathway_name": info["pathway_name"],
                "pathway_url": info["pathway_url"],
                "aggregate_score": round(aggregate_score, 3),
                "max_impact": round(info["max_impact"], 3),
                "num_compounds": num_compounds,
                "compounds": info["compounds"],
                "confidence_tier": info["confidence_tier"],
            })

        # Sort by aggregate score
        aggregated.sort(key=lambda x: x["aggregate_score"], reverse=True)

        return aggregated[:20]  # Top 20 pathways

    def _generate_plant_summary(
        self,
        identification: PlantIdentificationResult,
        compounds: List[Dict[str, Any]],
        reports: List[BodyImpactReport],
        aggregate_pathways: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate summary of plant analysis."""
        # Count total targets across all compounds
        total_targets = sum(len(r.known_targets) for r in reports)
        total_pathways = len(aggregate_pathways)

        # Get top pathways
        top_pathways = aggregate_pathways[:5]

        # Traditional uses from plant info
        traditional_uses = []
        if identification.plant_info:
            traditional_uses = identification.plant_info.traditional_uses

        summary = {
            "plant_identified": identification.scientific_name,
            "common_names": identification.common_names,
            "family": identification.family,
            "identification_confidence": round(identification.confidence, 3),
            "compounds_analyzed": len(compounds),
            "compound_names": [c["name"] for c in compounds],
            "total_targets_found": total_targets,
            "total_pathways_affected": total_pathways,
            "traditional_uses": traditional_uses,
            "top_pathways": [
                {
                    "name": p["pathway_name"],
                    "score": p["aggregate_score"],
                    "compounds_involved": p["compounds"],
                }
                for p in top_pathways
            ],
            "disclaimer": (
                "This analysis identifies biological pathways potentially affected by "
                "compounds found in this plant. This is NOT medical advice. "
                "Traditional uses are listed for informational purposes only. "
                "Consult healthcare professionals before using any herbal products."
            )
        }

        return summary


# Singleton instance
plant_identification_service = PlantIdentificationService()
