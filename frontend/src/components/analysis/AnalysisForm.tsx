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
    <Card className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-1.5">
            Analyze Compound
          </h2>
          <p className="text-sm text-slate-400">
            Enter a compound to analyze its biological pathways and targets.
          </p>
        </div>

        <div>
          <label htmlFor="ingredient" className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Ingredient Name
          </label>
          <AutocompleteInput
            value={ingredientName}
            onChange={setIngredientName}
            onSelect={handleSelectCompound}
            placeholder="e.g., ibuprofen, aspirin, caffeine..."
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Powered by PubChem. Type at least 2 characters.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={!ingredientName.trim() || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
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
