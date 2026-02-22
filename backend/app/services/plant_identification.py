"""Plant identification service - orchestrates image to pathway analysis

Flow: Image → PlantNet → Species → Plant Compounds DB → ChEMBL Analysis

Compound selection is based on confidence scoring:
- Research level (how well-studied the compound is)
- Drug interaction potential (important for safety)
- Bioactivity strength (biological effect on body)
- Lifestyle relevance (sleep, energy, mood, etc.)

External database fallback:
- Dr. Duke's Phytochemical Database (USDA)
- PhytoHub (dietary phytochemicals)
"""

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import partial
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from app.clients.plantnet import PlantNetClient
from app.clients.dr_duke import dr_duke_client
from app.clients.phytohub import phytohub_client
from app.data.plant_compounds import (
    get_plant_compounds,
    search_plant_fuzzy,
    get_prioritized_compounds,
    get_high_interaction_compounds,
    calculate_compound_priority,
    compound_to_dict,
    PlantCompoundInfo,
    CompoundMetadata
)
from app.services.analysis import AnalysisService
from app.models.schemas import IngredientInput, BodyImpactReport
from app.utils.concurrent import fetch_concurrent

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
    3. If not found, try external databases (Dr. Duke's, PhytoHub)
    4. For each compound, run ChEMBL pathway analysis
    5. Aggregate and return results
    """

    def __init__(self):
        self.plantnet = PlantNetClient()
        self.analysis_service = AnalysisService()

    def _analyze_single_compound(
        self, compound_name: str, enable_predictions: bool = False
    ) -> Optional[BodyImpactReport]:
        """Analyze a single compound. Used as the fetch function for concurrent execution."""
        try:
            logger.info(f"Analyzing compound: {compound_name}")
            ingredient_input = IngredientInput(
                ingredient_name=compound_name,
                enable_predictions=enable_predictions
            )
            return self.analysis_service.analyze_ingredient(ingredient_input)
        except Exception as e:
            logger.error(f"Error analyzing {compound_name}: {e}")
            return None

    def _fetch_compounds_from_external_dbs(
        self,
        scientific_name: str,
        common_names: List[str],
        max_compounds: int = 10
    ) -> List[CompoundMetadata]:
        """
        Fetch compounds from external databases when not in local DB.

        Tries Dr. Duke's (by scientific name) and PhytoHub (by common name).

        Args:
            scientific_name: Plant scientific name
            common_names: Plant common names
            max_compounds: Maximum compounds to return

        Returns:
            List of CompoundMetadata from external sources
        """
        compounds = []
        seen_names = set()

        # Fetch from Dr. Duke's and PhytoHub concurrently
        with ThreadPoolExecutor(max_workers=3) as executor:
            duke_future = executor.submit(
                dr_duke_client.get_plant_compounds_for_species, scientific_name
            )
            phytohub_futures = {
                executor.submit(
                    phytohub_client.get_plant_compounds_for_species, name
                ): name
                for name in common_names[:2]
            }

            # Process Dr. Duke's result first (deduplication priority)
            try:
                duke_result = duke_future.result(timeout=30)
                if duke_result.get("found"):
                    for comp in duke_result.get("compounds", [])[:max_compounds]:
                        name = comp.get("name", "").lower()
                        if name and name not in seen_names:
                            seen_names.add(name)
                            compounds.append(CompoundMetadata(
                                name=comp.get("name"),
                                research_level=0.4,
                                drug_interaction_risk=0.3,
                                bioactivity_strength=0.5,
                                lifestyle_categories=self._activities_to_categories(
                                    comp.get("activities", [])
                                )
                            ))
                    logger.info(f"Dr. Duke's found {len(duke_result.get('compounds', []))} compounds")
            except Exception as e:
                logger.error(f"Error fetching from Dr. Duke's: {e}")

            # Process PhytoHub results
            for future in as_completed(phytohub_futures):
                common_name = phytohub_futures[future]
                if len(compounds) >= max_compounds:
                    break
                try:
                    phytohub_result = future.result(timeout=30)
                    if phytohub_result.get("found"):
                        for comp in phytohub_result.get("compounds", []):
                            name = comp.get("name", "").lower()
                            if name and name not in seen_names:
                                seen_names.add(name)
                                compounds.append(CompoundMetadata(
                                    name=comp.get("name"),
                                    research_level=0.5,
                                    drug_interaction_risk=0.2,
                                    bioactivity_strength=0.4,
                                    lifestyle_categories=self._compound_class_to_categories(
                                        comp.get("compound_class")
                                    )
                                ))
                                if len(compounds) >= max_compounds:
                                    break
                        logger.info(f"PhytoHub found {phytohub_result.get('compound_count', 0)} compounds")
                except Exception as e:
                    logger.error(f"Error fetching from PhytoHub for {common_name}: {e}")

        return compounds[:max_compounds]

    def _activities_to_categories(self, activities: List[str]) -> List[str]:
        """Convert Dr. Duke's biological activities to lifestyle categories."""
        categories = set()

        activity_map = {
            "sedative": "sleep",
            "hypnotic": "sleep",
            "anxiolytic": "mood",
            "antidepressant": "mood",
            "stimulant": "energy",
            "antifatigue": "energy",
            "nootropic": "cognition",
            "memory": "cognition",
            "anti-inflammatory": "inflammation",
            "analgesic": "pain",
            "antinociceptive": "pain",
            "digestive": "digestion",
            "carminative": "digestion",
            "immunostimulant": "immunity",
            "antimicrobial": "immunity",
            "cardiotonic": "cardiovascular",
            "hypotensive": "cardiovascular",
            "dermal": "skin",
            "antiobesity": "metabolism",
            "hypoglycemic": "metabolism",
        }

        for activity in activities:
            activity_lower = activity.lower()
            for keyword, category in activity_map.items():
                if keyword in activity_lower:
                    categories.add(category)

        return list(categories)

    def _compound_class_to_categories(self, compound_class: Optional[str]) -> List[str]:
        """Convert PhytoHub compound class to lifestyle categories."""
        if not compound_class:
            return []

        class_map = {
            "flavonoid": ["inflammation", "cardiovascular"],
            "polyphenol": ["inflammation"],
            "terpenoid": ["immunity"],
            "alkaloid": ["cognition", "mood"],
            "carotenoid": ["skin", "immunity"],
            "phenolic": ["inflammation"],
            "glucosinolate": ["immunity"],
        }

        categories = set()
        class_lower = compound_class.lower()

        for class_type, cats in class_map.items():
            if class_type in class_lower:
                categories.update(cats)

        return list(categories)

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

        # Step 2: Get compounds from database using confidence-based prioritization
        compounds_found: List[CompoundMetadata] = []
        external_db_used = False

        if identification.plant_info:
            # Use priority scoring to select most relevant compounds
            compounds_found = get_prioritized_compounds(
                identification.plant_info,
                max_compounds=max_compounds
            )

            # Log selection details
            for compound in compounds_found:
                priority = calculate_compound_priority(compound)
                logger.info(
                    f"Selected compound: {compound.name} "
                    f"(priority={priority:.3f}, research={compound.research_level:.2f}, "
                    f"interaction_risk={compound.drug_interaction_risk:.2f}, "
                    f"bioactivity={compound.bioactivity_strength:.2f})"
                )

            # Check for high-interaction compounds and log warnings
            high_risk = get_high_interaction_compounds(identification.plant_info, threshold=0.7)
            if high_risk:
                logger.warning(
                    f"Plant {identification.scientific_name} contains high drug-interaction "
                    f"compounds: {[c.name for c in high_risk]}"
                )
        else:
            # Plant not in local database - try external databases
            logger.info(
                f"Plant {identification.scientific_name} not in local database, "
                "trying external databases (Dr. Duke's, PhytoHub)..."
            )

            compounds_found = self._fetch_compounds_from_external_dbs(
                scientific_name=identification.scientific_name,
                common_names=identification.common_names,
                max_compounds=max_compounds
            )

            if compounds_found:
                external_db_used = True
                logger.info(
                    f"Found {len(compounds_found)} compounds from external databases"
                )
            else:
                logger.warning(
                    f"Plant {identification.scientific_name} not found in any database"
                )
                return PlantAnalysisResult(
                    identification=identification,
                    compounds_found=[],
                    compound_reports=[],
                    aggregate_pathways=[],
                    summary={
                        "plant_identified": identification.scientific_name,
                        "confidence": identification.confidence,
                        "warning": "Plant not found in local or external compound databases. "
                                   "Try searching for specific compounds manually.",
                        "databases_searched": ["Local", "Dr. Duke's (USDA)", "PhytoHub"]
                    }
                )

        # Step 3: Analyze all compounds concurrently
        compound_names = [compound.name for compound in compounds_found]
        analyze_fn = partial(
            self._analyze_single_compound, enable_predictions=enable_predictions
        )
        results_map = fetch_concurrent(analyze_fn, compound_names, max_workers=5, timeout=120.0)

        # Preserve priority order from compounds_found
        compound_reports = []
        for compound in compounds_found:
            report = results_map.get(compound.name)
            if report:
                compound_reports.append(report)

        # Step 4: Aggregate pathways across all compounds
        aggregate_pathways = self._aggregate_pathways(compound_reports)

        # Step 5: Generate summary
        summary = self._generate_plant_summary(
            identification,
            compounds_found,
            compound_reports,
            aggregate_pathways,
            external_db_used=external_db_used
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
        compounds: List[CompoundMetadata],
        reports: List[BodyImpactReport],
        aggregate_pathways: List[Dict[str, Any]],
        external_db_used: bool = False
    ) -> Dict[str, Any]:
        """Generate summary of plant analysis with confidence scoring."""
        # Count total targets across all compounds
        total_targets = sum(len(r.known_targets) for r in reports)
        total_pathways = len(aggregate_pathways)

        # Get top pathways
        top_pathways = aggregate_pathways[:5]

        # Traditional uses from plant info
        traditional_uses = []
        if identification.plant_info:
            traditional_uses = identification.plant_info.traditional_uses

        # Get high-interaction compounds for warning
        high_interaction_compounds = []
        drug_interaction_warning = None
        if identification.plant_info:
            high_risk = get_high_interaction_compounds(
                identification.plant_info,
                threshold=0.6
            )
            if high_risk:
                high_interaction_compounds = [
                    {
                        "name": c.name,
                        "risk_level": c.drug_interaction_risk,
                        "categories": c.lifestyle_categories
                    }
                    for c in high_risk
                ]
                drug_interaction_warning = (
                    f"This plant contains compounds with significant drug interaction potential: "
                    f"{', '.join(c.name for c in high_risk)}. "
                    "Consult a healthcare provider before use, especially if taking medications."
                )

        # Collect all lifestyle categories affected
        all_categories = set()
        for compound in compounds:
            all_categories.update(compound.lifestyle_categories)

        # Calculate average research confidence
        avg_research = sum(c.research_level for c in compounds) / len(compounds) if compounds else 0

        # Determine data sources
        if external_db_used:
            data_sources = ["Dr. Duke's Phytochemical Database (USDA)", "PhytoHub"]
            source_note = (
                "Compound data retrieved from external databases. "
                "Research confidence scores are estimates based on database source."
            )
        else:
            data_sources = ["BioPath Curated Database"]
            source_note = None

        summary = {
            "plant_identified": identification.scientific_name,
            "common_names": identification.common_names,
            "family": identification.family,
            "identification_confidence": round(identification.confidence, 3),
            "compounds_analyzed": len(compounds),
            "compound_names": [c.name for c in compounds],
            "compound_details": [compound_to_dict(c) for c in compounds],
            "average_research_confidence": round(avg_research, 3),
            "total_targets_found": total_targets,
            "total_pathways_affected": total_pathways,
            "lifestyle_categories_affected": sorted(list(all_categories)),
            "traditional_uses": traditional_uses,
            "top_pathways": [
                {
                    "name": p["pathway_name"],
                    "score": p["aggregate_score"],
                    "compounds_involved": p["compounds"],
                }
                for p in top_pathways
            ],
            "high_interaction_compounds": high_interaction_compounds,
            "drug_interaction_warning": drug_interaction_warning,
            "data_sources": data_sources,
            "source_note": source_note,
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
