import { useMutation } from '@tanstack/react-query';
import { analysisAPI } from '../api/endpoints';
import type { IngredientInput, BodyImpactReport } from '../api/types';

export const useAnalysisSync = () => {
  return useMutation<BodyImpactReport, Error, IngredientInput>({
    mutationFn: analysisAPI.analyzeSync,
    onSuccess: (data) => {
      // Save to local storage history (optional)
      const history = JSON.parse(localStorage.getItem('biopath_history') || '[]');
      history.unshift({
        ingredient_name: data.ingredient_name,
        timestamp: data.analysis_timestamp,
        pathways_count: data.pathways.length,
        targets_count: data.known_targets.length,
      });
      // Keep only last 10
      localStorage.setItem('biopath_history', JSON.stringify(history.slice(0, 10)));
    },
  });
};
