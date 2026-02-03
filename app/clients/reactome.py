"""Reactome API client for pathway mapping"""

import httpx
from typing import List, Dict, Any, Set
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from app.config import settings
from app.models.schemas import ProvenanceRecord
from app.utils import RateLimiter, fetch_concurrent
from app.services.cache import cache_service

logger = logging.getLogger(__name__)


class ReactomeClient:
    """Client for Reactome Content Service API"""

    def __init__(self):
        self.base_url = settings.reactome_base_url
        # Analysis Service is at a different path
        self.analysis_url = "https://reactome.org/AnalysisService"
        self.rate_limiter = RateLimiter(settings.reactome_rate_limit)
        self.timeout = 60.0

    def _is_valid_uniprot_id(self, identifier: str) -> bool:
        """Check if an identifier looks like a valid UniProt ID"""
        if not identifier:
            return False
        # UniProt IDs typically start with P, Q, O, A-N, or R and are 6-10 chars
        # ChEMBL IDs start with "CHEMBL" - filter those out
        if identifier.upper().startswith("CHEMBL"):
            return False
        if len(identifier) < 6 or len(identifier) > 10:
            return False
        first_char = identifier[0].upper()
        return first_char in 'PQOABCDEFGHIJKLMNR' and identifier[1:].isalnum()

    @retry(
        stop=stop_after_attempt(settings.max_retries),
        wait=wait_exponential(multiplier=settings.retry_backoff_factor)
    )
    def _get(self, url: str) -> Any:
        """Make GET request with retry logic"""
        self.rate_limiter.wait()
        logger.info(f"Reactome GET: {url}")

        headers = {"Accept": "application/json"}
        with httpx.Client(timeout=self.timeout) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()

    @retry(
        stop=stop_after_attempt(settings.max_retries),
        wait=wait_exponential(multiplier=settings.retry_backoff_factor)
    )
    def _post(self, url: str, data: Any) -> Any:
        """Make POST request with retry logic"""
        self.rate_limiter.wait()
        logger.info(f"Reactome POST: {url}")

        headers = {
            "Accept": "application/json",
            "Content-Type": "text/plain"
        }
        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(url, content=data, headers=headers)
            response.raise_for_status()
            return response.json()

    def map_targets_to_pathways(
        self,
        target_ids: List[str],
        species: str = "Homo sapiens"
    ) -> tuple[Dict[str, List[Dict[str, Any]]], ProvenanceRecord]:
        """
        Map protein targets to Reactome pathways.

        Args:
            target_ids: List of UniProt IDs or gene symbols
            species: Species name (default: Homo sapiens)

        Returns:
            Tuple of (pathway_map, ProvenanceRecord)
            pathway_map: {target_id: [pathway_dicts]}
        """
        import time
        start_time = time.time()
        provenance = ProvenanceRecord(
            service="Reactome",
            endpoint="/data/mapping/projection",
        )

        if not target_ids:
            provenance.status = "success"
            provenance.duration_ms = (time.time() - start_time) * 1000
            return {}, provenance

        try:
            # Filter for valid UniProt IDs only - Reactome doesn't recognize ChEMBL IDs
            valid_ids = [tid for tid in target_ids if self._is_valid_uniprot_id(tid)]
            invalid_ids = [tid for tid in target_ids if tid not in valid_ids]

            if invalid_ids:
                logger.warning(f"Skipping {len(invalid_ids)} non-UniProt IDs for Reactome: {invalid_ids[:5]}...")

            if not valid_ids:
                logger.warning("No valid UniProt IDs to map to pathways")
                provenance.status = "success"
                provenance.duration_ms = (time.time() - start_time) * 1000
                return {}, provenance

            logger.info(f"Mapping {len(valid_ids)} UniProt IDs to pathways: {valid_ids[:5]}...")

            # Reactome Analysis Service expects newline-separated identifiers
            identifiers_text = "\n".join(valid_ids)

            # Use Analysis Service for identifier-to-pathway mapping
            url = f"{self.analysis_url}/identifiers/projection?interactors=false"
            results = self._post(url, identifiers_text)

            # Parse results from Analysis Service response format
            pathway_map: Dict[str, List[Dict[str, Any]]] = {}

            # The Analysis Service returns pathways with their participating identifiers
            pathways_found = results.get("pathways", [])
            logger.info(f"Reactome found {len(pathways_found)} pathways")

            # Build a map of target_id -> pathways
            for pathway in pathways_found:
                pathway_info = {
                    "pathway_id": pathway.get("stId"),
                    "pathway_name": pathway.get("name"),
                    "pathway_species": pathway.get("species", {}).get("name"),
                    "is_inferred": pathway.get("species", {}).get("taxId") != "9606",
                    "p_value": pathway.get("entities", {}).get("pValue"),
                    "fdr": pathway.get("entities", {}).get("fdr"),
                }

                # For now, associate the pathway with all submitted targets
                # (Analysis Service doesn't directly tell us which specific target maps to which pathway)
                for target_id in valid_ids:
                    if target_id not in pathway_map:
                        pathway_map[target_id] = []
                    pathway_map[target_id].append(pathway_info)

            provenance.duration_ms = (time.time() - start_time) * 1000
            provenance.status = "success"

            # Enhanced logging
            total_pathways = len(pathways_found)
            logger.info(f"Reactome mapping results: {total_pathways} pathways found for {len(valid_ids)} targets")
            if pathways_found:
                logger.info(f"Sample pathway: {pathways_found[0].get('name')}")

            return pathway_map, provenance

        except Exception as e:
            provenance.status = "error"
            provenance.error_message = str(e)
            provenance.duration_ms = (time.time() - start_time) * 1000
            logger.error(f"Error mapping targets to pathways: {e}")
            return {}, provenance

    def get_pathway_details(self, pathway_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a pathway with caching.

        Args:
            pathway_id: Reactome stable identifier (e.g., "R-HSA-211859")

        Returns:
            Pathway details dict
        """
        # Check cache first
        cached = cache_service.get("pathway_details", pathway_id)
        if cached:
            logger.debug(f"Cache hit for pathway details: {pathway_id}")
            return cached

        try:
            url = f"{self.base_url}/data/query/{pathway_id}"
            data = self._get(url)

            result = {
                "pathway_id": data.get("stId"),
                "pathway_name": data.get("displayName"),
                "pathway_species": data.get("speciesName"),
                "summation": data.get("summation", [{}])[0].get("text") if data.get("summation") else None,
                "doi": data.get("doi"),
                "url": f"https://reactome.org/content/detail/{pathway_id}",
            }

            # Cache the result
            cache_service.set("pathway_details", pathway_id, result)
            return result

        except Exception as e:
            logger.error(f"Error getting pathway details for {pathway_id}: {e}")
            return {}

    def get_pathway_participants(self, pathway_id: str) -> List[str]:
        """
        Get all participants (proteins/genes) in a pathway with caching.

        Args:
            pathway_id: Reactome stable identifier

        Returns:
            List of UniProt IDs
        """
        # Check cache first
        cached = cache_service.get("pathway_participants", pathway_id)
        if cached:
            logger.debug(f"Cache hit for pathway participants: {pathway_id}")
            return cached

        try:
            url = f"{self.base_url}/data/participants/{pathway_id}"
            participants = self._get(url)

            uniprot_ids = []
            for participant in participants:
                # Extract UniProt IDs from refEntities (Reactome's current format)
                ref_entities = participant.get("refEntities", [])
                for ref in ref_entities:
                    identifier = ref.get("identifier")
                    if identifier and self._is_valid_uniprot_id(identifier):
                        uniprot_ids.append(identifier)

                # Also check crossReferences for backwards compatibility
                cross_refs = participant.get("crossReferences", [])
                for ref in cross_refs:
                    if ref.get("databaseName") == "UniProt":
                        uniprot_ids.append(ref.get("identifier"))

            result = list(set(uniprot_ids))  # Remove duplicates
            logger.info(f"Found {len(result)} UniProt IDs in pathway {pathway_id}")

            # Cache the result
            cache_service.set("pathway_participants", pathway_id, result)
            return result

        except Exception as e:
            logger.error(f"Error getting pathway participants for {pathway_id}: {e}")
            return []

    def get_related_pathways(self, pathway_id: str) -> List[str]:
        """
        Get related pathways (parent/child relationships).

        Args:
            pathway_id: Reactome stable identifier

        Returns:
            List of related pathway IDs
        """
        try:
            url = f"{self.base_url}/data/pathways/low/diagram/entity/{pathway_id}"
            pathways = self._get(url)

            return [p.get("stId") for p in pathways if p.get("stId")]

        except Exception as e:
            logger.error(f"Error getting related pathways for {pathway_id}: {e}")
            return []

    def get_pathway_participants_batch(
        self,
        pathway_ids: List[str],
        max_workers: int = 5
    ) -> Dict[str, List[str]]:
        """
        Get participants for multiple pathways concurrently with caching.

        Args:
            pathway_ids: List of Reactome pathway IDs
            max_workers: Maximum concurrent requests

        Returns:
            Dict mapping pathway_id -> list of UniProt IDs
        """
        results = {}

        if not pathway_ids:
            return results

        # Step 1: Check cache for all pathways
        cached = cache_service.get_many("pathway_participants", pathway_ids)
        results.update(cached)

        # Step 2: Identify cache misses
        missing_ids = [pid for pid in pathway_ids if pid not in cached]

        if not missing_ids:
            logger.info(f"All {len(pathway_ids)} pathway participants found in cache")
            return results

        logger.info(f"Pathway participants - cache hit: {len(cached)}, fetching: {len(missing_ids)}")

        # Step 3: Fetch missing pathways concurrently
        newly_fetched = fetch_concurrent(
            self.get_pathway_participants,
            missing_ids,
            max_workers=max_workers
        )

        results.update(newly_fetched)
        return results
