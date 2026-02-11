import { useState } from 'react';
import { AnalysisForm } from './components/analysis/AnalysisForm';
import { PlantIdentification } from './components/analysis/PlantIdentification';
import { PlantAnalysisResults } from './components/analysis/PlantAnalysisResults';
import { CompoundInfo } from './components/analysis/CompoundInfo';
import { SummaryCard } from './components/analysis/SummaryCard';
import { TargetsList } from './components/analysis/TargetsList';
import { PathwaysList } from './components/analysis/PathwaysList';
import { MoleculeViewer } from './components/analysis/MoleculeViewer';
import { SideEffectsTab } from './components/analysis/SideEffectsTab';
import { DrugInteractionsTab } from './components/analysis/DrugInteractionsTab';
import { PersonalizedInteractionsTab } from './components/analysis/PersonalizedInteractionsTab';
import { MedicationListManager, type Medication } from './components/medications/MedicationListManager';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { LicensesModal } from './components/common/LicensesModal';
import { useAnalysisSync } from './hooks/useAnalysisSync';
import { useTheme } from './hooks/useTheme';
import type { IngredientInput, BodyImpactReport, PlantAnalysisResponse } from './api/types';
import clsx from 'clsx';
import './apple-theme.css';
import './App.css';

type TabId = 'overview' | '3d-structure' | 'targets' | 'pathways' | 'side-effects' | 'drug-interactions' | 'my-medications';
type AnalysisMode = 'compound' | 'plant' | 'medication-tracker';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

function App() {
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('compound');
  const [result, setResult] = useState<BodyImpactReport | null>(null);
  const [plantResult, setPlantResult] = useState<PlantAnalysisResponse | null>(null);
  const [submittedIngredient, setSubmittedIngredient] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showLicenses, setShowLicenses] = useState(false);
  const [plantLoading, setPlantLoading] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  useTheme();

  const { mutate: analyzeCompound, isPending } = useAnalysisSync();

  const handleAnalyze = (input: IngredientInput) => {
    // Include user medications if available
    const enrichedInput: IngredientInput = {
      ...input,
      user_medications: medications.length > 0 ? medications.map(m => m.name) : undefined
    };

    setSubmittedIngredient(enrichedInput.ingredient_name);
    setResult(null);
    setActiveTab('overview');

    analyzeCompound(enrichedInput, {
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
    setPlantResult(null);
    setSubmittedIngredient('');
    setActiveTab('overview');
  };

  const handlePlantAnalysisComplete = (plantData: PlantAnalysisResponse) => {
    setPlantResult(plantData);
  };

  const handlePlantError = (error: string) => {
    alert(`Error: ${error}`);
  };

  const handleModeChange = (mode: AnalysisMode) => {
    setAnalysisMode(mode);
    setResult(null);
    setPlantResult(null);
    setSubmittedIngredient('');
  };

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: '3d-structure',
      label: '3D Structure',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
      ),
    },
    {
      id: 'targets',
      label: 'Targets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
    },
    {
      id: 'pathways',
      label: 'Pathways',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'side-effects',
      label: 'Side Effects',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: 'drug-interactions',
      label: 'Drug Interactions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      id: 'my-medications',
      label: 'My Medications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-primary text-primary transition-colors duration-200">
      {(isPending || plantLoading) && <LoadingOverlay compoundName={submittedIngredient || 'plant'} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-5xl font-700 tracking-tight mb-3">BioPath</h1>
          <p className="text-xl text-text-secondary">
            Discover how compounds interact with your medications
          </p>
        </header>

        {/* Mode Selector - only show when no results */}
        {!result && !plantResult && (
          <div className="flex justify-center mb-16">
            <div className="flex gap-3 bg-secondary rounded-full p-1">
              <button
                onClick={() => handleModeChange('compound')}
                className={clsx(
                  'px-8 py-3 rounded-full text-sm font-500 transition-all duration-300 relative overflow-hidden',
                  analysisMode === 'compound'
                    ? 'bg-gradient-to-r from-accent-warm to-accent-warm-dark text-white shadow-lg animate-liquid-glass'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                )}
              >
                <span className="mr-2">💊</span>
                Compound
              </button>
              <button
                onClick={() => handleModeChange('plant')}
                className={clsx(
                  'px-8 py-3 rounded-full text-sm font-500 transition-all duration-300 relative overflow-hidden',
                  analysisMode === 'plant'
                    ? 'bg-gradient-to-r from-accent-warm to-accent-warm-dark text-white shadow-lg animate-liquid-glass'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                )}
              >
                <span className="mr-2">🌿</span>
                Plant
              </button>
              <button
                onClick={() => handleModeChange('medication-tracker')}
                className={clsx(
                  'px-8 py-3 rounded-full text-sm font-500 transition-all duration-300 relative overflow-hidden',
                  analysisMode === 'medication-tracker'
                    ? 'bg-gradient-to-r from-accent-warm to-accent-warm-dark text-white shadow-lg animate-liquid-glass'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                )}
              >
                <span className="mr-2">🩺</span>
                Medications
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main>
          {/* Plant Analysis Results */}
          {plantResult ? (
            <PlantAnalysisResults
              result={plantResult}
              onNewAnalysis={handleNewAnalysis}
            />
          ) : !result ? (
            /* Input Forms */
            <div key={analysisMode} className="animate-content-fade">
              {analysisMode === 'compound' ? (
                <AnalysisForm onSubmit={handleAnalyze} isLoading={isPending} />
              ) : analysisMode === 'plant' ? (
                <PlantIdentification
                  onAnalysisComplete={handlePlantAnalysisComplete}
                  onError={handlePlantError}
                  isLoading={plantLoading}
                  setIsLoading={setPlantLoading}
                />
              ) : (
                <MedicationListManager
                  medications={medications}
                  onMedicationsChange={setMedications}
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary always visible */}
              <SummaryCard report={result} />

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx(
                        'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                      {tab.id === 'targets' && result.known_targets.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                          {result.known_targets.length}
                        </span>
                      )}
                      {tab.id === 'pathways' && result.pathways.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                          {result.pathways.length}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'overview' && (
                  <CompoundInfo compound={result.compound_identity} />
                )}

                {activeTab === '3d-structure' && (
                  <MoleculeViewer compound={result.compound_identity} />
                )}

                {activeTab === 'targets' && (
                  result.known_targets.length > 0 ? (
                    <TargetsList targets={result.known_targets} />
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No known targets found for this compound.</p>
                    </div>
                  )
                )}

                {activeTab === 'pathways' && (
                  result.pathways.length > 0 ? (
                    <PathwaysList pathways={result.pathways} />
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No pathways found for this compound.</p>
                    </div>
                  )
                )}

                {activeTab === 'side-effects' && (
                  <SideEffectsTab
                    targets={result.known_targets}
                    pathways={result.pathways}
                    compoundName={result.ingredient_name}
                  />
                )}

                {activeTab === 'drug-interactions' && (
                  <DrugInteractionsTab
                    targets={result.known_targets}
                    pathways={result.pathways}
                    compoundName={result.ingredient_name}
                  />
                )}

                {activeTab === 'my-medications' && (
                  <PersonalizedInteractionsTab
                    compoundName={result.ingredient_name}
                    personalized_interactions={result.personalized_interactions || []}
                  />
                )}
              </div>

              {/* New Analysis Button */}
              <div className="text-center pt-4">
                <button
                  onClick={handleNewAnalysis}
                  className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors duration-200"
                >
                  New Analysis
                </button>
              </div>

              {/* Disclaimer */}
              {result.final_summary.disclaimer && (
                <div className="bg-secondary border border-divider rounded-lg p-6 text-sm">
                  <p className="font-600 text-text-primary mb-2">Disclaimer</p>
                  <p className="text-text-secondary">{result.final_summary.disclaimer}</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-divider text-center text-sm text-text-secondary">
          <p className="mb-3">
            Created by <span className="font-500 text-text-primary">Dharsan Kesavan</span>
          </p>
          <p className="text-text-tertiary text-xs mb-4">
            Powered by PubChem, ChEMBL, Reactome, Open Targets, and PlantNet
          </p>
          <p className="text-text-tertiary text-xs mb-4">
            For research purposes only - Not medical advice
          </p>
          <button
            onClick={() => setShowLicenses(true)}
            className="text-info hover:opacity-70 transition-opacity text-xs"
          >
            Licenses & Attributions
          </button>
        </footer>
      </div>

      {/* Licenses Modal */}
      <LicensesModal isOpen={showLicenses} onClose={() => setShowLicenses(false)} />
    </div>
  );
}

export default App;
