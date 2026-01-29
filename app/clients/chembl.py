"""ChEMBL API client for target and bioactivity data"""

import httpx
from typing import List, Optional, Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from app.config import settings
from app.models.schemas import TargetEvidence, AssayReference, ProvenanceRecord, ConfidenceTier
from app.utils import RateLimiter

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

            # Now get target details for each unique target
            target_evidence = []
            for target_chembl_id, activity_data in target_map.items():
                target_info = self._get_target_info(target_chembl_id)
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
