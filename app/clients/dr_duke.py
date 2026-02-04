"""Dr. Duke's Phytochemical and Ethnobotanical Database client

USDA database containing plant-chemical-activity relationships.
Source: https://phytochem.nal.usda.gov/
"""

import httpx
import re
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from app.services.cache import cache_service

logger = logging.getLogger(__name__)


@dataclass
class DrDukeChemical:
    """Chemical entry from Dr. Duke's database"""
    name: str
    cas_number: Optional[str] = None
    activities: List[str] = None
    plant_parts: List[str] = None
    concentration_low: Optional[float] = None
    concentration_high: Optional[float] = None

    def __post_init__(self):
        if self.activities is None:
            self.activities = []
        if self.plant_parts is None:
            self.plant_parts = []


@dataclass
class DrDukePlantResult:
    """Plant search result from Dr. Duke's database"""
    scientific_name: str
    common_names: List[str]
    chemicals: List[DrDukeChemical]
    activities: List[str]

    def __post_init__(self):
        if self.common_names is None:
            self.common_names = []
        if self.chemicals is None:
            self.chemicals = []
        if self.activities is None:
            self.activities = []


class DrDukeClient:
    """
    Client for Dr. Duke's Phytochemical and Ethnobotanical Databases.

    This USDA database contains comprehensive plant-chemical relationships
    with biological activity data. Free public access, no API key required.
    """

    def __init__(self):
        self.base_url = "https://phytochem.nal.usda.gov"
        self.timeout = 30.0
        self.cache_ttl = 86400 * 7  # Cache for 7 days (static data)

    def _get_cached(self, cache_key: str) -> Optional[Any]:
        """Get cached result"""
        return cache_service.get("dr_duke", cache_key)

    def _set_cached(self, cache_key: str, value: Any) -> None:
        """Cache a result"""
        cache_service.set("dr_duke", cache_key, value, ttl=self.cache_ttl)

    def search_plant(self, plant_name: str) -> Optional[DrDukePlantResult]:
        """
        Search for a plant by scientific or common name.

        Args:
            plant_name: Plant name to search for

        Returns:
            DrDukePlantResult with chemicals and activities, or None if not found
        """
        cache_key = f"plant_{plant_name.lower().replace(' ', '_')}"
        cached = self._get_cached(cache_key)
        if cached:
            logger.info(f"Dr. Duke's cache hit for plant: {plant_name}")
            return DrDukePlantResult(**cached) if isinstance(cached, dict) else cached

        try:
            # Search for the plant
            search_url = f"{self.base_url}/phytochem/search/list"

            with httpx.Client(timeout=self.timeout) as client:
                # First, search for the plant
                response = client.get(
                    search_url,
                    params={
                        "search_api_fulltext": plant_name,
                        "type": "plant"
                    }
                )
                response.raise_for_status()
                html = response.text

                # Parse plant results from HTML
                result = self._parse_plant_search(html, plant_name)

                if result:
                    # Get detailed chemicals for this plant
                    chemicals = self._get_plant_chemicals(client, plant_name)
                    result.chemicals = chemicals

                    # Cache the result
                    self._set_cached(cache_key, {
                        "scientific_name": result.scientific_name,
                        "common_names": result.common_names,
                        "chemicals": [
                            {
                                "name": c.name,
                                "cas_number": c.cas_number,
                                "activities": c.activities,
                                "plant_parts": c.plant_parts,
                                "concentration_low": c.concentration_low,
                                "concentration_high": c.concentration_high
                            }
                            for c in result.chemicals
                        ],
                        "activities": result.activities
                    })

                    logger.info(f"Dr. Duke's found {len(chemicals)} chemicals for {plant_name}")
                    return result

                logger.info(f"Dr. Duke's: plant not found - {plant_name}")
                return None

        except httpx.HTTPStatusError as e:
            logger.error(f"Dr. Duke's API error: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Dr. Duke's error searching {plant_name}: {e}")
            return None

    def _parse_plant_search(self, html: str, search_term: str) -> Optional[DrDukePlantResult]:
        """Parse plant search results from HTML"""
        # Look for plant entries in the search results
        # Pattern: link to plant page with scientific name
        plant_pattern = r'<a[^>]*href="[^"]*plant/([^"]+)"[^>]*>([^<]+)</a>'
        matches = re.findall(plant_pattern, html, re.IGNORECASE)

        if not matches:
            return None

        # Find best match for search term
        search_lower = search_term.lower()
        for plant_id, name in matches:
            if search_lower in name.lower():
                return DrDukePlantResult(
                    scientific_name=name.strip(),
                    common_names=[],
                    chemicals=[],
                    activities=[]
                )

        # Return first match if no exact match
        if matches:
            return DrDukePlantResult(
                scientific_name=matches[0][1].strip(),
                common_names=[],
                chemicals=[],
                activities=[]
            )

        return None

    def _get_plant_chemicals(self, client: httpx.Client, plant_name: str) -> List[DrDukeChemical]:
        """Get chemicals for a specific plant"""
        chemicals = []

        try:
            # Query for chemicals in this plant
            response = client.get(
                f"{self.base_url}/phytochem/search/list",
                params={
                    "search_api_fulltext": plant_name,
                    "type": "chemical"
                }
            )
            response.raise_for_status()
            html = response.text

            # Parse chemical names from results
            chemical_pattern = r'<a[^>]*href="[^"]*chemical/([^"]+)"[^>]*>([^<]+)</a>'
            matches = re.findall(chemical_pattern, html, re.IGNORECASE)

            seen_names = set()
            for chem_id, name in matches[:50]:  # Limit to 50 chemicals
                name = name.strip()
                if name.lower() not in seen_names:
                    seen_names.add(name.lower())
                    chemicals.append(DrDukeChemical(
                        name=name,
                        activities=[]
                    ))

        except Exception as e:
            logger.error(f"Error getting chemicals for {plant_name}: {e}")

        return chemicals

    def get_chemical_activities(self, chemical_name: str) -> List[str]:
        """
        Get biological activities for a chemical.

        Args:
            chemical_name: Name of the chemical

        Returns:
            List of biological activity names
        """
        cache_key = f"activities_{chemical_name.lower().replace(' ', '_')}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        activities = []

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(
                    f"{self.base_url}/phytochem/search/list",
                    params={
                        "search_api_fulltext": chemical_name,
                        "type": "activity"
                    }
                )
                response.raise_for_status()
                html = response.text

                # Parse activity names
                activity_pattern = r'<a[^>]*href="[^"]*activity/([^"]+)"[^>]*>([^<]+)</a>'
                matches = re.findall(activity_pattern, html, re.IGNORECASE)

                activities = list(set(m[1].strip() for m in matches))[:30]

                self._set_cached(cache_key, activities)

        except Exception as e:
            logger.error(f"Error getting activities for {chemical_name}: {e}")

        return activities

    def search_chemicals_by_activity(self, activity: str) -> List[DrDukeChemical]:
        """
        Find chemicals that have a specific biological activity.

        Args:
            activity: Biological activity (e.g., "Anti-inflammatory", "Sedative")

        Returns:
            List of chemicals with that activity
        """
        cache_key = f"by_activity_{activity.lower().replace(' ', '_')}"
        cached = self._get_cached(cache_key)
        if cached:
            return [DrDukeChemical(**c) for c in cached]

        chemicals = []

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(
                    f"{self.base_url}/phytochem/search/list",
                    params={
                        "search_api_fulltext": activity,
                        "type": "chemical"
                    }
                )
                response.raise_for_status()
                html = response.text

                # Parse chemical results
                chemical_pattern = r'<a[^>]*href="[^"]*chemical/([^"]+)"[^>]*>([^<]+)</a>'
                matches = re.findall(chemical_pattern, html, re.IGNORECASE)

                seen_names = set()
                for chem_id, name in matches[:30]:
                    name = name.strip()
                    if name.lower() not in seen_names:
                        seen_names.add(name.lower())
                        chemicals.append(DrDukeChemical(
                            name=name,
                            activities=[activity]
                        ))

                # Cache results
                self._set_cached(cache_key, [
                    {"name": c.name, "activities": c.activities, "plant_parts": c.plant_parts}
                    for c in chemicals
                ])

        except Exception as e:
            logger.error(f"Error searching by activity {activity}: {e}")

        return chemicals

    def get_plant_compounds_for_species(
        self,
        scientific_name: str
    ) -> Dict[str, Any]:
        """
        Get compound data formatted for integration with plant_compounds.py

        Args:
            scientific_name: Plant scientific name

        Returns:
            Dict with compound names and any available metadata
        """
        result = self.search_plant(scientific_name)

        if not result:
            return {"found": False, "compounds": []}

        compounds = []
        for chem in result.chemicals[:20]:  # Top 20 compounds
            # Get activities for this chemical
            activities = self.get_chemical_activities(chem.name)

            compounds.append({
                "name": chem.name,
                "cas_number": chem.cas_number,
                "activities": activities,
                "source": "dr_duke"
            })

        return {
            "found": True,
            "scientific_name": result.scientific_name,
            "compounds": compounds,
            "source": "Dr. Duke's Phytochemical Database"
        }


# Singleton instance
dr_duke_client = DrDukeClient()
