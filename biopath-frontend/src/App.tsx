import { useState } from 'react';
import { AnalysisForm } from './components/analysis/AnalysisForm';
import { CompoundInfo } from './components/analysis/CompoundInfo';
import { SummaryCard } from './components/analysis/SummaryCard';
import { TargetsList } from './components/analysis/TargetsList';
import { PathwaysList } from './components/analysis/PathwaysList';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { useAnalysisSync } from './hooks/useAnalysisSync';
import type { IngredientInput, BodyImpactReport } from './api/types';
import './App.css';

function App() {
  const [result, setResult] = useState<BodyImpactReport | null>(null);
  const [submittedIngredient, setSubmittedIngredient] = useState<string>('');

  const { mutate: analyzeCompound, isPending } = useAnalysisSync();

  const handleAnalyze = (input: IngredientInput) => {
    setSubmittedIngredient(input.ingredient_name);
    setResult(null); // Clear previous results

    analyzeCompound(input, {
      onSuccess: (data) => {
        setResult(data);
      },
      onError: (err) => {
        console.error('Analysis error:', err);
        alert(`Error: ${err.message}`);
      },
    });
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setSubmittedIngredient('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isPending && <LoadingOverlay compoundName={submittedIngredient} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900">BioPath</h1>
          <p className="mt-2 text-lg text-gray-600">
            Chemical-Target-Pathway Analysis Platform
          </p>
        </header>

        {/* Main Content */}
        <main>
          {!result ? (
            /* Analysis Form */
            <AnalysisForm onSubmit={handleAnalyze} isLoading={isPending} />
          ) : (
            /* Results Display */
            <div className="space-y-8">
              {/* Summary */}
              <SummaryCard report={result} />

              {/* Compound Info */}
              <CompoundInfo compound={result.compound_identity} />

              {/* Targets */}
              {result.known_targets.length > 0 && (
                <TargetsList targets={result.known_targets} />
              )}

              {/* Pathways */}
              {result.pathways.length > 0 && (
                <PathwaysList pathways={result.pathways} />
              )}

              {/* New Analysis Button */}
              <div className="text-center">
                <button
                  onClick={handleNewAnalysis}
                  className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors duration-200"
                >
                  ← New Analysis
                </button>
              </div>

              {/* Disclaimer */}
              {result.final_summary.disclaimer && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
                  <p className="font-medium text-yellow-900 mb-1">Disclaimer</p>
                  <p>{result.final_summary.disclaimer}</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>
            Powered by PubChem, ChEMBL, and Reactome
          </p>
          <p className="mt-1">
            For research purposes only • Not medical advice
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
