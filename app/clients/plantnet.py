"""PlantNet API client for plant identification from images"""

import httpx
import base64
from typing import Optional, List, Dict, Any
from pathlib import Path
import logging

from app.config import settings
from app.services.cache import cache_service

logger = logging.getLogger(__name__)


class PlantNetClient:
    """
    Client for PlantNet plant identification API.

    PlantNet uses deep learning (CNN) to identify plant species from images.
    Free tier: 500 requests/day with API key registration.
    """

    def __init__(self):
        self.base_url = "https://my-api.plantnet.org/v2/identify"
        self.api_key = settings.plantnet_api_key
        self.timeout = 30.0

    def identify_plant(
        self,
        image_data: bytes,
        organs: List[str] = None,
        lang: str = "en"
    ) -> Dict[str, Any]:
        """
        Identify a plant from an image.

        Args:
            image_data: Raw image bytes (JPEG, PNG)
            organs: Plant organs visible in image (leaf, flower, fruit, bark)
            lang: Language for common names

        Returns:
            Dict with species identification results
        """
        if not self.api_key:
            logger.warning("PlantNet API key not configured")
            return {"error": "PlantNet API key not configured", "results": []}

        if organs is None:
            organs = ["auto"]  # Let PlantNet auto-detect

        try:
            # PlantNet API endpoint
            url = f"{self.base_url}/all"

            params = {
                "api-key": self.api_key,
                "lang": lang,
                "include-related-images": "false"
            }

            # Add organs parameter
            for organ in organs:
                params.setdefault("organs", []).append(organ) if isinstance(params.get("organs"), list) else None

            files = {
                "images": ("plant.jpg", image_data, "image/jpeg")
            }

            # Also send organs as form data
            data = {
                "organs": organs
            }

            logger.info(f"Identifying plant with PlantNet (organs: {organs})")

            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    url,
                    params={"api-key": self.api_key, "lang": lang},
                    files=files,
                    data=data
                )
                response.raise_for_status()
                result = response.json()

            # Parse results
            species_results = []
            for r in result.get("results", [])[:5]:  # Top 5 results
                species = r.get("species", {})
                species_results.append({
                    "score": r.get("score", 0),
                    "scientific_name": species.get("scientificNameWithoutAuthor", ""),
                    "scientific_name_full": species.get("scientificName", ""),
                    "genus": species.get("genus", {}).get("scientificName", ""),
                    "family": species.get("family", {}).get("scientificName", ""),
                    "common_names": species.get("commonNames", [])
                })

            best_match = species_results[0] if species_results else None

            logger.info(
                f"PlantNet identified: {best_match['scientific_name'] if best_match else 'Unknown'} "
                f"(score: {best_match['score']:.2f if best_match else 0})"
            )

            return {
                "success": True,
                "best_match": best_match,
                "results": species_results,
                "query": {
                    "organs": organs,
                    "language": lang
                }
            }

        except httpx.HTTPStatusError as e:
            logger.error(f"PlantNet API error: {e.response.status_code} - {e.response.text}")
            return {
                "success": False,
                "error": f"PlantNet API error: {e.response.status_code}",
                "results": []
            }
        except Exception as e:
            logger.error(f"Error identifying plant: {e}")
            return {
                "success": False,
                "error": str(e),
                "results": []
            }

    def identify_from_file(self, file_path: str, organs: List[str] = None) -> Dict[str, Any]:
        """
        Identify a plant from a file path.

        Args:
            file_path: Path to image file
            organs: Plant organs visible in image

        Returns:
            Species identification results
        """
        path = Path(file_path)
        if not path.exists():
            return {"error": f"File not found: {file_path}", "results": []}

        with open(path, "rb") as f:
            image_data = f.read()

        return self.identify_plant(image_data, organs)

    def identify_from_base64(self, base64_data: str, organs: List[str] = None) -> Dict[str, Any]:
        """
        Identify a plant from base64-encoded image data.

        Args:
            base64_data: Base64-encoded image string
            organs: Plant organs visible in image

        Returns:
            Species identification results
        """
        try:
            # Remove data URL prefix if present
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]

            image_data = base64.b64decode(base64_data)
            return self.identify_plant(image_data, organs)
        except Exception as e:
            logger.error(f"Error decoding base64 image: {e}")
            return {"error": f"Invalid base64 image data: {e}", "results": []}
