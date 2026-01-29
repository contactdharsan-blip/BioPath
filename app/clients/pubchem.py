"""PubChem API client for compound resolution"""

import httpx
from typing import Optional, Dict, Any, List
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from app.config import settings
from app.models.schemas import CompoundIdentity, ProvenanceRecord
from app.utils import RateLimiter

logger = logging.getLogger(__name__)


class PubChemClient:
    """Client for PubChem PUG REST API"""

    def __init__(self):
        self.base_url = settings.pubchem_base_url
        self.rate_limiter = RateLimiter(settings.pubchem_rate_limit)
        self.timeout = 60.0

    @retry(
        stop=stop_after_attempt(settings.max_retries),
        wait=wait_exponential(multiplier=settings.retry_backoff_factor)
    )
    def _get(self, url: str) -> Dict[str, Any]:
        """Make GET request with retry logic"""
        self.rate_limiter.wait()
        logger.info(f"PubChem GET: {url}")

        with httpx.Client(timeout=self.timeout) as client:
            response = client.get(url)
            response.raise_for_status()
            return response.json()

    def resolve_compound(
        self,
        ingredient_name: str
    ) -> tuple[Optional[CompoundIdentity], ProvenanceRecord]:
        """
        Resolve ingredient name to canonical structure via PubChem.

        Args:
            ingredient_name: Common name or synonym

        Returns:
            Tuple of (CompoundIdentity, ProvenanceRecord)
        """
        import time
        start_time = time.time()
        provenance = ProvenanceRecord(
            service="PubChem",
            endpoint=f"/compound/name/{ingredient_name}",
        )

        try:
            # Step 1: Get CID from name
            cid_url = f"{self.base_url}/compound/name/{ingredient_name}/cids/JSON"
            cid_data = self._get(cid_url)

            if not cid_data.get("IdentifierList", {}).get("CID"):
                provenance.status = "error"
                provenance.error_message = "No CID found"
                return None, provenance

            cid = cid_data["IdentifierList"]["CID"][0]

            # Step 2: Get compound properties
            props_url = (
                f"{self.base_url}/compound/cid/{cid}/property/"
                "CanonicalSMILES,InChIKey,MolecularFormula,MolecularWeight,IUPACName/JSON"
            )
            props_data = self._get(props_url)
            props = props_data["PropertyTable"]["Properties"][0]

            # Step 3: Get synonyms
            synonyms_url = f"{self.base_url}/compound/cid/{cid}/synonyms/JSON"
            synonyms_data = self._get(synonyms_url)
            synonyms = synonyms_data.get("InformationList", {}).get("Information", [{}])[0].get("Synonym", [])

            # Build CompoundIdentity
            compound = CompoundIdentity(
                ingredient_name=ingredient_name,
                pubchem_cid=cid,
                canonical_smiles=props.get("CanonicalSMILES"),
                inchikey=props.get("InChIKey"),
                molecular_formula=props.get("MolecularFormula"),
                molecular_weight=props.get("MolecularWeight"),
                iupac_name=props.get("IUPACName"),
                synonyms=synonyms[:10]  # Limit to first 10
            )

            provenance.duration_ms = (time.time() - start_time) * 1000
            provenance.status = "success"
            logger.info(f"Resolved {ingredient_name} to CID {cid}")

            return compound, provenance

        except httpx.HTTPStatusError as e:
            provenance.status = "error"
            provenance.error_message = f"HTTP {e.response.status_code}: {str(e)}"
            provenance.duration_ms = (time.time() - start_time) * 1000
            logger.error(f"PubChem error for {ingredient_name}: {e}")
            return None, provenance

        except Exception as e:
            provenance.status = "error"
            provenance.error_message = str(e)
            provenance.duration_ms = (time.time() - start_time) * 1000
            logger.error(f"Unexpected error resolving {ingredient_name}: {e}")
            return None, provenance

    def get_cid_from_inchikey(self, inchikey: str) -> Optional[int]:
        """Get PubChem CID from InChIKey"""
        try:
            url = f"{self.base_url}/compound/inchikey/{inchikey}/cids/JSON"
            data = self._get(url)
            cids = data.get("IdentifierList", {}).get("CID", [])
            return cids[0] if cids else None
        except Exception as e:
            logger.error(f"Error getting CID for InChIKey {inchikey}: {e}")
            return None
