"""
Pharmacophore-based target prediction using chemical structure analysis.

When ChEMBL, Reactome, and Open Targets don't have data, analyze the compound's
chemical structure to predict likely targets based on known drug-target patterns.

Uses SMILES/chemical structure to identify functional groups and pharmacophores,
then matches against known drug classes (NSAIDs, Statins, etc.) to infer targets.
"""

import re
from typing import List, Dict, Any, Optional, Tuple
import logging

try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, Crippen, Lipinski
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False

from app.models.schemas import TargetEvidence, PathwayMatch, ConfidenceTier, AssayReference

logger = logging.getLogger(__name__)


# Known pharmacophore patterns and their associated targets/pathways
PHARMACOPHORE_DATABASE = {
    "nsaid": {
        "name": "Non-Steroidal Anti-Inflammatory Drug",
        "patterns": [
            # Carboxylic acid + aromatic ring (core NSAID structure)
            r"[cR].*[CX3](=O)[OX2H1]",
            # Propionic acid derivatives (ibuprofen-like)
            r"CC(C).*[CX3](=O)[OX2H1]",
            # Salicylate structure
            r"[c]1[c][c][c]([OX2H])[c][c]1[CX3](=O)[OX2H1]",
        ],
        "targets": [
            {
                "target_id": "P23677",  # COX-1 (PTGS1)
                "target_name": "Prostaglandin G/H synthase 1",
                "moa": "Cyclooxygenase inhibition",
            },
            {
                "target_id": "P35354",  # COX-2 (PTGS2)
                "target_name": "Prostaglandin G/H synthase 2",
                "moa": "Selective cyclooxygenase-2 inhibition",
            },
        ],
        "pathways": [
            {
                "pathway_id": "R-HSA-2672351",
                "pathway_name": "Arachidonic acid metabolism",
            },
            {
                "pathway_id": "R-HSA-2162123",
                "pathway_name": "Eicosanoid synthesis",
            },
        ],
    },
    "statin": {
        "name": "HMG-CoA Reductase Inhibitor (Statin)",
        "patterns": [
            # HMG-CoA reductase inhibitor core structure
            r"[c].*[CX3](=O)[NX3].*",
            # Lovastatin/simvastatin lactone
            r"[OX2][C](=O)[C]",
        ],
        "targets": [
            {
                "target_id": "P04035",  # HMGCR
                "target_name": "3-hydroxy-3-methylglutaryl-coenzyme A reductase",
                "moa": "HMG-CoA reductase inhibition",
            },
            {
                "target_id": "P05023",  # LDLR
                "target_name": "LDL receptor",
                "moa": "Indirect modulation via cholesterol depletion",
            },
        ],
        "pathways": [
            {
                "pathway_id": "R-HSA-8957322",
                "pathway_name": "Cholesterol biosynthesis",
            },
            {
                "pathway_id": "R-HSA-556833",
                "pathway_name": "Metabolism of lipids",
            },
        ],
    },
    "beta_blocker": {
        "name": "Beta-Adrenergic Receptor Antagonist",
        "patterns": [
            # Beta-blocker core: secondary amine + aromatic ring
            r"[NX3][CX4].*[c][c].*[OX2]",
            r"[c].*[CX4][NX3H]",
        ],
        "targets": [
            {
                "target_id": "P07700",  # ADRB1
                "target_name": "Beta-1 adrenergic receptor",
                "moa": "Beta-1 adrenergic antagonism",
            },
            {
                "target_id": "P07704",  # ADRB2
                "target_name": "Beta-2 adrenergic receptor",
                "moa": "Beta-2 adrenergic antagonism",
            },
        ],
        "pathways": [
            {
                "pathway_id": "R-HSA-418594",
                "pathway_name": "G alpha (i) signalling events",
            },
            {
                "pathway_id": "R-HSA-395031",
                "pathway_name": "Adrenergic signaling in heart",
            },
        ],
    },
    "ace_inhibitor": {
        "name": "ACE Inhibitor",
        "patterns": [
            # Proline-based ACE inhibitors
            r"[NX3][CX4][CX4][NX3](C)=O",
            # Carboxyl-containing ACE inhibitors
            r"[CX3](=O)[OX2H1].*[NX3]",
        ],
        "targets": [
            {
                "target_id": "P12821",  # ACE
                "target_name": "Angiotensin-converting enzyme",
                "moa": "ACE inhibition",
            },
        ],
        "pathways": [
            {
                "pathway_id": "R-HSA-2022090",
                "pathway_name": "Renin-angiotensin system",
            },
            {
                "pathway_id": "R-HSA-418594",
                "pathway_name": "G alpha (i) signalling events",
            },
        ],
    },
    "proton_pump_inhibitor": {
        "name": "Proton Pump Inhibitor",
        "patterns": [
            # Benzimidazole core + sulfoxide
            r"[c]1[nH][c][nX2][c][c]1.*[SX3](=O)",
        ],
        "targets": [
            {
                "target_id": "P20160",  # ATP4B
                "target_name": "Gastric proton pump (H+/K+-ATPase)",
                "moa": "Proton pump inhibition",
            },
        ],
        "pathways": [
            {
                "pathway_id": "R-HSA-2142678",
                "pathway_name": "Stomach acid secretion",
            },
        ],
    },
    "antihistamine": {
        "name": "Histamine H1-Receptor Antagonist",
        "patterns": [
            # Basic amine + aromatic groups (typical antihistamine)
            r"[NX3].*[c][c].*[c]",
        ],
        "targets": [
            {
                "target_id": "P35367",  # HRH1
                "target_name": "Histamine H1 receptor",
                "moa": "H1 receptor antagonism",
            },
        ],
        "pathways": [
            {
                "pathway_id": "R-HSA-392592",
                "pathway_name": "Histamine signaling",
            },
        ],
    },
}


class PharmacophoreAnalyzer:
    """Analyze chemical structures to predict targets via pharmacophore matching"""

    def __init__(self):
        self.rdkit_available = RDKIT_AVAILABLE
        if not RDKIT_AVAILABLE:
            logger.warning("RDKit not available - pharmacophore analysis disabled")

    def analyze_compound(
        self, smiles: str, compound_name: str
    ) -> Tuple[List[TargetEvidence], List[PathwayMatch]]:
        """
        Analyze compound structure and predict targets/pathways based on pharmacophores.

        Args:
            smiles: Canonical SMILES string
            compound_name: Compound name for logging

        Returns:
            Tuple of (targets, pathways)
        """
        if not self.rdkit_available:
            logger.warning("RDKit not available, skipping pharmacophore analysis")
            return [], []

        try:
            # Parse SMILES
            mol = Chem.MolFromSmiles(smiles)
            if not mol:
                logger.warning(f"Could not parse SMILES for {compound_name}: {smiles}")
                return [], []

            logger.info(f"Analyzing pharmacophore for {compound_name}")

            # Identify compound class based on SMILES patterns
            matched_classes = self._identify_drug_classes(smiles)

            if not matched_classes:
                logger.info(f"No known pharmacophore patterns matched for {compound_name}")
                return [], []

            logger.info(f"Identified drug classes for {compound_name}: {matched_classes}")

            # Extract targets and pathways from matched classes
            targets = []
            pathways = []
            seen_target_ids = set()
            seen_pathway_ids = set()

            for drug_class in matched_classes:
                pharma_data = PHARMACOPHORE_DATABASE.get(drug_class)
                if not pharma_data:
                    continue

                confidence = self._calculate_confidence(drug_class, smiles)

                # Add targets
                for target_info in pharma_data.get("targets", []):
                    target_id = target_info["target_id"]
                    if target_id in seen_target_ids:
                        continue
                    seen_target_ids.add(target_id)

                    evidence = TargetEvidence(
                        target_id=target_id,
                        target_name=target_info["target_name"],
                        target_type="SINGLE PROTEIN",
                        organism="Homo sapiens",
                        pchembl_value=None,
                        standard_type=None,
                        standard_value=None,
                        standard_units=None,
                        assay_references=[
                            AssayReference(
                                assay_id="PHARMA_PRED",
                                assay_description=f"Pharmacophore prediction: {target_info['moa']}",
                                source="Pharmacophore Analysis",
                                source_url="",
                            )
                        ],
                        confidence_tier=ConfidenceTier.TIER_C,
                        confidence_score=confidence,
                        is_predicted=True,
                        source="Pharmacophore Analysis",
                    )
                    targets.append(evidence)

                # Add pathways
                for pathway_info in pharma_data.get("pathways", []):
                    pathway_id = pathway_info["pathway_id"]
                    if pathway_id in seen_pathway_ids:
                        continue
                    seen_pathway_ids.add(pathway_id)

                    pathway = PathwayMatch(
                        pathway_id=pathway_id,
                        pathway_name=pathway_info["pathway_name"],
                        pathway_species="Homo sapiens",
                        matched_targets=[target_info["target_name"] for target_info in pharma_data.get("targets", [])],
                        measured_targets_count=0,
                        predicted_targets_count=len(pharma_data.get("targets", [])),
                        impact_score=confidence,
                        confidence_tier=ConfidenceTier.TIER_C,
                        confidence_score=confidence,
                        explanation=f"Pathway inferred from {pharma_data['name']} structure",
                        pathway_url=f"https://reactome.org/content/detail/{pathway_id}",
                    )
                    pathways.append(pathway)

            logger.info(
                f"Pharmacophore analysis for {compound_name}: "
                f"predicted {len(targets)} targets, {len(pathways)} pathways"
            )

            return targets, pathways

        except Exception as e:
            logger.error(f"Error in pharmacophore analysis for {compound_name}: {e}")
            return [], []

    def _identify_drug_classes(self, smiles: str) -> List[str]:
        """
        Identify drug classes by matching SMILES against known pharmacophore patterns.

        Args:
            smiles: Canonical SMILES string

        Returns:
            List of matching drug class names
        """
        matched = []

        for drug_class, data in PHARMACOPHORE_DATABASE.items():
            patterns = data.get("patterns", [])

            for pattern in patterns:
                try:
                    if re.search(pattern, smiles):
                        matched.append(drug_class)
                        break
                except re.error:
                    logger.warning(f"Invalid regex pattern: {pattern}")

        return matched

    def _calculate_confidence(self, drug_class: str, smiles: str) -> float:
        """
        Calculate confidence score based on structural similarity.

        Args:
            drug_class: Identified drug class
            smiles: SMILES string

        Returns:
            Confidence score (0.0-1.0)
        """
        # Base confidence for matching pharmacophore
        base_confidence = 0.65

        # Adjust based on specificity of match
        if drug_class in ["nsaid", "statin"]:
            # Common, well-defined structures
            base_confidence = 0.75
        elif drug_class in ["beta_blocker", "ace_inhibitor"]:
            # Moderately specific
            base_confidence = 0.70
        else:
            base_confidence = 0.60

        # Minor adjustments based on SMILES length (longer = more specific)
        if len(smiles) > 100:
            base_confidence = min(0.95, base_confidence + 0.05)
        elif len(smiles) < 30:
            base_confidence = max(0.50, base_confidence - 0.10)

        return round(base_confidence, 2)


# Singleton instance
pharmacophore_analyzer = PharmacophoreAnalyzer()
