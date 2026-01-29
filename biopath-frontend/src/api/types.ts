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
