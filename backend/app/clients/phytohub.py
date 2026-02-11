"""PhytoHub database client for dietary phytochemicals

PhytoHub contains detailed information about dietary phytochemicals and their
human metabolites - polyphenols, terpenoids, alkaloids, and other plant
secondary metabolites found in foods.

Source: https://phytohub.eu/
"""

import httpx
import re
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field

from app.services.cache import cache_service

logger = logging.getLogger(__name__)


@dataclass
class PhytoHubCompound:
    """Compound entry from PhytoHub database"""
    name: str
    phytohub_id: Optional[str] = None
    formula: Optional[str] = None
    monoisotopic_mass: Optional[float] = None
    compound_class: Optional[str] = None
    food_sources: List[str] = field(default_factory=list)
    metabolites: List[str] = field(default_factory=list)
    pubchem_id: Optional[str] = None
    chebi_id: Optional[str] = None


@dataclass
class PhytoHubFoodResult:
    """Food/plant search result from PhytoHub"""
    food_name: str
    phytohub_id: Optional[str] = None
    compounds: List[PhytoHubCompound] = field(default_factory=list)
    compound_count: int = 0


class PhytoHubClient:
    """
    Client for PhytoHub database of dietary phytochemicals.

    PhytoHub contains ~1200 phytochemicals from 350+ foods with metabolite
    information. Useful for understanding how plant compounds are metabolized
    in humans.

    Free public access, no API key required.
    """

    def __init__(self):
        self.base_url = "https://phytohub.eu"
        self.timeout = 30.0
        self.cache_ttl = 86400 * 7  # Cache for 7 days

    def _get_cached(self, cache_key: str) -> Optional[Any]:
        """Get cached result"""
        return cache_service.get("phytohub", cache_key)

    def _set_cached(self, cache_key: str, value: Any) -> None:
        """Cache a result"""
        cache_service.set("phytohub", cache_key, value, ttl=self.cache_ttl)

    def search_food(self, food_name: str) -> Optional[PhytoHubFoodResult]:
        """
        Search for a food/plant and get its phytochemicals.

        Args:
            food_name: Food or plant name to search for

        Returns:
            PhytoHubFoodResult with compounds, or None if not found
        """
        cache_key = f"food_{food_name.lower().replace(' ', '_')}"
        cached = self._get_cached(cache_key)
        if cached:
            logger.info(f"PhytoHub cache hit for food: {food_name}")
            return self._dict_to_food_result(cached)

        try:
            with httpx.Client(timeout=self.timeout) as client:
                # Search for the food
                response = client.get(
                    f"{self.base_url}/search/foods",
                    params={"query": food_name}
                )
                response.raise_for_status()
                html = response.text

                # Parse food results
                result = self._parse_food_search(html, food_name)

                if result and result.phytohub_id:
                    # Get compounds for this food
                    compounds = self._get_food_compounds(client, result.phytohub_id, food_name)
                    result.compounds = compounds
                    result.compound_count = len(compounds)

                    # Cache the result
                    self._set_cached(cache_key, self._food_result_to_dict(result))

                    logger.info(f"PhytoHub found {len(compounds)} compounds for {food_name}")
                    return result

                logger.info(f"PhytoHub: food not found - {food_name}")
                return None

        except httpx.HTTPStatusError as e:
            logger.error(f"PhytoHub API error: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"PhytoHub error searching {food_name}: {e}")
            return None

    def _parse_food_search(self, html: str, search_term: str) -> Optional[PhytoHubFoodResult]:
        """Parse food search results from HTML"""
        # Look for food entries in search results
        # Pattern: link to food detail page
        food_pattern = r'<a[^>]*href="[^"]*/foods/([^"/]+)"[^>]*>([^<]+)</a>'
        matches = re.findall(food_pattern, html, re.IGNORECASE)

        if not matches:
            # Try alternative pattern
            food_pattern2 = r'href="[^"]*food[^"]*id=(\d+)"[^>]*>([^<]+)</a>'
            matches = re.findall(food_pattern2, html, re.IGNORECASE)

        if not matches:
            return None

        # Find best match for search term
        search_lower = search_term.lower()
        for food_id, name in matches:
            if search_lower in name.lower():
                return PhytoHubFoodResult(
                    food_name=name.strip(),
                    phytohub_id=food_id
                )

        # Return first match if no exact match
        if matches:
            return PhytoHubFoodResult(
                food_name=matches[0][1].strip(),
                phytohub_id=matches[0][0]
            )

        return None

    def _get_food_compounds(
        self,
        client: httpx.Client,
        food_id: str,
        food_name: str
    ) -> List[PhytoHubCompound]:
        """Get compounds for a specific food"""
        compounds = []

        try:
            # Try to get food detail page
            response = client.get(
                f"{self.base_url}/foods/{food_id}"
            )
            response.raise_for_status()
            html = response.text

            # Parse compound entries
            # Look for compound links
            compound_pattern = r'<a[^>]*href="[^"]*/compounds/([^"/]+)"[^>]*>([^<]+)</a>'
            matches = re.findall(compound_pattern, html, re.IGNORECASE)

            seen_names = set()
            for comp_id, name in matches[:50]:  # Limit to 50
                name = name.strip()
                if name.lower() not in seen_names and len(name) > 2:
                    seen_names.add(name.lower())
                    compounds.append(PhytoHubCompound(
                        name=name,
                        phytohub_id=comp_id,
                        food_sources=[food_name]
                    ))

        except Exception as e:
            logger.error(f"Error getting compounds for food {food_id}: {e}")

        return compounds

    def search_compound(self, compound_name: str) -> Optional[PhytoHubCompound]:
        """
        Search for a specific compound.

        Args:
            compound_name: Compound name to search for

        Returns:
            PhytoHubCompound with details, or None if not found
        """
        cache_key = f"compound_{compound_name.lower().replace(' ', '_')}"
        cached = self._get_cached(cache_key)
        if cached:
            logger.info(f"PhytoHub cache hit for compound: {compound_name}")
            return PhytoHubCompound(**cached)

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(
                    f"{self.base_url}/search/compounds",
                    params={"query": compound_name}
                )
                response.raise_for_status()
                html = response.text

                # Parse compound results
                compound_pattern = r'<a[^>]*href="[^"]*/compounds/([^"/]+)"[^>]*>([^<]+)</a>'
                matches = re.findall(compound_pattern, html, re.IGNORECASE)

                if not matches:
                    return None

                # Find best match
                search_lower = compound_name.lower()
                for comp_id, name in matches:
                    if search_lower in name.lower():
                        compound = PhytoHubCompound(
                            name=name.strip(),
                            phytohub_id=comp_id
                        )
                        # Get more details
                        self._enrich_compound(client, compound)

                        # Cache it
                        self._set_cached(cache_key, self._compound_to_dict(compound))
                        return compound

                # Return first match
                if matches:
                    compound = PhytoHubCompound(
                        name=matches[0][1].strip(),
                        phytohub_id=matches[0][0]
                    )
                    self._enrich_compound(client, compound)
                    self._set_cached(cache_key, self._compound_to_dict(compound))
                    return compound

                return None

        except Exception as e:
            logger.error(f"PhytoHub error searching compound {compound_name}: {e}")
            return None

    def _enrich_compound(self, client: httpx.Client, compound: PhytoHubCompound) -> None:
        """Enrich compound with additional details from its detail page"""
        if not compound.phytohub_id:
            return

        try:
            response = client.get(
                f"{self.base_url}/compounds/{compound.phytohub_id}"
            )
            response.raise_for_status()
            html = response.text

            # Extract formula
            formula_match = re.search(r'Formula[^:]*:\s*</[^>]+>\s*([A-Z][A-Za-z0-9]+)', html)
            if formula_match:
                compound.formula = formula_match.group(1)

            # Extract mass
            mass_match = re.search(r'Monoisotopic[^:]*:\s*</[^>]+>\s*([\d.]+)', html)
            if mass_match:
                compound.monoisotopic_mass = float(mass_match.group(1))

            # Extract compound class
            class_match = re.search(r'Class[^:]*:\s*</[^>]+>\s*([^<]+)', html)
            if class_match:
                compound.compound_class = class_match.group(1).strip()

            # Extract food sources
            food_pattern = r'<a[^>]*href="[^"]*/foods/[^"]*"[^>]*>([^<]+)</a>'
            food_matches = re.findall(food_pattern, html, re.IGNORECASE)
            compound.food_sources = list(set(f.strip() for f in food_matches if f.strip()))[:10]

            # Extract metabolites
            metabolite_pattern = r'metabolite[^>]*>([^<]+)</a>'
            metabolite_matches = re.findall(metabolite_pattern, html, re.IGNORECASE)
            compound.metabolites = list(set(m.strip() for m in metabolite_matches if m.strip()))[:10]

            # Extract external IDs
            pubchem_match = re.search(r'PubChem[^:]*:\s*</[^>]+>\s*(\d+)', html, re.IGNORECASE)
            if pubchem_match:
                compound.pubchem_id = pubchem_match.group(1)

            chebi_match = re.search(r'ChEBI[^:]*:\s*</[^>]+>\s*CHEBI:?(\d+)', html, re.IGNORECASE)
            if chebi_match:
                compound.chebi_id = f"CHEBI:{chebi_match.group(1)}"

        except Exception as e:
            logger.debug(f"Could not enrich compound {compound.name}: {e}")

    def get_compounds_by_class(self, compound_class: str) -> List[PhytoHubCompound]:
        """
        Get compounds belonging to a specific class.

        Args:
            compound_class: Class name (e.g., "Flavonoids", "Phenolic acids")

        Returns:
            List of compounds in that class
        """
        cache_key = f"class_{compound_class.lower().replace(' ', '_')}"
        cached = self._get_cached(cache_key)
        if cached:
            return [PhytoHubCompound(**c) for c in cached]

        compounds = []

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(
                    f"{self.base_url}/search/compounds",
                    params={"query": compound_class, "class": compound_class}
                )
                response.raise_for_status()
                html = response.text

                # Parse compound results
                compound_pattern = r'<a[^>]*href="[^"]*/compounds/([^"/]+)"[^>]*>([^<]+)</a>'
                matches = re.findall(compound_pattern, html, re.IGNORECASE)

                seen_names = set()
                for comp_id, name in matches[:30]:
                    name = name.strip()
                    if name.lower() not in seen_names and len(name) > 2:
                        seen_names.add(name.lower())
                        compounds.append(PhytoHubCompound(
                            name=name,
                            phytohub_id=comp_id,
                            compound_class=compound_class
                        ))

                # Cache results
                self._set_cached(cache_key, [self._compound_to_dict(c) for c in compounds])

        except Exception as e:
            logger.error(f"PhytoHub error searching class {compound_class}: {e}")

        return compounds

    def get_plant_compounds_for_species(
        self,
        plant_common_name: str
    ) -> Dict[str, Any]:
        """
        Get compound data formatted for integration with plant_compounds.py

        Uses common name since PhytoHub indexes by food name, not scientific name.

        Args:
            plant_common_name: Common name of the plant/food

        Returns:
            Dict with compound names and available metadata
        """
        result = self.search_food(plant_common_name)

        if not result:
            return {"found": False, "compounds": []}

        compounds = []
        for comp in result.compounds[:20]:  # Top 20 compounds
            compounds.append({
                "name": comp.name,
                "formula": comp.formula,
                "compound_class": comp.compound_class,
                "food_sources": comp.food_sources,
                "metabolites": comp.metabolites,
                "pubchem_id": comp.pubchem_id,
                "source": "phytohub"
            })

        return {
            "found": True,
            "food_name": result.food_name,
            "compounds": compounds,
            "compound_count": result.compound_count,
            "source": "PhytoHub"
        }

    def _compound_to_dict(self, compound: PhytoHubCompound) -> Dict[str, Any]:
        """Convert PhytoHubCompound to dictionary"""
        return {
            "name": compound.name,
            "phytohub_id": compound.phytohub_id,
            "formula": compound.formula,
            "monoisotopic_mass": compound.monoisotopic_mass,
            "compound_class": compound.compound_class,
            "food_sources": compound.food_sources,
            "metabolites": compound.metabolites,
            "pubchem_id": compound.pubchem_id,
            "chebi_id": compound.chebi_id
        }

    def _food_result_to_dict(self, result: PhytoHubFoodResult) -> Dict[str, Any]:
        """Convert PhytoHubFoodResult to dictionary"""
        return {
            "food_name": result.food_name,
            "phytohub_id": result.phytohub_id,
            "compounds": [self._compound_to_dict(c) for c in result.compounds],
            "compound_count": result.compound_count
        }

    def _dict_to_food_result(self, data: Dict[str, Any]) -> PhytoHubFoodResult:
        """Convert dictionary to PhytoHubFoodResult"""
        return PhytoHubFoodResult(
            food_name=data["food_name"],
            phytohub_id=data.get("phytohub_id"),
            compounds=[PhytoHubCompound(**c) for c in data.get("compounds", [])],
            compound_count=data.get("compound_count", 0)
        )


# Singleton instance
phytohub_client = PhytoHubClient()
