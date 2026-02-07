"""Service for checking drug interactions between compounds and medications."""

import logging
from typing import List, Optional
from app.models.schemas import TargetEvidence, PathwayMatch, PersonalizedInteraction
from app.clients.drugbank import drugbank_client

logger = logging.getLogger(__name__)


class DrugInteractionService:
    """Check interactions between compounds and user medications."""

    def check_compound_medication_interactions(
        self,
        compound_name: str,
        medication_names: List[str],
        targets: List[TargetEvidence],
        pathways: List[PathwayMatch],
    ) -> List[PersonalizedInteraction]:
        """
        Check if analyzed compound interacts with user's medications.

        Strategy:
        1. For each medication, get its targets from DGIdb
        2. Find overlapping targets (direct interaction potential)
        3. Find overlapping pathways (mechanism-based interaction)
        4. Check known interaction databases
        5. Assign severity based on overlap + known data
        6. Return structured interactions with recommendations

        Args:
            compound_name: Name of the compound being analyzed
            medication_names: List of medication names to check against
            targets: Known targets for the compound
            pathways: Pathways affected by the compound

        Returns:
            List of PersonalizedInteraction objects
        """
        interactions: List[PersonalizedInteraction] = []

        if not medication_names:
            return interactions

        # Get compound target names for comparison
        compound_target_names = {t.target_name.lower() for t in targets}
        compound_pathway_names = {p.pathway_name.lower() for p in pathways}

        for medication_name in medication_names:
            try:
                # Get medication's targets and pathways
                med_interactions = self._get_medication_targets(medication_name)

                if med_interactions:
                    # Find shared targets
                    shared_targets = self._find_shared_targets(
                        compound_target_names, med_interactions.get("targets", [])
                    )

                    # Find shared pathways
                    shared_pathways = self._find_shared_pathways(
                        compound_pathway_names, med_interactions.get("pathways", [])
                    )

                    # Determine severity
                    severity = self._assign_severity(
                        shared_targets, shared_pathways, medication_name, compound_name
                    )

                    # Generate recommendation
                    recommendation = self._generate_recommendation(severity)

                    # Get clinical effect
                    clinical_effect = self._get_clinical_effect(
                        medication_name, shared_targets, shared_pathways
                    )

                    # Create interaction record
                    interaction = PersonalizedInteraction(
                        medication_name=medication_name,
                        severity=severity,
                        mechanism=self._get_mechanism(
                            shared_targets, shared_pathways, medication_name
                        ),
                        clinical_effect=clinical_effect,
                        recommendation=recommendation,
                        evidence_level=self._get_evidence_level(
                            shared_targets, shared_pathways
                        ),
                        shared_targets=list(shared_targets),
                        shared_pathways=list(shared_pathways),
                    )

                    interactions.append(interaction)

                else:
                    # No known interaction data found
                    interaction = PersonalizedInteraction(
                        medication_name=medication_name,
                        severity="none",
                        mechanism="No known interactions detected in available databases.",
                        clinical_effect=None,
                        recommendation="No known interactions with this compound.",
                        evidence_level="predicted",
                        shared_targets=[],
                        shared_pathways=[],
                    )
                    interactions.append(interaction)

            except Exception as e:
                logger.error(
                    f"Error checking interaction for {medication_name}: {str(e)}"
                )
                # Return unknown severity on error
                interaction = PersonalizedInteraction(
                    medication_name=medication_name,
                    severity="minor",
                    mechanism="Unable to fully assess interaction.",
                    clinical_effect=None,
                    recommendation="Consult with your healthcare provider about this combination.",
                    evidence_level="predicted",
                    shared_targets=[],
                    shared_pathways=[],
                )
                interactions.append(interaction)

        return interactions

    def _get_medication_targets(self, medication_name: str) -> dict:
        """Get medication's targets and pathways from DGIdb."""
        try:
            # Get drug interactions from DGIdb via DrugBankClient
            result = drugbank_client.get_drug_interactions(medication_name)
            if result:
                return {
                    "targets": result.get("targets", []),
                    "pathways": result.get("pathways", []),
                }
            return {}
        except Exception as e:
            logger.warning(f"Could not fetch targets for {medication_name}: {str(e)}")
            return {}

    def _find_shared_targets(
        self, compound_targets: set, med_targets: List[str]
    ) -> set:
        """Find overlapping target names between compound and medication."""
        med_target_names = {t.lower() for t in med_targets}
        return compound_targets & med_target_names

    def _find_shared_pathways(
        self, compound_pathways: set, med_pathways: List[str]
    ) -> set:
        """Find overlapping pathway names between compound and medication."""
        med_pathway_names = {p.lower() for p in med_pathways}
        return compound_pathways & med_pathway_names

    def _assign_severity(
        self,
        shared_targets: set,
        shared_pathways: set,
        medication_name: str,
        compound_name: str,
    ) -> str:
        """Assign interaction severity based on shared targets and pathways."""
        # Check for known major interactions
        major_interactions = self._get_known_major_interactions()
        med_lower = medication_name.lower()
        compound_lower = compound_name.lower()

        for med_keywords, compound_keywords, _ in major_interactions:
            if any(k in med_lower for k in med_keywords) and any(
                k in compound_lower for k in compound_keywords
            ):
                return "major"

        # Assign based on target/pathway overlap
        if shared_targets:
            if len(shared_targets) >= 3:
                return "major"
            elif len(shared_targets) >= 2:
                return "moderate"
            else:
                return "minor"

        if shared_pathways:
            if len(shared_pathways) >= 2:
                return "moderate"
            else:
                return "minor"

        return "none"

    def _generate_recommendation(self, severity: str) -> str:
        """Generate recommendation based on severity."""
        if severity == "major":
            return "⚠️ Avoid combination if possible. Consult your healthcare provider immediately before using together."
        elif severity == "moderate":
            return "⚠️ Monitor for unusual effects. Consider discussing with your pharmacist or doctor."
        elif severity == "minor":
            return "Monitor for any unusual effects when using together."
        else:
            return "No known interactions detected. Safe to use together based on available data."

    def _get_mechanism(
        self,
        shared_targets: set,
        shared_pathways: set,
        medication_name: str,
    ) -> str:
        """Generate mechanism of interaction description."""
        if not shared_targets and not shared_pathways:
            return "No known mechanism of interaction."

        mechanisms = []

        if shared_targets:
            targets_str = ", ".join(sorted(shared_targets)[:3])
            if len(shared_targets) > 3:
                targets_str += f", and {len(shared_targets) - 3} more"
            mechanisms.append(f"Both affect {targets_str}")

        if shared_pathways:
            pathways_str = ", ".join(sorted(shared_pathways)[:2])
            if len(shared_pathways) > 2:
                pathways_str += f", and {len(shared_pathways) - 2} more"
            mechanisms.append(f"Both influence {pathways_str} pathway(s)")

        return ". ".join(mechanisms) + "."

    def _get_clinical_effect(
        self, medication_name: str, shared_targets: set, shared_pathways: set
    ) -> Optional[str]:
        """Get clinical effect of the interaction."""
        if not shared_targets and not shared_pathways:
            return None

        effects = []

        # CYP450 interactions
        if any("cytochrome" in t for t in shared_targets):
            effects.append("May alter drug metabolism, affecting medication levels")

        # Bleeding risk
        if any("platelet" in t or "coagul" in t for t in shared_targets):
            effects.append("Potential increased bleeding risk")

        # Blood pressure
        if any("ace" in med.lower() or "arb" in med.lower() or "diuretic" in med.lower()
               for med in [medication_name] if "blood pressure" in str(t) for t in shared_pathways):
            effects.append("May affect blood pressure control")

        if not effects:
            if shared_targets:
                return f"May alter effects of {medication_name} through shared target interactions"
            else:
                return "May affect metabolic pathways"

        return "; ".join(effects)

    def _get_evidence_level(self, shared_targets: set, shared_pathways: set) -> str:
        """Determine evidence level for the interaction."""
        if shared_targets:
            return "established"  # Target overlaps are well-documented
        elif shared_pathways:
            return "theoretical"  # Pathway overlaps are inferred
        else:
            return "predicted"

    def _get_known_major_interactions(self) -> List[tuple]:
        """Return list of known major drug-compound interactions."""
        return [
            # (medication_keywords, compound_keywords, description)
            (["warfarin", "coumadin"], ["nsaid", "ibuprofen", "aspirin"], "Bleeding risk"),
            (
                ["anticoagulant", "blood thinner"],
                ["ginkgo", "gingko"],
                "Increased bleeding risk",
            ),
            (
                ["ssri", "antidepressant"],
                ["st. john", "hypericum"],
                "Serotonin syndrome risk",
            ),
            (
                ["metformin", "diabetes"],
                ["garlic", "onion"],
                "Additive hypoglycemic effect",
            ),
            (
                ["blood pressure", "hypertension"],
                ["licorice"],
                "Hypertension aggravation",
            ),
        ]


# Create singleton instance
drug_interaction_service = DrugInteractionService()
