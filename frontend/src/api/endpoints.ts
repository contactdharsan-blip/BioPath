import { apiClient } from './client';
import type {
  IngredientInput,
  BodyImpactReport,
  AnalysisJob,
  AnalyzeResponse,
} from './types';

export const analysisAPI = {
  // Synchronous analysis (default for MVP)
  analyzeSync: async (input: IngredientInput): Promise<BodyImpactReport> => {
    const { data } = await apiClient.post('/analyze_sync', input);
    return data;
  },

  // Asynchronous analysis
  analyzeAsync: async (input: IngredientInput): Promise<AnalyzeResponse> => {
    const { data } = await apiClient.post('/analyze', input);
    return data;
  },

  // Poll for results
  getResults: async (jobId: string): Promise<AnalysisJob> => {
    const { data } = await apiClient.get(`/results/${jobId}`);
    return data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; version: string; service: string }> => {
    const { data} = await apiClient.get('/health');
    return data;
  },
};

export type Medication = {
  id: string;
  name: string;
  addedAt: string;
};

// Reactome pathway data types
export interface ReactomePathwayDetails {
  pathway_id: string;
  pathway_name: string;
  pathway_species: string;
  summation: string | null;
  doi: string | null;
  url: string;
}

export interface ReactomeFullPathway extends ReactomePathwayDetails {
  participant_count: number;
  participants: string[];
  has_more_participants: boolean;
  total_participants: number;
  related_pathway_count: number;
  related_pathways: string[];
}

// Reactome API endpoints
export const reactomeAPI = {
  // Get pathway details
  getPathwayDetails: async (pathwayId: string): Promise<ReactomePathwayDetails> => {
    const { data } = await apiClient.get(`/api/reactome/pathway/${pathwayId}`);
    return data;
  },

  // Get pathway participants (proteins)
  getPathwayParticipants: async (pathwayId: string): Promise<{
    pathway_id: string;
    participant_count: number;
    participants: string[];
  }> => {
    const { data } = await apiClient.get(`/api/reactome/pathway/${pathwayId}/participants`);
    return data;
  },

  // Get related pathways
  getRelatedPathways: async (pathwayId: string): Promise<{
    pathway_id: string;
    related_count: number;
    related_pathways: string[];
  }> => {
    const { data } = await apiClient.get(`/api/reactome/pathway/${pathwayId}/related`);
    return data;
  },

  // Get full pathway information (combined)
  getFullPathwayInfo: async (pathwayId: string): Promise<ReactomeFullPathway> => {
    const { data } = await apiClient.get(`/api/reactome/pathway/${pathwayId}/full`);
    return data;
  },
};
