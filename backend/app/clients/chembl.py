"""ChEMBL API client for target and bioactivity data"""

import httpx
from typing import List, Optional, Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from app.config import settings
from app.models.schemas import TargetEvidence, AssayReference, ProvenanceRecord, ConfidenceTier, PathwayMatch
from app.utils import RateLimiter
from app.utils.concurrent import fetch_concurrent
from app.services.cache import cache_service

# Disease/indication to biological pathway mapping
# Maps common disease categories to Reactome pathway IDs and biological systems
INDICATION_PATHWAY_MAP = {
    # Inflammatory conditions
    "inflammation": {
        "pathways": ["R-HSA-6783783", "R-HSA-449147"],
        "pathway_names": ["Interleukin-10 signaling", "Signaling by Interleukins"],
        "system": "Immune System"
    },
    "arthritis": {
        "pathways": ["R-HSA-6783783", "R-HSA-168256"],
        "pathway_names": ["Interleukin-10 signaling", "Immune System"],
        "system": "Immune/Musculoskeletal"
    },
    "pain": {
        "pathways": ["R-HSA-2672351", "R-HSA-418594"],
        "pathway_names": ["Arachidonic acid metabolism", "G alpha (i) signalling events"],
        "system": "Nervous System"
    },
    # Cardiovascular
    "hypertension": {
        "pathways": ["R-HSA-418594", "R-HSA-416476"],
        "pathway_names": ["G alpha (i) signalling events", "G alpha (q) signalling events"],
        "system": "Cardiovascular"
    },
    "heart": {
        "pathways": ["R-HSA-5576891", "R-HSA-397014"],
        "pathway_names": ["Cardiac conduction", "Muscle contraction"],
        "system": "Cardiovascular"
    },
    "atherosclerosis": {
        "pathways": ["R-HSA-8957322", "R-HSA-556833"],
        "pathway_names": ["Cholesterol biosynthesis", "Metabolism of lipids"],
        "system": "Cardiovascular"
    },
    # Neurological/Psychiatric
    "depression": {
        "pathways": ["R-HSA-112316", "R-HSA-390651"],
        "pathway_names": ["Neuronal System", "Dopamine Neurotransmitter Release Cycle"],
        "system": "Nervous System"
    },
    "anxiety": {
        "pathways": ["R-HSA-112316", "R-HSA-977443"],
        "pathway_names": ["Neuronal System", "GABA receptor activation"],
        "system": "Nervous System"
    },
    "schizophrenia": {
        "pathways": ["R-HSA-390651", "R-HSA-112316"],
        "pathway_names": ["Dopamine Neurotransmitter Release Cycle", "Neuronal System"],
        "system": "Nervous System"
    },
    "epilepsy": {
        "pathways": ["R-HSA-112316", "R-HSA-1296071"],
        "pathway_names": ["Neuronal System", "Potassium Channels"],
        "system": "Nervous System"
    },
    "alzheimer": {
        "pathways": ["R-HSA-112316", "R-HSA-8863678"],
        "pathway_names": ["Neuronal System", "Neurodegenerative Diseases"],
        "system": "Nervous System"
    },
    "parkinson": {
        "pathways": ["R-HSA-390651", "R-HSA-8863678"],
        "pathway_names": ["Dopamine Neurotransmitter Release Cycle", "Neurodegenerative Diseases"],
        "system": "Nervous System"
    },
    # Cancer/Oncology
    "cancer": {
        "pathways": ["R-HSA-1643685", "R-HSA-5663202"],
        "pathway_names": ["Disease", "Diseases of signal transduction by growth factor receptors"],
        "system": "Cell Growth/Oncology"
    },
    "tumor": {
        "pathways": ["R-HSA-1643685", "R-HSA-212436"],
        "pathway_names": ["Disease", "Generic Transcription Pathway"],
        "system": "Cell Growth/Oncology"
    },
    "leukemia": {
        "pathways": ["R-HSA-1643685", "R-HSA-983169"],
        "pathway_names": ["Disease", "Class I MHC mediated antigen processing"],
        "system": "Hematology/Oncology"
    },
    # Metabolic
    "diabetes": {
        "pathways": ["R-HSA-422356", "R-HSA-163685"],
        "pathway_names": ["Regulation of insulin secretion", "Integration of energy metabolism"],
        "system": "Metabolic"
    },
    "obesity": {
        "pathways": ["R-HSA-163685", "R-HSA-556833"],
        "pathway_names": ["Integration of energy metabolism", "Metabolism of lipids"],
        "system": "Metabolic"
    },
    "cholesterol": {
        "pathways": ["R-HSA-8957322", "R-HSA-556833"],
        "pathway_names": ["Cholesterol biosynthesis", "Metabolism of lipids"],
        "system": "Metabolic"
    },
    # Respiratory
    "asthma": {
        "pathways": ["R-HSA-2672351", "R-HSA-449147"],
        "pathway_names": ["Arachidonic acid metabolism", "Signaling by Interleukins"],
        "system": "Respiratory"
    },
    "copd": {
        "pathways": ["R-HSA-2672351", "R-HSA-168256"],
        "pathway_names": ["Arachidonic acid metabolism", "Immune System"],
        "system": "Respiratory"
    },
    # Gastrointestinal
    "ulcer": {
        "pathways": ["R-HSA-2672351", "R-HSA-418594"],
        "pathway_names": ["Arachidonic acid metabolism", "G alpha (i) signalling events"],
        "system": "Gastrointestinal"
    },
    "gastric": {
        "pathways": ["R-HSA-2672351", "R-HSA-416476"],
        "pathway_names": ["Arachidonic acid metabolism", "G alpha (q) signalling events"],
        "system": "Gastrointestinal"
    },
    # Infectious
    "infection": {
        "pathways": ["R-HSA-168256", "R-HSA-1280218"],
        "pathway_names": ["Immune System", "Adaptive Immune System"],
        "system": "Immune System"
    },
    "bacterial": {
        "pathways": ["R-HSA-168256", "R-HSA-1280218"],
        "pathway_names": ["Immune System", "Adaptive Immune System"],
        "system": "Immune System"
    },
    "viral": {
        "pathways": ["R-HSA-168256", "R-HSA-913531"],
        "pathway_names": ["Immune System", "Interferon Signaling"],
        "system": "Immune System"
    },
    # Autoimmune
    "autoimmune": {
        "pathways": ["R-HSA-168256", "R-HSA-449147"],
        "pathway_names": ["Immune System", "Signaling by Interleukins"],
        "system": "Immune System"
    },
    "lupus": {
        "pathways": ["R-HSA-168256", "R-HSA-913531"],
        "pathway_names": ["Immune System", "Interferon Signaling"],
        "system": "Immune System"
    },
    "psoriasis": {
        "pathways": ["R-HSA-449147", "R-HSA-6783783"],
        "pathway_names": ["Signaling by Interleukins", "Interleukin-10 signaling"],
        "system": "Immune/Dermatology"
    },
    # Hormonal/Endocrine
    "thyroid": {
        "pathways": ["R-HSA-209968", "R-HSA-418555"],
        "pathway_names": ["Thyroxine biosynthesis", "G alpha (s) signalling events"],
        "system": "Endocrine"
    },
    "hormone": {
        "pathways": ["R-HSA-418555", "R-HSA-9006931"],
        "pathway_names": ["G alpha (s) signalling events", "Signaling by Nuclear Receptors"],
        "system": "Endocrine"
    },
}

logger = logging.getLogger(__name__)


class ChEMBLClient:
    """Client for ChEMBL REST API"""

    def __init__(self):
        self.base_url = settings.chembl_base_url
        self.rate_limiter = RateLimiter(settings.chembl_rate_limit)
        self.timeout = 60.0

    @retry(
        stop=stop_after_attempt(settings.max_retries),
        wait=wait_exponential(multiplier=settings.retry_backoff_factor)
    )
    def _get(self, url: str) -> Dict[str, Any]:
        """Make GET request with retry logic"""
        self.rate_limiter.wait()
        logger.info(f"ChEMBL GET: {url}")

        headers = {"Accept": "application/json"}
        with httpx.Client(timeout=self.timeout) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()

    def find_compound_by_inchikey(self, inchikey: str) -> Optional[str]:
        """
        Find ChEMBL molecule ID from InChIKey.

        Args:
            inchikey: Standard InChIKey

        Returns:
            ChEMBL molecule ID (e.g., "CHEMBL521") or None
        """
        try:
            url = f"{self.base_url}/molecule.json?molecule_structures__standard_inchi_key={inchikey}"
            data = self._get(url)

            molecules = data.get("molecules", [])
            if molecules:
                chembl_id = molecules[0]["molecule_chembl_id"]
                logger.info(f"Found ChEMBL ID {chembl_id} for InChIKey {inchikey}")
                return chembl_id

            logger.warning(f"No ChEMBL molecule found for InChIKey {inchikey}")
            return None

        except Exception as e:
            logger.error(f"Error finding ChEMBL compound: {e}")
            return None

    def find_compound_by_smiles(self, smiles: str) -> Optional[str]:
        """
        Find ChEMBL molecule ID from SMILES (fallback).

        Args:
            smiles: Canonical SMILES

        Returns:
            ChEMBL molecule ID or None
        """
        try:
            # Use similarity search with threshold 100 (exact match)
            url = f"{self.base_url}/similarity/{smiles}/100.json"
            data = self._get(url)

            molecules = data.get("molecules", [])
            if molecules:
                chembl_id = molecules[0]["molecule_chembl_id"]
                logger.info(f"Found ChEMBL ID {chembl_id} via SMILES similarity")
                return chembl_id

            return None

        except Exception as e:
            logger.error(f"Error finding ChEMBL compound by SMILES: {e}")
            return None

    def get_target_activities(
        self,
        inchikey: str,
        smiles: Optional[str] = None
    ) -> tuple[List[TargetEvidence], ProvenanceRecord]:
        """
        Get protein targets and bioactivity data for a compound.

        Args:
            inchikey: Standard InChIKey
            smiles: Optional SMILES for fallback search

        Returns:
            Tuple of (List[TargetEvidence], ProvenanceRecord)
        """
        import time
        start_time = time.time()
        provenance = ProvenanceRecord(
            service="ChEMBL",
            endpoint=f"/activity (InChIKey: {inchikey[:14]}...)",
        )

        try:
            # Find ChEMBL molecule ID
            chembl_id = self.find_compound_by_inchikey(inchikey)
            if not chembl_id and smiles:
                chembl_id = self.find_compound_by_smiles(smiles)

            if not chembl_id:
                provenance.status = "error"
                provenance.error_message = "Compound not found in ChEMBL"
                provenance.duration_ms = (time.time() - start_time) * 1000
                return [], provenance

            # Get bioactivities
            # Filter for human targets with IC50/Ki/Kd data
            url = (
                f"{self.base_url}/activity.json?"
                f"molecule_chembl_id={chembl_id}&"
                "target_organism=Homo+sapiens&"
                "standard_type__in=IC50,Ki,Kd,EC50&"
                "pchembl_value__isnull=False&"
                "limit=100"
            )
            data = self._get(url)
            activities = data.get("activities", [])

            # Group by target and get best (lowest) potency for each
            target_map: Dict[str, Dict[str, Any]] = {}

            for activity in activities:
                target_chembl_id = activity.get("target_chembl_id")
                if not target_chembl_id:
                    continue

                pchembl_value_raw = activity.get("pchembl_value")
                if pchembl_value_raw is None:
                    continue

                # Convert to float for comparison (API may return string)
                try:
                    pchembl_value = float(pchembl_value_raw)
                except (ValueError, TypeError):
                    continue

                # Keep the best (highest pChEMBL = lowest IC50/Ki) for each target
                if target_chembl_id not in target_map or pchembl_value > target_map[target_chembl_id]["pchembl_value"]:
                    target_map[target_chembl_id] = {
                        "pchembl_value": pchembl_value,
                        "standard_type": activity.get("standard_type"),
                        "standard_value": activity.get("standard_value"),
                        "standard_units": activity.get("standard_units"),
                        "assay_chembl_id": activity.get("assay_chembl_id"),
                        "assay_description": activity.get("assay_description"),
                        "document_chembl_id": activity.get("document_chembl_id"),
                    }

            # Now get target details for all unique targets in batch (with caching)
            target_chembl_ids = list(target_map.keys())
            target_info_map = self._get_target_info_batch(target_chembl_ids)

            target_evidence = []
            for target_chembl_id, activity_data in target_map.items():
                target_info = target_info_map.get(target_chembl_id)
                if not target_info:
                    continue

                # Build AssayReference
                assay_ref = AssayReference(
                    assay_id=activity_data.get("assay_chembl_id", ""),
                    assay_description=activity_data.get("assay_description"),
                    source="ChEMBL",
                    source_url=f"https://www.ebi.ac.uk/chembl/assay_report_card/{activity_data.get('assay_chembl_id')}/"
                )

                # Calculate confidence score based on pChEMBL value
                # pChEMBL > 7 (IC50 < 100nM) = high confidence
                # pChEMBL 6-7 (100nM - 1uM) = medium
                # pChEMBL < 6 = lower
                pchembl = float(activity_data["pchembl_value"])
                if pchembl >= 7.0:
                    confidence_score = 0.9
                elif pchembl >= 6.0:
                    confidence_score = 0.7
                else:
                    confidence_score = 0.5

                # Use UniProt ID if available, otherwise fallback to ChEMBL ID
                target_id = target_info.get("uniprot_id") or target_chembl_id

                evidence = TargetEvidence(
                    target_id=target_id,
                    target_name=target_info["target_name"],
                    target_type=target_info.get("target_type"),
                    organism=target_info.get("organism", "Homo sapiens"),
                    pchembl_value=activity_data["pchembl_value"],
                    standard_type=activity_data["standard_type"],
                    standard_value=activity_data["standard_value"],
                    standard_units=activity_data["standard_units"],
                    assay_references=[assay_ref],
                    confidence_tier=ConfidenceTier.TIER_A,
                    confidence_score=confidence_score,
                    is_predicted=False,
                    source="ChEMBL"
                )
                target_evidence.append(evidence)

            provenance.duration_ms = (time.time() - start_time) * 1000
            provenance.status = "success"
            logger.info(f"Found {len(target_evidence)} targets for {chembl_id}")

            return target_evidence, provenance

        except Exception as e:
            provenance.status = "error"
            provenance.error_message = str(e)
            provenance.duration_ms = (time.time() - start_time) * 1000
            logger.error(f"Error getting ChEMBL activities: {e}")
            return [], provenance

    def _get_target_info(self, target_chembl_id: str) -> Optional[Dict[str, Any]]:
        """Get target details from ChEMBL"""
        try:
            url = f"{self.base_url}/target/{target_chembl_id}.json"
            data = self._get(url)

            # Extract UniProt ID - try multiple approaches
            uniprot_id = None
            components = data.get("target_components", [])

            for component in components:
                # Approach 1: Get directly from accession field (most reliable)
                accession = component.get("accession")
                if accession and self._is_valid_uniprot_id(accession):
                    uniprot_id = accession
                    logger.info(f"Found UniProt ID {uniprot_id} from accession for {target_chembl_id}")
                    break

                # Approach 2: Try target_component_xrefs
                xrefs = component.get("target_component_xrefs", [])
                for xref in xrefs:
                    if xref.get("xref_src_db") == "UniProt":
                        uniprot_id = xref.get("xref_id")
                        logger.info(f"Found UniProt ID {uniprot_id} from xrefs for {target_chembl_id}")
                        break

                if uniprot_id:
                    break

            if not uniprot_id:
                logger.warning(f"No UniProt ID found for target {target_chembl_id}")

            return {
                "target_name": data.get("pref_name", "Unknown"),
                "target_type": data.get("target_type"),
                "organism": data.get("organism"),
                "uniprot_id": uniprot_id,
                "target_chembl_id": target_chembl_id,
            }

        except Exception as e:
            logger.error(f"Error getting target info for {target_chembl_id}: {e}")
            return None

    def _is_valid_uniprot_id(self, identifier: str) -> bool:
        """Check if an identifier looks like a valid UniProt ID"""
        if not identifier:
            return False
        # UniProt IDs typically start with P, Q, O, A-N, or R and are 6-10 chars
        # Examples: P35354, Q9Y4K4, O15350
        if len(identifier) < 6 or len(identifier) > 10:
            return False
        first_char = identifier[0].upper()
        return first_char in 'PQOABCDEFGHIJKLMNR' and identifier[1:].isalnum()

    def _get_target_info_batch(self, target_chembl_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Get target details for multiple targets with caching.

        Uses cache first, then fetches missing targets.

        Args:
            target_chembl_ids: List of ChEMBL target IDs

        Returns:
            Dict mapping target_chembl_id -> target_info dict
        """
        results = {}

        if not target_chembl_ids:
            return results

        # Step 1: Check cache for all targets
        cached_targets = cache_service.get_many("target_info", target_chembl_ids)
        results.update(cached_targets)

        # Step 2: Identify cache misses
        missing_ids = [tid for tid in target_chembl_ids if tid not in cached_targets]

        if not missing_ids:
            logger.info(f"All {len(target_chembl_ids)} targets found in cache")
            return results

        logger.info(f"Target info cache hit: {len(cached_targets)}, fetching: {len(missing_ids)}")

        # Step 3: Fetch missing targets concurrently
        newly_fetched = fetch_concurrent(self._get_target_info, missing_ids, max_workers=5)
        results.update(newly_fetched)

        # Step 4: Cache newly fetched targets
        if newly_fetched:
            cache_service.set_many("target_info", newly_fetched)
            logger.info(f"Cached {len(newly_fetched)} new target info records")

        return results

    def get_potency_summary(
        self,
        inchikey: str,
        smiles: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get potency summary (IC50/EC50/Ki values) for dosage context.

        Args:
            inchikey: Standard InChIKey
            smiles: Optional SMILES for fallback search

        Returns:
            List of dicts with target_name, pchembl_value, standard_type,
            standard_value, standard_units, effective_concentration_nm, potency_category
        """
        cached = cache_service.get("potency_summary", inchikey)
        if cached:
            logger.debug(f"Cache hit for potency summary: {inchikey}")
            return cached

        try:
            chembl_id = self.find_compound_by_inchikey(inchikey)
            if not chembl_id and smiles:
                chembl_id = self.find_compound_by_smiles(smiles)

            if not chembl_id:
                return []

            url = (
                f"{self.base_url}/activity.json?"
                f"molecule_chembl_id={chembl_id}&"
                "target_organism=Homo+sapiens&"
                "standard_type__in=IC50,Ki,Kd,EC50&"
                "pchembl_value__isnull=False&"
                "limit=100"
            )
            data = self._get(url)
            activities = data.get("activities", [])

            # Group by target, keep best pchembl per target
            target_map: Dict[str, Dict[str, Any]] = {}

            for activity in activities:
                target_chembl_id = activity.get("target_chembl_id")
                pchembl_raw = activity.get("pchembl_value")
                if not target_chembl_id or pchembl_raw is None:
                    continue

                try:
                    pchembl = float(pchembl_raw)
                except (ValueError, TypeError):
                    continue

                std_value_raw = activity.get("standard_value")
                std_units = activity.get("standard_units", "nM")
                std_type = activity.get("standard_type", "IC50")

                try:
                    std_value = float(std_value_raw) if std_value_raw else 10 ** (9 - pchembl)
                except (ValueError, TypeError):
                    std_value = 10 ** (9 - pchembl)

                if target_chembl_id not in target_map or pchembl > target_map[target_chembl_id]["pchembl_value"]:
                    # Normalize to nM
                    if std_units == "uM":
                        effective_nm = std_value * 1000
                    elif std_units == "mM":
                        effective_nm = std_value * 1_000_000
                    elif std_units == "nM":
                        effective_nm = std_value
                    else:
                        effective_nm = 10 ** (9 - pchembl)

                    if pchembl >= 8:
                        category = "very_potent"
                    elif pchembl >= 7:
                        category = "potent"
                    elif pchembl >= 6:
                        category = "moderate"
                    else:
                        category = "weak"

                    target_map[target_chembl_id] = {
                        "target_chembl_id": target_chembl_id,
                        "pchembl_value": pchembl,
                        "standard_type": std_type,
                        "standard_value": std_value,
                        "standard_units": std_units or "nM",
                        "effective_concentration_nm": effective_nm,
                        "potency_category": category,
                    }

            # Resolve target names
            target_info_map = self._get_target_info_batch(list(target_map.keys()))
            results = []
            for tid, activity_data in target_map.items():
                info = target_info_map.get(tid)
                name = info["target_name"] if info else tid
                results.append({
                    "target_name": name,
                    "pchembl_value": activity_data["pchembl_value"],
                    "standard_type": activity_data["standard_type"],
                    "standard_value": activity_data["standard_value"],
                    "standard_units": activity_data["standard_units"],
                    "effective_concentration_nm": activity_data["effective_concentration_nm"],
                    "potency_category": activity_data["potency_category"],
                })

            results.sort(key=lambda x: x["pchembl_value"], reverse=True)
            cache_service.set("potency_summary", inchikey, results)
            logger.info(f"Potency summary: {len(results)} targets for {chembl_id}")
            return results

        except Exception as e:
            logger.error(f"Error getting potency summary: {e}")
            return []

    def get_drug_indications(self, chembl_id: str) -> List[Dict[str, Any]]:
        """
        Get drug indications from ChEMBL with caching.

        Args:
            chembl_id: ChEMBL molecule ID (e.g., "CHEMBL521")

        Returns:
            List of indication dicts with efo_term, mesh_heading, max_phase_for_ind
        """
        cached = cache_service.get("drug_indications", chembl_id)
        if cached:
            logger.debug(f"Cache hit for drug indications: {chembl_id}")
            return cached

        try:
            url = f"{self.base_url}/drug_indication.json?molecule_chembl_id={chembl_id}&limit=50"
            data = self._get(url)

            indications = data.get("drug_indications", [])
            result = []

            for ind in indications:
                result.append({
                    "efo_id": ind.get("efo_id"),
                    "efo_term": ind.get("efo_term"),
                    "mesh_id": ind.get("mesh_id"),
                    "mesh_heading": ind.get("mesh_heading"),
                    "max_phase": ind.get("max_phase_for_ind"),
                })

            cache_service.set("drug_indications", chembl_id, result)
            logger.info(f"Found {len(result)} indications for {chembl_id}")
            return result

        except Exception as e:
            logger.error(f"Error getting drug indications for {chembl_id}: {e}")
            return []

    def infer_pathways_from_indications(
        self,
        inchikey: str,
        smiles: Optional[str] = None
    ) -> List[PathwayMatch]:
        """
        Infer biological pathways from drug indications.

        Uses ChEMBL indication data to infer which biological pathways
        a drug likely affects based on its therapeutic uses.

        Args:
            inchikey: Standard InChIKey
            smiles: Optional SMILES for fallback search

        Returns:
            List of PathwayMatch objects inferred from indications
        """
        try:
            # Find ChEMBL molecule ID
            chembl_id = self.find_compound_by_inchikey(inchikey)
            if not chembl_id and smiles:
                chembl_id = self.find_compound_by_smiles(smiles)

            if not chembl_id:
                logger.warning("Cannot infer pathways: compound not found in ChEMBL")
                return []

            # Get indications
            indications = self.get_drug_indications(chembl_id)
            if not indications:
                logger.info(f"No indications found for {chembl_id}")
                return []

            # Map indications to pathways
            pathway_map: Dict[str, PathwayMatch] = {}
            matched_indications = []

            for indication in indications:
                efo_term = (indication.get("efo_term") or "").lower()
                mesh_heading = (indication.get("mesh_heading") or "").lower()
                max_phase = indication.get("max_phase")

                # Search for matching keywords in our mapping
                for keyword, pathway_info in INDICATION_PATHWAY_MAP.items():
                    if keyword in efo_term or keyword in mesh_heading:
                        matched_indications.append({
                            "term": indication.get("efo_term") or indication.get("mesh_heading"),
                            "keyword": keyword,
                            "system": pathway_info["system"]
                        })

                        # Add pathways from this indication
                        for i, pathway_id in enumerate(pathway_info["pathways"]):
                            if pathway_id not in pathway_map:
                                # High priority scores for indication-inferred pathways
                                # These represent clinically validated drug-pathway relationships
                                phase_val = float(max_phase) if max_phase else 0
                                if phase_val >= 4:
                                    confidence = 0.95  # Approved drug - highest priority
                                elif phase_val >= 3:
                                    confidence = 0.90  # Phase 3 - strong clinical evidence
                                elif phase_val >= 2:
                                    confidence = 0.85  # Phase 2 - good clinical evidence
                                else:
                                    confidence = 0.80  # Early phase or unknown

                                indication_term = indication.get('efo_term') or indication.get('mesh_heading')
                                pathway_map[pathway_id] = PathwayMatch(
                                    pathway_id=pathway_id,
                                    pathway_name=pathway_info["pathway_names"][i],
                                    pathway_species="Homo sapiens",
                                    matched_targets=[f"Inferred from: {indication_term}"],
                                    measured_targets_count=0,
                                    predicted_targets_count=0,
                                    impact_score=confidence,  # Use confidence as impact score
                                    confidence_tier=ConfidenceTier.TIER_B,
                                    confidence_score=confidence,
                                    explanation=f"Pathway inferred from drug indication '{indication_term}' ({pathway_info['system']})",
                                    pathway_url=f"https://reactome.org/content/detail/{pathway_id}"
                                )
                            else:
                                # Add indication to matched targets
                                ind_note = f"Inferred from: {indication.get('efo_term') or indication.get('mesh_heading')}"
                                if ind_note not in pathway_map[pathway_id].matched_targets:
                                    pathway_map[pathway_id].matched_targets.append(ind_note)

            pathways = list(pathway_map.values())

            if matched_indications:
                logger.info(f"Inferred {len(pathways)} pathways from {len(matched_indications)} indication matches for {chembl_id}")
                for match in matched_indications[:3]:  # Log first 3
                    logger.info(f"  - {match['term']} -> {match['system']}")

            return pathways

        except Exception as e:
            logger.error(f"Error inferring pathways from indications: {e}")
            return []
