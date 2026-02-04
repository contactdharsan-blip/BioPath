// TypeScript interfaces matching backend schemas

export type ConfidenceTier = 'A' | 'B' | 'C';

export interface IngredientInput {
  ingredient_name: string;
  enable_predictions?: boolean;
}

export interface CompoundIdentity {
  ingredient_name: string;
  pubchem_cid?: number;
  canonical_smiles?: string;
  inchikey?: string;
  molecular_formula?: string;
  molecular_weight?: number;
  iupac_name?: string;
  synonyms: string[];
  resolution_timestamp: string;
}

export interface AssayReference {
  assay_id: string;
  assay_description?: string;
  source: string;
  source_url?: string;
}

export interface TargetEvidence {
  target_id: string;
  target_name: string;
  target_type?: string;
  organism: string;
  pchembl_value?: number;
  standard_type?: string;
  standard_value?: number;
  standard_units?: string;
  assay_references: AssayReference[];
  confidence_tier: ConfidenceTier;
  confidence_score: number;
  is_predicted: boolean;
  source: string;
}

export interface PredictedInteraction {
  target_id: string;
  target_name: string;
  prediction_score: number;
  prediction_method: string;
  binding_affinity?: number;
  confidence_tier: ConfidenceTier;
  is_predicted: boolean;
  prediction_timestamp: string;
}

export interface PathwayMatch {
  pathway_id: string;
  pathway_name: string;
  pathway_species: string;
  matched_targets: string[];
  measured_targets_count: number;
  predicted_targets_count: number;
  impact_score: number;
  confidence_tier: ConfidenceTier;
  confidence_score: number;
  explanation: string;
  pathway_url?: string;
  related_pathways: string[];
}

export interface ProvenanceRecord {
  service: string;
  endpoint: string;
  timestamp: string;
  duration_ms?: number;
  status: string;
  cache_hit: boolean;
  response_size?: number;
  error_message?: string;
}

export interface TopPathwaySummary {
  name: string;
  impact_score: number;
  confidence_tier: ConfidenceTier;
  explanation: string;
}

export interface StrongestTarget {
  name: string;
  pchembl: number;
  potency_type: string;
}

export interface FinalSummary {
  total_targets_measured: number;
  total_targets_predicted: number;
  total_pathways_affected: number;
  top_pathways: TopPathwaySummary[];
  strongest_target?: StrongestTarget;
  mechanism_flags: string[];
  disclaimer: string;
}

export interface BodyImpactReport {
  ingredient_name: string;
  analysis_timestamp: string;
  compound_identity: CompoundIdentity;
  known_targets: TargetEvidence[];
  predicted_targets: PredictedInteraction[];
  pathways: PathwayMatch[];
  final_summary: FinalSummary;
  provenance: ProvenanceRecord[];
  analysis_version: string;
  predictions_enabled: boolean;
  total_analysis_duration_seconds?: number;
}

export interface AnalyzeResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface AnalysisJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ingredient_name: string;
  created_at: string;
  completed_at?: string;
  result?: BodyImpactReport;
  error?: string;
}

// PubChem API types
export interface PubChemSuggestion {
  name: string;
  cid?: number;
}

export interface PubChemAutocompleteResponse {
  total: number;
  dictionary_terms: {
    compound: string[];
  };
}

// Plant Identification types
export interface PlantCompound {
  name: string;
  chembl_id?: string;
  // Confidence-based scoring fields
  research_level?: number;        // 0-1: How well-studied (1 = extensive clinical trials)
  drug_interaction_risk?: number; // 0-1: Interaction potential (1 = high risk like St. John's Wort)
  bioactivity_strength?: number;  // 0-1: Biological effect potency
  lifestyle_categories?: string[]; // e.g., ["sleep", "mood", "energy", "pain"]
  priority_score?: number;        // Calculated priority for analysis order
}

export interface PlantIdentificationRequest {
  image_base64: string;
  organs?: string[];
}

export interface PlantAnalysisRequest {
  image_base64: string;
  organs?: string[];
  max_compounds?: number;
  enable_predictions?: boolean;
}

export interface PlantIdentificationResponse {
  success: boolean;
  scientific_name?: string;
  common_names?: string[];
  family?: string;
  confidence?: number;
  in_database?: boolean;
  compounds?: PlantCompound[];
  traditional_uses?: string[];
  parts_used?: string[];
  error?: string;
}

export interface CompoundAnalysis {
  compound_name: string;
  targets_found: number;
  pathways_found: number;
  top_pathways: {
    name: string;
    impact_score: number;
    url: string;
  }[];
}

export interface AggregatePathway {
  pathway_id: string;
  pathway_name: string;
  pathway_url: string;
  aggregate_score: number;
  max_impact: number;
  num_compounds: number;
  compounds: string[];
  confidence_tier: string;
}

export interface HighInteractionCompound {
  name: string;
  risk_level: number;
  categories: string[];
}

export interface PlantAnalysisSummary {
  plant_identified: string;
  common_names: string[];
  family: string;
  identification_confidence: number;
  compounds_analyzed: number;
  compound_names: string[];
  compound_details?: PlantCompound[];  // Full details with priority scores
  average_research_confidence?: number; // Average research level across compounds
  total_targets_found: number;
  total_pathways_affected: number;
  lifestyle_categories_affected?: string[]; // All lifestyle areas this plant affects
  traditional_uses: string[];
  top_pathways: {
    name: string;
    score: number;
    compounds_involved: string[];
  }[];
  high_interaction_compounds?: HighInteractionCompound[]; // Compounds with drug interaction risks
  drug_interaction_warning?: string; // Warning message if high-risk compounds present
  disclaimer: string;
  warning?: string;
  error?: string;
}

export interface PlantAnalysisResponse {
  identification: {
    success: boolean;
    scientific_name?: string;
    common_names?: string[];
    family?: string;
    confidence?: number;
    error?: string;
  };
  compounds_found: PlantCompound[];
  compound_analyses: CompoundAnalysis[];
  aggregate_pathways: AggregatePathway[];
  summary: PlantAnalysisSummary;
}
