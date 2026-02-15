import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { AutocompleteInput } from '../common/AutocompleteInput';
import type { IngredientInput } from '../../api/types';

interface AnalysisFormProps {
  onSubmit: (input: IngredientInput) => void;
  isLoading?: boolean;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ onSubmit, isLoading = false }) => {
  const [ingredientName, setIngredientName] = useState('');
  const enablePredictions = true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ingredientName.trim()) {
      return;
    }

    onSubmit({
      ingredient_name: ingredientName.trim(),
      enable_predictions: enablePredictions,
    });
  };

  const handleSelectCompound = (name: string) => {
    setIngredientName(name);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Analyze Active Ingredient
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a compound or active ingredient name to analyze its biological pathways and targets.
          </p>
        </div>

        <div>
          <label htmlFor="ingredient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ingredient Name <span className="text-red-500">*</span>
          </label>
          <AutocompleteInput
            value={ingredientName}
            onChange={setIngredientName}
            onSelect={handleSelectCompound}
            placeholder="Start typing (e.g., ibuprofen, aspirin)..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Suggestions are powered by PubChem. Type at least 2 characters.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={!ingredientName.trim() || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Compound'}
          </Button>
          {ingredientName && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setIngredientName('')}
            >
              Clear
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};
