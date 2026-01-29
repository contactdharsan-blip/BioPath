"""Reactome API client for pathway mapping"""

import httpx
from typing import List, Dict, Any, Set
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from app.config import settings
from app.models.schemas import ProvenanceRecord
from app.utils import RateLimiter

logger = logging.getLogger(__name__)


class ReactomeClient:
    """Client for Reactome Content Service API"""

    def __init__(self):
        self.base_url = settings.reactome_base_url
        self.rate_limiter = RateLimiter(settings.reactome_rate_limit)
        self.timeout = 30.0

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
            # Reactome mapping endpoint expects newline-separated identifiers
            identifiers_text = "\n".join(target_ids)

            # Use projection mapping to map to pathways
            url = f"{self.base_url}/data/mapping/projection"
            results = self._post(url, identifiers_text)

            # Parse results
            pathway_map: Dict[str, List[Dict[str, Any]]] = {}

            for result in results:
                identifier = result.get("identifier")
                maps_to = result.get("mapsTo", [])

                if not identifier or not maps_to:
                    continue

                pathways = []
                for mapping in maps_to:
                    pathway_info = {
                        "pathway_id": mapping.get("stId"),
                        "pathway_name": mapping.get("displayName"),
                        "pathway_species": mapping.get("species"),
                        "is_inferred": mapping.get("isInferred", False),
                    }
                    pathways.append(pathway_info)

                pathway_map[identifier] = pathways

            provenance.duration_ms = (time.time() - start_time) * 1000
            provenance.status = "success"
            logger.info(f"Mapped {len(pathway_map)} targets to pathways")

            return pathway_map, provenance

        except Exception as e:
            provenance.status = "error"
            provenance.error_message = str(e)
            provenance.duration_ms = (time.time() - start_time) * 1000
            logger.error(f"Error mapping targets to pathways: {e}")
            return {}, provenance

    def get_pathway_details(self, pathway_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a pathway.

        Args:
            pathway_id: Reactome stable identifier (e.g., "R-HSA-211859")

        Returns:
            Pathway details dict
        """
        try:
            url = f"{self.base_url}/data/query/{pathway_id}"
            data = self._get(url)

            return {
                "pathway_id": data.get("stId"),
                "pathway_name": data.get("displayName"),
                "pathway_species": data.get("speciesName"),
                "summation": data.get("summation", [{}])[0].get("text") if data.get("summation") else None,
                "doi": data.get("doi"),
                "url": f"https://reactome.org/content/detail/{pathway_id}",
            }

        except Exception as e:
            logger.error(f"Error getting pathway details for {pathway_id}: {e}")
            return {}

    def get_pathway_participants(self, pathway_id: str) -> List[str]:
        """
        Get all participants (proteins/genes) in a pathway.

        Args:
            pathway_id: Reactome stable identifier

        Returns:
            List of UniProt IDs
        """
        try:
            url = f"{self.base_url}/data/participants/{pathway_id}"
            participants = self._get(url)

            uniprot_ids = []
            for participant in participants:
                # Extract UniProt IDs from cross-references
                refs = participant.get("crossReferences", [])
                for ref in refs:
                    if ref.get("databaseName") == "UniProt":
                        uniprot_ids.append(ref.get("identifier"))

            return list(set(uniprot_ids))  # Remove duplicates

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
