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
