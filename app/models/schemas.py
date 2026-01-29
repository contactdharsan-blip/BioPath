"""Pydantic schemas for BioPath data models"""

from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class ConfidenceTier(str, Enum):
    """Confidence tier for evidence quality"""
    TIER_A = "A"  # Measured target evidence from bioassays
    TIER_B = "B"  # Inferred pathway impact from known target role
    TIER_C = "C"  # Predicted via docking/ML


class IngredientInput(BaseModel):
    """Input request for ingredient analysis"""
    ingredient_name: str = Field(..., description="Active ingredient name", min_length=1)
    enable_predictions: bool = Field(default=False, description="Enable ML/docking predictions")


class CompoundIdentity(BaseModel):
    """Canonical chemical structure identifiers"""
    ingredient_name: str
    pubchem_cid: Optional[int] = None
    canonical_smiles: Optional[str] = None
    inchikey: Optional[str] = None
    molecular_formula: Optional[str] = None
    molecular_weight: Optional[float] = None
    iupac_name: Optional[str] = None
    synonyms: List[str] = Field(default_factory=list)
    resolution_timestamp: datetime = Field(default_factory=datetime.utcnow)


class AssayReference(BaseModel):
    """Reference to a bioassay measurement"""
    assay_id: str
    assay_description: Optional[str] = None
    source: str  # "ChEMBL", "BindingDB", etc.
    source_url: Optional[str] = None


class TargetEvidence(BaseModel):
    """Evidence for a protein target interaction"""
    target_id: str  # UniProt ID or ChEMBL target ID
    target_name: str
    target_type: Optional[str] = None  # "SINGLE PROTEIN", "PROTEIN COMPLEX", etc.
    organism: str = "Homo sapiens"

    # Potency data
    pchembl_value: Optional[float] = None  # Standardized -log(IC50/Ki/etc)
    standard_type: Optional[str] = None  # "IC50", "Ki", "Kd", "EC50"
    standard_value: Optional[float] = None  # Original value
    standard_units: Optional[str] = None  # "nM", "uM", etc.

    # References
    assay_references: List[AssayReference] = Field(default_factory=list)

    # Confidence
    confidence_tier: ConfidenceTier = ConfidenceTier.TIER_A
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.8)

    # Metadata
    is_predicted: bool = False
    source: str = "ChEMBL"


class PredictedInteraction(BaseModel):
    """Predicted target interaction (docking/ML)"""
    target_id: str
    target_name: str
    prediction_score: float = Field(ge=0.0, le=1.0)
    prediction_method: str  # "AutoDock Vina", "GNINA", "ML-model-v1"
    binding_affinity: Optional[float] = None  # kcal/mol for docking
    confidence_tier: ConfidenceTier = ConfidenceTier.TIER_C
    is_predicted: bool = True
    prediction_timestamp: datetime = Field(default_factory=datetime.utcnow)


class PathwayMatch(BaseModel):
    """Pathway affected by target interactions"""
    pathway_id: str  # Reactome stable identifier
    pathway_name: str
    pathway_species: str = "Homo sapiens"

    # Matched targets in this pathway
    matched_targets: List[str] = Field(default_factory=list)  # target_ids
    measured_targets_count: int = 0
    predicted_targets_count: int = 0

    # Scoring
    impact_score: float = Field(ge=0.0, le=1.0, description="Pathway impact score")
    confidence_tier: ConfidenceTier
    confidence_score: float = Field(ge=0.0, le=1.0)

    # Explanation
    explanation: str = Field(
        description="Natural language explanation of pathway impact"
    )

    # References
    pathway_url: Optional[str] = None
    related_pathways: List[str] = Field(default_factory=list)


class ProvenanceRecord(BaseModel):
    """Provenance tracking for API calls"""
    service: str  # "PubChem", "ChEMBL", "Reactome"
    endpoint: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_ms: Optional[float] = None
    status: str = "success"  # "success", "error", "cached"
    cache_hit: bool = False
    response_size: Optional[int] = None
    error_message: Optional[str] = None


class BodyImpactReport(BaseModel):
    """Final comprehensive analysis report"""

    # Input
    ingredient_name: str
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Structure identification
    compound_identity: CompoundIdentity

    # Target evidence
    known_targets: List[TargetEvidence] = Field(
        default_factory=list,
        description="Measured targets from bioassays (Tier A)"
    )
    predicted_targets: List[PredictedInteraction] = Field(
        default_factory=list,
        description="Predicted targets from docking/ML (Tier C)"
    )

    # Pathway analysis
    pathways: List[PathwayMatch] = Field(
        default_factory=list,
        description="Affected biological pathways with impact scores"
    )

    # Summary
    final_summary: Dict[str, Any] = Field(
        default_factory=dict,
        description="Top affected systems and mechanism-level insights"
    )

    # Provenance
    provenance: List[ProvenanceRecord] = Field(
        default_factory=list,
        description="Full API call history with timestamps"
    )

    # Metadata
    analysis_version: str = "1.0.0"
    predictions_enabled: bool = False
    total_analysis_duration_seconds: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "ingredient_name": "ibuprofen",
                "compound_identity": {
                    "pubchem_cid": 3672,
                    "canonical_smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
                    "inchikey": "HEFNNWSXXWATRW-UHFFFAOYSA-N"
                },
                "known_targets": [
                    {
                        "target_name": "Cyclooxygenase-2",
                        "pchembl_value": 6.5,
                        "confidence_tier": "A"
                    }
                ],
                "pathways": [
                    {
                        "pathway_name": "Arachidonic acid metabolism",
                        "impact_score": 0.85,
                        "confidence_tier": "B"
                    }
                ]
            }
        }


class AnalysisJob(BaseModel):
    """Analysis job status"""
    job_id: str
    status: str  # "pending", "processing", "completed", "failed"
    ingredient_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    result: Optional[BodyImpactReport] = None
    error: Optional[str] = None
