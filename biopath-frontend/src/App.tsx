import { useState } from 'react';
import { AnalysisForm } from './components/analysis/AnalysisForm';
import { CompoundInfo } from './components/analysis/CompoundInfo';
import { SummaryCard } from './components/analysis/SummaryCard';
import { TargetsList } from './components/analysis/TargetsList';
import { PathwaysList } from './components/analysis/PathwaysList';
import { MoleculeViewer } from './components/analysis/MoleculeViewer';
import { SideEffectsTab } from './components/analysis/SideEffectsTab';
import { DrugInteractionsTab } from './components/analysis/DrugInteractionsTab';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { useAnalysisSync } from './hooks/useAnalysisSync';
import { useTheme } from './hooks/useTheme';
import type { IngredientInput, BodyImpactReport } from './api/types';
import clsx from 'clsx';
import './App.css';

type TabId = 'overview' | '3d-structure' | 'targets' | 'pathways' | 'side-effects' | 'drug-interactions';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

function App() {
  const [result, setResult] = useState<BodyImpactReport | null>(null);
  const [submittedIngredient, setSubmittedIngredient] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { theme, toggleTheme } = useTheme();

  const { mutate: analyzeCompound, isPending } = useAnalysisSync();

  const handleAnalyze = (input: IngredientInput) => {
    setSubmittedIngredient(input.ingredient_name);
    setResult(null);
    setActiveTab('overview');

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
    setActiveTab('overview');
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
  ];

  return (
    <div className="min-h-screen gradient-bg transition-colors duration-200">
      {isPending && <LoadingOverlay compoundName={submittedIngredient} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-12 text-center relative">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="absolute right-0 top-0 p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all shadow-lg glow-card"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white float-animation">BioPath</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Chemical-Target-Pathway Analysis Platform
          </p>
        </header>

        {/* Main Content */}
        <main>
          {!result ? (
            <AnalysisForm onSubmit={handleAnalyze} isLoading={isPending} />
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
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium text-yellow-900 dark:text-yellow-400 mb-1">Disclaimer</p>
                  <p>{result.final_summary.disclaimer}</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Powered by PubChem, ChEMBL, and Reactome
          </p>
          <p className="mt-1">
            For research purposes only - Not medical advice
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
