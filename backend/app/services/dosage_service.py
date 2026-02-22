"""Dosage data aggregation service

Aggregates dosage-relevant data from PubChem toxicity, ChEMBL potency,
and Dr. Duke plant tissue concentrations.
"""

import logging
from typing import List, Optional, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.clients.pubchem import PubChemClient
from app.clients.chembl import ChEMBLClient
from app.clients.dr_duke import dr_duke_client
from app.models.schemas import (
    DosageDataPoint,
    PotencyData,
    PlantConcentration,
    SafetyProfile,
    DosageResponse,
)

logger = logging.getLogger(__name__)


class DosageService:
    """Service for aggregating dosage data from multiple sources."""

    def __init__(self):
        self.pubchem = PubChemClient()
        self.chembl = ChEMBLClient()
        self.dr_duke = dr_duke_client

    def get_dosage_data(
        self,
        compound_name: str,
        pubchem_cid: Optional[int],
        inchikey: Optional[str],
        smiles: Optional[str],
        target_names: List[str],
    ) -> DosageResponse:
        """
        Aggregate dosage data from PubChem, ChEMBL, and Dr. Duke.
        """
        dosage_data: List[DosageDataPoint] = []
        potency_data: List[PotencyData] = []
        plant_concentrations: List[PlantConcentration] = []
        sources_queried: List[str] = []
        safety_profile = SafetyProfile()

        # Query sources in parallel
        futures = {}
        with ThreadPoolExecutor(max_workers=3) as executor:
            if pubchem_cid:
                futures["pubchem"] = executor.submit(
                    self._fetch_pubchem, pubchem_cid
                )
            if inchikey:
                futures["chembl"] = executor.submit(
                    self._fetch_chembl, inchikey, smiles
                )
            futures["dr_duke"] = executor.submit(
                self._fetch_dr_duke, compound_name
            )

            for source, future in futures.items():
                try:
                    result = future.result(timeout=30)
                    sources_queried.append(source)

                    if source == "pubchem":
                        pubchem_dosage, pubchem_safety = result
                        dosage_data.extend(pubchem_dosage)
                        # Merge safety profile
                        if pubchem_safety.get("ld50"):
                            safety_profile.ld50 = pubchem_safety["ld50"]
                        if pubchem_safety.get("therapeutic_range"):
                            safety_profile.therapeutic_range = pubchem_safety["therapeutic_range"]
                        safety_profile.warnings.extend(pubchem_safety.get("warnings", []))

                    elif source == "chembl":
                        potency_data.extend(result)

                    elif source == "dr_duke":
                        plant_concentrations.extend(result)

                except Exception as e:
                    logger.warning(f"Dosage source {source} failed: {e}")

        # Compute therapeutic index if possible
        if safety_profile.ld50 and potency_data:
            best_potency = potency_data[0]  # Already sorted by pchembl desc
            ld50_val = safety_profile.ld50.value
            ed50_nm = best_potency.effective_concentration_nm
            if ld50_val and ed50_nm and ed50_nm > 0:
                # Convert LD50 mg/kg to rough nM (very approximate)
                # This is noted as approximate in the data_quality_note
                safety_profile.therapeutic_index = round(ld50_val * 1000 / (ed50_nm / 1000), 1)
                if safety_profile.therapeutic_index < 10:
                    safety_profile.safety_classification = "narrow_therapeutic_index"
                    safety_profile.warnings.append(
                        "This compound may have a narrow therapeutic index. Use with caution."
                    )
                else:
                    safety_profile.safety_classification = "wide"

        # Generate data quality note
        data_quality_note = self._generate_quality_note(
            sources_queried, dosage_data, potency_data, plant_concentrations, safety_profile
        )

        return DosageResponse(
            compound_name=compound_name,
            dosage_data=dosage_data,
            potency_data=potency_data,
            plant_concentrations=plant_concentrations,
            safety_profile=safety_profile,
            sources_queried=sources_queried,
            data_quality_note=data_quality_note,
        )

    def _fetch_pubchem(self, cid: int) -> tuple:
        """Fetch toxicity data from PubChem."""
        raw = self.pubchem.get_toxicity_data(cid)
        dosage_points = []
        safety = {"warnings": []}

        # Process LD50 values
        for ld50 in raw.get("ld50_values", []):
            point = DosageDataPoint(
                value=ld50["value"],
                unit=ld50["unit"],
                route=ld50.get("route"),
                context="lethal",
                description=f"LD50 ({ld50.get('route', 'unknown')} in {ld50.get('species', 'unknown')}): {ld50['value']} {ld50['unit']}",
                source="PubChem",
                source_url=f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}#section=Toxicity",
                confidence="high" if ld50.get("species") in ("rat", "mouse") else "moderate",
                species=ld50.get("species"),
            )
            dosage_points.append(point)

            # Use first oral LD50 for safety profile
            if not safety.get("ld50") and ld50.get("route", "").lower() in ("oral", ""):
                safety["ld50"] = point

        # Process therapeutic doses
        for dose in raw.get("therapeutic_doses", []):
            val_low = dose.get("value_low")
            val_high = dose.get("value_high")
            description = f"Therapeutic dose: {val_low}"
            if val_high:
                description += f" - {val_high}"
            description += f" {dose.get('unit', 'mg')}"

            point = DosageDataPoint(
                value=val_low,
                value_high=val_high,
                unit=dose.get("unit", "mg"),
                route="oral",
                context="therapeutic",
                description=description,
                source="PubChem",
                source_url=f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}#section=Drug-and-Medication-Information",
                confidence="high",
                species="human",
            )
            dosage_points.append(point)

            if not safety.get("therapeutic_range"):
                safety["therapeutic_range"] = point

        # Toxicity notes as warnings
        for note in raw.get("toxicity_notes", [])[:3]:
            safety["warnings"].append(note)

        return dosage_points, safety

    def _fetch_chembl(self, inchikey: str, smiles: Optional[str]) -> List[PotencyData]:
        """Fetch potency data from ChEMBL."""
        raw = self.chembl.get_potency_summary(inchikey, smiles)

        return [
            PotencyData(
                target_name=item["target_name"],
                pchembl_value=item["pchembl_value"],
                standard_type=item["standard_type"],
                standard_value=item["standard_value"],
                standard_units=item["standard_units"],
                effective_concentration_nm=item["effective_concentration_nm"],
                potency_category=item["potency_category"],
            )
            for item in raw
        ]

    def _fetch_dr_duke(self, compound_name: str) -> List[PlantConcentration]:
        """Fetch plant tissue concentrations from Dr. Duke."""
        raw = self.dr_duke.get_compound_concentrations(compound_name)

        return [
            PlantConcentration(
                plant_part=item.get("plant_part"),
                concentration_low=item.get("concentration_low"),
                concentration_high=item.get("concentration_high"),
                unit=item.get("unit", "ppm"),
            )
            for item in raw
        ]

    def _generate_quality_note(
        self,
        sources: List[str],
        dosage_data: List[DosageDataPoint],
        potency_data: List[PotencyData],
        plant_conc: List[PlantConcentration],
        safety: SafetyProfile,
    ) -> str:
        """Generate a data quality note describing what was found."""
        parts = []

        total_points = len(dosage_data) + len(potency_data) + len(plant_conc)
        if total_points == 0:
            return "No dosage data found from any source. This compound may not have publicly available dosage information."

        parts.append(f"Data from {len(sources)} source(s).")

        if safety.ld50:
            parts.append(f"LD50 data available ({safety.ld50.species or 'animal'} studies).")
        else:
            parts.append("No LD50 data found.")

        has_human_dose = any(d.species == "human" and d.context == "therapeutic" for d in dosage_data)
        if has_human_dose:
            parts.append("Human therapeutic dose data available.")
        else:
            parts.append("No human therapeutic dose data available.")

        if potency_data:
            parts.append(f"{len(potency_data)} target potency measurement(s) from ChEMBL.")

        if plant_conc:
            parts.append(f"{len(plant_conc)} plant tissue concentration(s) from Dr. Duke.")

        return " ".join(parts)


# Singleton instance
dosage_service = DosageService()
