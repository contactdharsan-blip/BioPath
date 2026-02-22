import { useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisForm } from './components/analysis/AnalysisForm';
import { PlantIdentification } from './components/analysis/PlantIdentification';
import { PlantAnalysisResults } from './components/analysis/PlantAnalysisResults';
import { CompoundInfo } from './components/analysis/CompoundInfo';
import { SummaryCard } from './components/analysis/SummaryCard';
import { TargetsList } from './components/analysis/TargetsList';
import { PathwaysList } from './components/analysis/PathwaysList';
import { BodyDiagram } from './components/analysis/BodyDiagram';
import { MoleculeViewer } from './components/analysis/MoleculeViewer';
import { SideEffectsTab } from './components/analysis/SideEffectsTab';
import { DrugInteractionsTab } from './components/analysis/DrugInteractionsTab';
import { DosageTab } from './components/analysis/DosageTab';
import { MedicationListManager, type Medication } from './components/medications/MedicationListManager';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { LicensesModal } from './components/common/LicensesModal';
import { useAnalysisSync } from './hooks/useAnalysisSync';
import { useTheme } from './hooks/useTheme';
import type { IngredientInput, BodyImpactReport, PlantAnalysisResponse } from './api/types';
import clsx from 'clsx';
import './apple-theme.css';
import './App.css';

type TabId = 'overview' | 'body-impact' | '3d-structure' | 'targets' | 'pathways' | 'side-effects' | 'drug-interactions' | 'dosage';
type AnalysisMode = 'compound' | 'plant' | 'medication-tracker';

interface Tab {
  id: TabId;
  label: string;
  shortLabel: string;
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

  // Liquid glass indicator refs and state
  const tabBarRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const modeBarRef = useRef<HTMLDivElement>(null);
  const modeBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
  const [modeIndicator, setModeIndicator] = useState({ left: 0, width: 0 });
  const [tabMoving, setTabMoving] = useState(false);
  const [modeMoving, setModeMoving] = useState(false);

  // Compute glass indicator position for tab bar
  const updateTabIndicator = useCallback(() => {
    const bar = tabBarRef.current;
    const btn = tabBtnRefs.current.get(activeTab);
    if (bar && btn) {
      const barRect = bar.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setTabIndicator({
        left: btnRect.left - barRect.left,
        width: btnRect.width,
      });
    }
  }, [activeTab]);

  // Compute glass indicator position for mode selector
  const updateModeIndicator = useCallback(() => {
    const bar = modeBarRef.current;
    const btn = modeBtnRefs.current.get(analysisMode);
    if (bar && btn) {
      const barRect = bar.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setModeIndicator({
        left: btnRect.left - barRect.left,
        width: btnRect.width,
      });
    }
  }, [analysisMode]);

  // Update indicators when active tab/mode changes
  useEffect(() => {
    updateTabIndicator();
    setTabMoving(true);
    const timer = setTimeout(() => setTabMoving(false), 450);
    return () => clearTimeout(timer);
  }, [activeTab, updateTabIndicator]);

  useEffect(() => {
    updateModeIndicator();
    setModeMoving(true);
    const timer = setTimeout(() => setModeMoving(false), 400);
    return () => clearTimeout(timer);
  }, [analysisMode, updateModeIndicator]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      updateTabIndicator();
      updateModeIndicator();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateTabIndicator, updateModeIndicator]);

  const { mutate: analyzeCompound, isPending } = useAnalysisSync();

  const handleAnalyze = (input: IngredientInput) => {
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
      shortLabel: 'Overview',
      icon: (
        <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'body-impact',
      label: 'Body Impact',
      shortLabel: 'Body',
      icon: (
        <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      id: '3d-structure',
      label: '3D Structure',
      shortLabel: '3D',
      icon: (
        <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
      ),
    },
    {
      id: 'targets',
      label: 'Targets',
      shortLabel: 'Targets',
      icon: (
        <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      ),
    },
    {
      id: 'pathways',
      label: 'Pathways',
      shortLabel: 'Paths',
      icon: (
        <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'side-effects',
      label: 'Side Effects',
      shortLabel: 'Effects',
      icon: (
        <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: 'drug-interactions',
      label: 'Interactions',
      shortLabel: 'Drugs',
      icon: (
        <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      id: 'dosage',
      label: 'Dosage',
      shortLabel: 'Dosage',
      icon: (
        <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
  ];

  const hasResults = result || plantResult;

  return (
    <div className="min-h-screen app-bg relative">
      {/* SVG Filters for Liquid Glass Background Warping */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          {/* Subtle warp for small glass elements (indicators, pills) */}
          <filter id="glass-warp" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.02"
              numOctaves={3}
              seed={2}
              result="warp"
            >
              <animate attributeName="seed" values="2;3;5;3;2" dur="10s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="warp"
              scale={1.5}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          {/* Stronger warp for larger glass surfaces (nav bars, cards) */}
          <filter id="glass-warp-strong" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.012"
              numOctaves={4}
              seed={5}
              result="warp"
            >
              <animate attributeName="seed" values="5;8;12;8;5" dur="14s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="warp"
              scale={3}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {(isPending || plantLoading) && <LoadingOverlay compoundName={submittedIngredient || 'plant'} />}

      <div className={clsx(
        'relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8',
        hasResults ? 'pt-6 sm:pt-8 pb-24 md:pb-12' : 'pt-12 sm:pt-20 pb-12'
      )}>
        {/* Header */}
        <header className={clsx(
          'text-center transition-all duration-300',
          hasResults ? 'mb-6 sm:mb-8' : 'mb-10 sm:mb-16'
        )}>
          <h1 className={clsx(
            'font-extrabold tracking-tight gradient-text transition-all duration-300',
            hasResults ? 'text-2xl sm:text-3xl mb-1' : 'text-4xl sm:text-5xl md:text-6xl mb-3'
          )}>
            BioPath
          </h1>
          {!hasResults && (
            <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto animate-content-fade">
              Discover how compounds interact with your body and medications
            </p>
          )}
          {hasResults && result && (
            <p className="text-xs sm:text-sm text-slate-500">
              Analyzing <span className="text-primary-400 font-medium">{result.ingredient_name}</span>
            </p>
          )}
        </header>

        {/* Mode Selector - only show when no results */}
        {!hasResults && (
          <div className="flex justify-center mb-8 sm:mb-12 animate-content-fade px-2">
            <div className="mode-selector w-full max-w-sm" ref={modeBarRef}>
              {/* Liquid glass sliding indicator */}
              <div
                className={clsx('mode-glass-indicator', modeMoving && 'moving')}
                style={{ left: modeIndicator.left, width: modeIndicator.width }}
              />
              {(['compound', 'plant', 'medication-tracker'] as AnalysisMode[]).map((mode) => (
                <button
                  key={mode}
                  ref={(el) => { if (el) modeBtnRefs.current.set(mode, el); }}
                  onClick={() => handleModeChange(mode)}
                  className={clsx('mode-btn', analysisMode === mode && 'active')}
                >
                  {mode === 'compound' ? 'Compound' : mode === 'plant' ? 'Plant' : 'Meds'}
                </button>
              ))}
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
            <div key={analysisMode} className="tab-content-liquid">
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
            <div className="space-y-4 sm:space-y-6">
              {/* Tab Navigation - Desktop: liquid glass pill bar, Mobile: hidden (use bottom nav) */}
              <div className="hidden md:block">
                <div className="tab-bar" ref={tabBarRef}>
                  {/* Liquid glass sliding indicator */}
                  <div
                    className={clsx('tab-glass-indicator', tabMoving && 'moving')}
                    style={{ left: tabIndicator.left, width: tabIndicator.width }}
                  />
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      ref={(el) => { if (el) tabBtnRefs.current.set(tab.id, el); }}
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx('tab-btn', activeTab === tab.id && 'active')}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      {tab.id === 'targets' && result.known_targets.length > 0 && (
                        <span className="tab-count">{result.known_targets.length}</span>
                      )}
                      {tab.id === 'pathways' && result.pathways.length > 0 && (
                        <span className="tab-count">{result.pathways.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile tab indicator */}
              <div className="md:hidden flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold text-slate-200">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <button
                  onClick={handleNewAnalysis}
                  className="text-xs text-primary-400 font-medium px-3 py-1.5 rounded-full border border-primary-400/30 hover:bg-primary-400/10 transition-colors"
                >
                  New Analysis
                </button>
              </div>

              {/* Summary Cards */}
              <SummaryCard report={result} />

              {/* Tab Content - liquid glass transition */}
              <div className="tab-content-liquid" key={activeTab}>
                {activeTab === 'overview' && (
                  <CompoundInfo compound={result.compound_identity} />
                )}

                {activeTab === 'body-impact' && (
                  <BodyDiagram
                    targets={result.known_targets}
                    pathways={result.pathways}
                    compoundName={result.ingredient_name}
                  />
                )}

                {activeTab === '3d-structure' && (
                  <MoleculeViewer compound={result.compound_identity} />
                )}

                {activeTab === 'targets' && (
                  result.known_targets.length > 0 ? (
                    <TargetsList targets={result.known_targets} />
                  ) : (
                    <div className="text-center py-16 text-slate-500">
                      <svg className="w-10 h-10 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-sm">No known targets found for this compound.</p>
                    </div>
                  )
                )}

                {activeTab === 'pathways' && (
                  result.pathways.length > 0 ? (
                    <PathwaysList pathways={result.pathways} />
                  ) : (
                    <div className="text-center py-16 text-slate-500">
                      <svg className="w-10 h-10 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-sm">No pathways found for this compound.</p>
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
                    personalized_interactions={result.personalized_interactions || []}
                  />
                )}

                {activeTab === 'dosage' && (
                  <DosageTab
                    compoundName={result.ingredient_name}
                    pubchemCid={result.compound_identity.pubchem_cid}
                    inchikey={result.compound_identity.inchikey}
                    smiles={result.compound_identity.canonical_smiles}
                    targets={result.known_targets}
                  />
                )}
              </div>

              {/* New Analysis Button - Desktop only */}
              <div className="hidden md:block text-center pt-4">
                <button
                  onClick={handleNewAnalysis}
                  className="px-6 py-2.5 text-sm font-medium text-primary-400 border border-primary-500/30 rounded-full hover:bg-primary-500/10 transition-all duration-200"
                >
                  New Analysis
                </button>
              </div>

              {/* Disclaimer */}
              {result.final_summary.disclaimer && (
                <div className="glass rounded-xl p-4 sm:p-5 text-sm">
                  <p className="font-semibold text-slate-300 mb-1 text-xs uppercase tracking-wider">Disclaimer</p>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{result.final_summary.disclaimer}</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer - only show when no results or on desktop */}
        <footer className={clsx(
          'mt-16 sm:mt-24 pt-8 border-t border-white/5 text-center',
          result && 'hidden md:block'
        )}>
          <p className="text-sm text-slate-500 mb-2">
            Created by <span className="font-medium text-slate-400">Dharsan Kesavan</span>
          </p>
          <p className="text-xs text-slate-600 mb-3">
            Powered by PubChem, ChEMBL, Reactome, Open Targets, and PlantNet
          </p>
          <p className="text-xs text-slate-600 mb-4">
            For research purposes only - Not medical advice
          </p>
          <button
            onClick={() => setShowLicenses(true)}
            className="text-xs text-primary-400/70 hover:text-primary-400 transition-colors"
          >
            Licenses & Attributions
          </button>
        </footer>
      </div>

      {/* Mobile Bottom Navigation - only show when results are displayed */}
      {result && (
        <nav className="bottom-nav">
          <div className="bottom-nav-inner">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx('bottom-nav-btn', activeTab === tab.id && 'active')}
              >
                <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {tab.id === 'overview' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                  {tab.id === 'body-impact' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
                  {tab.id === '3d-structure' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />}
                  {tab.id === 'targets' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />}
                  {tab.id === 'pathways' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />}
                  {tab.id === 'side-effects' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
                  {tab.id === 'drug-interactions' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />}
                  {tab.id === 'dosage' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />}
                </svg>
                <span>{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Licenses Modal */}
      <LicensesModal isOpen={showLicenses} onClose={() => setShowLicenses(false)} />
    </div>
  );
}

export default App;
