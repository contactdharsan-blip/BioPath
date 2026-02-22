"""PubChem API client for compound resolution"""

import httpx
from concurrent.futures import ThreadPoolExecutor
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

            # Steps 2 & 3: Fetch properties and synonyms concurrently
            props_url = (
                f"{self.base_url}/compound/cid/{cid}/property/"
                "CanonicalSMILES,InChIKey,MolecularFormula,MolecularWeight,IUPACName/JSON"
            )
            synonyms_url = f"{self.base_url}/compound/cid/{cid}/synonyms/JSON"

            with ThreadPoolExecutor(max_workers=2) as executor:
                props_future = executor.submit(self._get, props_url)
                synonyms_future = executor.submit(self._get, synonyms_url)
                props_data = props_future.result()
                synonyms_data = synonyms_future.result()

            props = props_data["PropertyTable"]["Properties"][0]
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

    def get_toxicity_data(self, cid: int) -> Dict[str, Any]:
        """
        Get toxicity and pharmacology data from PubChem PUG View.

        Args:
            cid: PubChem CID

        Returns:
            Dict with keys: ld50_values, therapeutic_doses, toxicity_notes
        """
        import re

        result = {
            "ld50_values": [],
            "therapeutic_doses": [],
            "toxicity_notes": [],
        }

        try:
            url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON"
            self.rate_limiter.wait()
            logger.info(f"PubChem PUG View GET: {url}")

            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(url)
                response.raise_for_status()
                data = response.json()

            record = data.get("Record", {})
            sections = record.get("Section", [])

            # Recursively search sections for toxicity data
            def find_sections(sections, target_headings):
                found = []
                for section in sections:
                    heading = section.get("TOCHeading", "")
                    if any(t.lower() in heading.lower() for t in target_headings):
                        found.append(section)
                    # Recurse into subsections
                    subsections = section.get("Section", [])
                    if subsections:
                        found.extend(find_sections(subsections, target_headings))
                return found

            # Extract text from section information
            def extract_text(section):
                texts = []
                for info in section.get("Information", []):
                    value = info.get("Value", {})
                    for string_val in value.get("StringWithMarkup", []):
                        text = string_val.get("String", "")
                        if text:
                            texts.append(text)
                # Recurse into subsections
                for sub in section.get("Section", []):
                    texts.extend(extract_text(sub))
                return texts

            # Search for toxicity sections
            tox_sections = find_sections(sections, ["Toxicity", "Acute Effects", "LD50"])
            for sec in tox_sections:
                texts = extract_text(sec)
                for text in texts:
                    # Parse LD50 values
                    ld50_patterns = [
                        r'LD50\s*(?:\(|:)?\s*(oral|dermal|intravenous|intraperitoneal|subcutaneous|i\.v\.|i\.p\.|s\.c\.)\s*(?:\)|:)?\s*(?:in\s+)?(rat|mouse|rabbit|dog|human|guinea pig)?\s*(?::|\)|\s)\s*([\d,.]+)\s*(mg/kg|g/kg|mg/L|mL/kg)',
                        r'LD50\s*(?:=|:)\s*([\d,.]+)\s*(mg/kg|g/kg)\s*\((oral|dermal|i\.v\.)[,;]\s*(rat|mouse|rabbit)\)',
                    ]
                    for pattern in ld50_patterns:
                        matches = re.finditer(pattern, text, re.IGNORECASE)
                        for match in matches:
                            groups = match.groups()
                            if len(groups) >= 4:
                                route = groups[0]
                                species = groups[1] or "unknown"
                                value_str = groups[2].replace(",", "")
                                unit = groups[3]
                            elif len(groups) >= 3:
                                value_str = groups[0].replace(",", "")
                                unit = groups[1]
                                route = groups[2] if len(groups) > 2 else "unknown"
                                species = groups[3] if len(groups) > 3 else "unknown"
                            else:
                                continue

                            try:
                                value = float(value_str)
                                result["ld50_values"].append({
                                    "value": value,
                                    "unit": unit,
                                    "route": route.strip(),
                                    "species": species.strip() if species else "unknown",
                                    "raw_text": text[:200],
                                })
                            except (ValueError, TypeError):
                                pass

                    # Add general toxicity notes (limit length)
                    if len(text) > 20 and len(text) < 500:
                        if any(kw in text.lower() for kw in ["toxic", "lethal", "ld50", "acute", "poison"]):
                            result["toxicity_notes"].append(text[:300])

            # Search for pharmacology/drug information sections
            pharm_sections = find_sections(sections, [
                "Drug and Medication", "Therapeutic", "Pharmacology",
                "Dosage", "Administration"
            ])
            for sec in pharm_sections:
                texts = extract_text(sec)
                for text in texts:
                    # Look for dosage information
                    dose_patterns = [
                        r'(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(mg|mg/kg|g|mcg|μg)\s*(?:per day|daily|orally|by mouth)',
                        r'(?:dose|dosage)(?:\s+is)?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(mg|mg/kg|g)',
                        r'(\d+(?:\.\d+)?)\s*(mg|g|mcg)\s*(?:orally|by mouth|per day|daily)',
                    ]
                    for pattern in dose_patterns:
                        matches = re.finditer(pattern, text, re.IGNORECASE)
                        for match in matches:
                            groups = match.groups()
                            try:
                                if len(groups) >= 3:
                                    result["therapeutic_doses"].append({
                                        "value_low": float(groups[0]),
                                        "value_high": float(groups[1]),
                                        "unit": groups[2],
                                        "raw_text": text[:200],
                                    })
                                elif len(groups) >= 2:
                                    result["therapeutic_doses"].append({
                                        "value_low": float(groups[0]),
                                        "unit": groups[1],
                                        "raw_text": text[:200],
                                    })
                            except (ValueError, TypeError):
                                pass

            # Deduplicate
            result["toxicity_notes"] = list(set(result["toxicity_notes"]))[:5]
            logger.info(f"PubChem toxicity: {len(result['ld50_values'])} LD50, {len(result['therapeutic_doses'])} doses for CID {cid}")

        except httpx.HTTPStatusError as e:
            logger.warning(f"PubChem PUG View error for CID {cid}: {e.response.status_code}")
        except Exception as e:
            logger.warning(f"PubChem toxicity data error for CID {cid}: {e}")

        return result

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
