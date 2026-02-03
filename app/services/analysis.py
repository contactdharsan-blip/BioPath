"""Main analysis service orchestrating the pipeline"""

import time
from typing import Optional, Dict, Any
import logging

from app.models.schemas import (
    IngredientInput,
    CompoundIdentity,
    TargetEvidence,
    PredictedInteraction,
    PathwayMatch,
    BodyImpactReport,
    ProvenanceRecord
)
from app.clients import PubChemClient, ChEMBLClient, ReactomeClient
from app.clients.drugbank import DrugBankClient
from app.services.cache import cache_service
from app.services.scoring import ScoringEngine
from app.config import settings

logger = logging.getLogger(__name__)


class AnalysisService:
    """Main service for chemical-target-pathway analysis"""

    def __init__(self):
        self.pubchem = PubChemClient()
        self.chembl = ChEMBLClient()
        self.reactome = ReactomeClient()
        self.drugbank = DrugBankClient()
        self.scorer = ScoringEngine()
        self.cache = cache_service

    def analyze_ingredient(
        self,
        ingredient_input: IngredientInput
    ) -> BodyImpactReport:
        """
        Complete analysis pipeline for an ingredient.

        Steps:
        1. Resolve ingredient to canonical structure (PubChem)
        2. Get target evidence (ChEMBL)
        3. Map targets to pathways (Reactome)
        4. (Optional) Predict additional targets
        5. Calculate pathway impact scores
        6. Generate final report

        Args:
            ingredient_input: Input with ingredient name and options

        Returns:
            BodyImpactReport with full analysis
        """
        start_time = time.time()
        ingredient_name = ingredient_input.ingredient_name
        provenance: list[ProvenanceRecord] = []

        logger.info(f"Starting analysis for: {ingredient_name}")

        # Step 1: Resolve compound structure
        compound, prov = self._resolve_compound(ingredient_name)
        provenance.append(prov)

        if not compound or not compound.inchikey:
            logger.error(f"Failed to resolve compound: {ingredient_name}")
            return self._create_error_report(
                ingredient_name,
                "Failed to resolve compound structure",
                provenance,
                time.time() - start_time
            )

        # Step 2: Get target evidence
        known_targets, prov = self._get_target_evidence(compound)
        provenance.append(prov)

        if not known_targets:
            logger.warning(f"No targets found for {ingredient_name}")

        # Step 3: Optional predictions
        predicted_targets = []
        if ingredient_input.enable_predictions and settings.enable_docking_plugin:
            predicted_targets, prov = self._predict_targets(compound)
            if prov:
                provenance.append(prov)

        # Step 4: Map targets to pathways
        all_targets = known_targets + predicted_targets
        pathways = []

        if all_targets:
            pathways, prov = self._map_pathways(known_targets, predicted_targets)
            provenance.append(prov)
        else:
            logger.warning(f"No targets (measured or predicted) for {ingredient_name}, trying indication inference")

        # Step 4b: Fallback to DrugBank/Open Targets if Reactome has no pathways
        if not pathways and settings.enable_drugbank_fallback:
            logger.info(f"No Reactome pathways found, trying Open Targets fallback for {ingredient_name}")
            drugbank_pathways = self.drugbank.get_pathways_for_drug(ingredient_name)
            if drugbank_pathways:
                pathways = drugbank_pathways
                fallback_prov = ProvenanceRecord(
                    service="Open Targets",
                    endpoint="/graphql (fallback)",
                    status="success"
                )
                provenance.append(fallback_prov)
                logger.info(f"Found {len(pathways)} pathways via Open Targets fallback")

        # Step 4c: Infer pathways from ChEMBL drug indications (enhances results)
        if compound and compound.inchikey:
            indication_pathways = self.chembl.infer_pathways_from_indications(
                compound.inchikey,
                compound.canonical_smiles
            )
            if indication_pathways:
                # Merge indication-inferred pathways with existing ones
                existing_ids = {p.pathway_id for p in pathways}
                new_pathways = [p for p in indication_pathways if p.pathway_id not in existing_ids]
                if new_pathways:
                    pathways.extend(new_pathways)
                    indication_prov = ProvenanceRecord(
                        service="ChEMBL Indications",
                        endpoint="/drug_indication (inference)",
                        status="success"
                    )
                    provenance.append(indication_prov)
                    logger.info(f"Added {len(new_pathways)} pathways inferred from drug indications")

        # Step 5: Generate summary
        final_summary = self._generate_summary(pathways, known_targets, predicted_targets)

        # Build final report
        report = BodyImpactReport(
            ingredient_name=ingredient_name,
            compound_identity=compound,
            known_targets=known_targets,
            predicted_targets=predicted_targets,
            pathways=pathways,
            final_summary=final_summary,
            provenance=provenance,
            predictions_enabled=ingredient_input.enable_predictions,
            total_analysis_duration_seconds=time.time() - start_time,
            analysis_version=settings.app_version
        )

        logger.info(
            f"Analysis complete for {ingredient_name}: "
            f"{len(known_targets)} targets, {len(pathways)} pathways"
        )

        return report

    def _resolve_compound(self, ingredient_name: str) -> tuple[Optional[CompoundIdentity], ProvenanceRecord]:
        """Resolve ingredient to canonical structure with caching"""
        # Check cache
        cached = self.cache.get("compound", ingredient_name.lower())
        if cached:
            prov = ProvenanceRecord(
                service="PubChem",
                endpoint="/compound (cached)",
                status="success",
                cache_hit=True
            )
            return CompoundIdentity(**cached), prov

        # Fetch from PubChem
        compound, prov = self.pubchem.resolve_compound(ingredient_name)

        # Cache if successful
        if compound:
            self.cache.set("compound", ingredient_name.lower(), compound.model_dump())

        return compound, prov

    def _get_target_evidence(
        self,
        compound: CompoundIdentity
    ) -> tuple[list[TargetEvidence], ProvenanceRecord]:
        """Get target evidence from ChEMBL with caching"""
        cache_key = compound.inchikey

        # Check cache
        cached = self.cache.get("targets", cache_key)
        if cached:
            prov = ProvenanceRecord(
                service="ChEMBL",
                endpoint="/activity (cached)",
                status="success",
                cache_hit=True
            )
            targets = [TargetEvidence(**t) for t in cached]
            return targets, prov

        # Fetch from ChEMBL
        targets, prov = self.chembl.get_target_activities(
            compound.inchikey,
            compound.canonical_smiles
        )

        # Cache if successful
        if targets:
            self.cache.set(
                "targets",
                cache_key,
                [t.model_dump() for t in targets]
            )

        return targets, prov

    def _predict_targets(
        self,
        compound: CompoundIdentity
    ) -> tuple[list[PredictedInteraction], Optional[ProvenanceRecord]]:
        """Optional: Predict targets using docking/ML plugin"""
        try:
            # Import plugin dynamically
            from app.plugins.docking_vina import DockingPlugin

            plugin = DockingPlugin()
            predictions = plugin.predict_targets(compound.canonical_smiles)

            prov = ProvenanceRecord(
                service="DockingPlugin",
                endpoint="local_prediction",
                status="success"
            )

            return predictions, prov

        except ImportError:
            logger.info("Docking plugin not available")
            return [], None
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            prov = ProvenanceRecord(
                service="DockingPlugin",
                endpoint="local_prediction",
                status="error",
                error_message=str(e)
            )
            return [], prov

    def _map_pathways(
        self,
        known_targets: list[TargetEvidence],
        predicted_targets: list[PredictedInteraction]
    ) -> tuple[list[PathwayMatch], ProvenanceRecord]:
        """Map targets to pathways and calculate impact scores"""
        # Collect all target IDs
        target_ids = list(set([t.target_id for t in known_targets]))
        target_ids.extend([t.target_id for t in predicted_targets])

        if not target_ids:
            prov = ProvenanceRecord(
                service="Reactome",
                endpoint="/data/mapping (skipped)",
                status="success"
            )
            return [], prov

        # Map to pathways
        pathway_map, prov = self.reactome.map_targets_to_pathways(target_ids)

        # Aggregate pathways across all targets
        pathway_dict: Dict[str, Dict[str, Any]] = {}

        for target_id, pathways_list in pathway_map.items():
            for pathway_info in pathways_list:
                pathway_id = pathway_info["pathway_id"]
                if pathway_id not in pathway_dict:
                    pathway_dict[pathway_id] = {
                        "pathway_name": pathway_info["pathway_name"],
                        "pathway_species": pathway_info["pathway_species"],
                        "target_ids": set(),
                    }
                pathway_dict[pathway_id]["target_ids"].add(target_id)

        # Calculate impact scores for each pathway
        # Limit to top 20 pathways for performance
        pathway_matches = []
        pathway_items = list(pathway_dict.items())[:20]
        pathway_ids = [pid for pid, _ in pathway_items]

        # Fetch all pathway participants in batch (concurrent + cached)
        participants_map = self.reactome.get_pathway_participants_batch(pathway_ids)

        for pathway_id, info in pathway_items:
            participants = participants_map.get(pathway_id, [])
            pathway_url = f"https://reactome.org/content/detail/{pathway_id}"

            # Calculate impact score
            pathway_match = self.scorer.calculate_pathway_impact(
                pathway_id=pathway_id,
                pathway_name=info["pathway_name"],
                measured_targets=known_targets,
                predicted_targets=predicted_targets,
                pathway_participants=participants,
                pathway_url=pathway_url
            )

            if pathway_match:
                pathway_matches.append(pathway_match)

        # Sort by impact score (descending)
        pathway_matches.sort(key=lambda x: x.impact_score, reverse=True)

        return pathway_matches, prov

    def _generate_summary(
        self,
        pathways: list[PathwayMatch],
        known_targets: list[TargetEvidence],
        predicted_targets: list[PredictedInteraction]
    ) -> Dict[str, Any]:
        """Generate final summary of analysis"""
        summary = {
            "total_targets_measured": len(known_targets),
            "total_targets_predicted": len(predicted_targets),
            "total_pathways_affected": len(pathways),
        }

        # Top affected pathways
        top_pathways = pathways[:5]  # Top 5
        summary["top_pathways"] = [
            {
                "name": p.pathway_name,
                "impact_score": p.impact_score,
                "confidence_tier": p.confidence_tier.value,
                "explanation": p.explanation,
            }
            for p in top_pathways
        ]

        # Mechanism-level insights
        if known_targets:
            top_target = max(
                known_targets,
                key=lambda t: t.pchembl_value if t.pchembl_value else 0
            )
            summary["strongest_target"] = {
                "name": top_target.target_name,
                "pchembl": top_target.pchembl_value,
                "potency_type": top_target.standard_type,
            }

        # Risk flags (mechanism-level only, no clinical claims)
        risk_flags = []
        for pathway in pathways:
            if pathway.impact_score > 0.7:
                risk_flags.append(
                    f"High mechanism-level impact on {pathway.pathway_name}"
                )

        summary["mechanism_flags"] = risk_flags[:3]  # Top 3

        summary["disclaimer"] = (
            "This report provides mechanism-level evidence and computational predictions. "
            "It does NOT constitute medical advice or clinical safety assessment. "
            "All predicted interactions are hypotheses requiring experimental validation."
        )

        return summary

    def _create_error_report(
        self,
        ingredient_name: str,
        error_message: str,
        provenance: list[ProvenanceRecord],
        duration: float
    ) -> BodyImpactReport:
        """Create error report when analysis fails"""
        return BodyImpactReport(
            ingredient_name=ingredient_name,
            compound_identity=CompoundIdentity(ingredient_name=ingredient_name),
            known_targets=[],
            predicted_targets=[],
            pathways=[],
            final_summary={"error": error_message},
            provenance=provenance,
            total_analysis_duration_seconds=duration
        )
