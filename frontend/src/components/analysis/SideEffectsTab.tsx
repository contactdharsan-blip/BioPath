import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import type { TargetEvidence, PathwayMatch } from '../../api/types';
import clsx from 'clsx';

interface SideEffectsTabProps {
  targets: TargetEvidence[];
  pathways: PathwayMatch[];
  compoundName: string;
}

type SeverityLevel = 'mild' | 'moderate' | 'serious';
type FrequencyLevel = 'common' | 'uncommon' | 'rare';

interface SideEffect {
  name: string;
  description: string;
  severity: SeverityLevel;
  frequency: FrequencyLevel;
  body_system: string;
  mechanism_basis: string;
  management_tips: string[];
  when_to_seek_help?: string;
  effect_type: 'positive' | 'negative';
}

const SeverityBadge: React.FC<{ severity: SeverityLevel }> = ({ severity }) => {
  const config = {
    mild: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Mild' },
    moderate: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: 'Moderate' },
    serious: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Serious' },
  };
  const c = config[severity];

  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      {c.label}
    </span>
  );
};

const FrequencyBadge: React.FC<{ frequency: FrequencyLevel }> = ({ frequency }) => {
  const config = {
    common: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Common' },
    uncommon: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Uncommon' },
    rare: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-300', label: 'Rare' },
  };
  const c = config[frequency];

  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      {c.label}
    </span>
  );
};

export const SideEffectsTab: React.FC<SideEffectsTabProps> = ({ targets, pathways, compoundName }) => {
  const [expandedEffect, setExpandedEffect] = useState<number | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'all'>('all');
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSideEffects = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/side-effects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            compound_name: compoundName,
            pathways: pathways.map(p => p.pathway_name),
            targets: targets.map(t => t.target_name),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch side effects: ${response.statusText}`);
        }

        const data = await response.json();
        setSideEffects(data.side_effects || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch side effects');
        setSideEffects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSideEffects();
  }, [compoundName, pathways, targets]);

  const filteredEffects = filterSeverity === 'all'
    ? sideEffects
    : sideEffects.filter(e => e.severity === filterSeverity);

  const severityCounts = {
    serious: sideEffects.filter(e => e.severity === 'serious').length,
    moderate: sideEffects.filter(e => e.severity === 'moderate').length,
    mild: sideEffects.filter(e => e.severity === 'mild').length,
  };

  if (loading) {
    return (
      <Card className="animate-slide-up">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading side effects...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="animate-slide-up">
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-900 dark:text-red-300 font-semibold">Error Loading Side Effects</p>
          <p className="text-red-800 dark:text-red-400 text-sm mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Potential Side Effects
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Based on {compoundName}'s affected pathways and targets
          </p>
        </div>

        {/* Severity Summary */}
        <div className="flex gap-3">
          {severityCounts.serious > 0 && (
            <div className="text-center">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">{severityCounts.serious}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">Serious</span>
            </div>
          )}
          <div className="text-center">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{severityCounts.moderate}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Moderate</span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{severityCounts.mild}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Mild</span>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterSeverity('all')}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filterSeverity === 'all'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          )}
        >
          All ({sideEffects.length})
        </button>
        <button
          onClick={() => setFilterSeverity('serious')}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filterSeverity === 'serious'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          )}
        >
          Serious
        </button>
        <button
          onClick={() => setFilterSeverity('moderate')}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filterSeverity === 'moderate'
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          )}
        >
          Moderate
        </button>
        <button
          onClick={() => setFilterSeverity('mild')}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filterSeverity === 'mild'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          )}
        >
          Mild
        </button>
      </div>

      {/* Side Effects List */}
      <div className="space-y-3">
        {filteredEffects.map((effect, index) => {
          const isExpanded = expandedEffect === index;

          return (
            <div
              key={index}
              className={clsx(
                'border rounded-xl overflow-hidden transition-all duration-200',
                effect.severity === 'serious' && 'border-red-200 dark:border-red-800',
                effect.severity === 'moderate' && 'border-amber-200 dark:border-amber-800',
                effect.severity === 'mild' && 'border-gray-200 dark:border-gray-700',
                isExpanded && 'shadow-lg'
              )}
            >
              {/* Header */}
              <div
                onClick={() => setExpandedEffect(isExpanded ? null : index)}
                className={clsx(
                  'p-4 cursor-pointer transition-colors',
                  effect.severity === 'serious' && 'hover:bg-red-50 dark:hover:bg-red-900/10',
                  effect.severity === 'moderate' && 'hover:bg-amber-50 dark:hover:bg-amber-900/10',
                  effect.severity === 'mild' && 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{effect.name}</h4>
                      <SeverityBadge severity={effect.severity as SeverityLevel} />
                      <FrequencyBadge frequency={effect.frequency as FrequencyLevel} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{effect.description}</p>
                  </div>
                  <button className={clsx('p-1 transition-transform duration-200', isExpanded && 'rotate-180')}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {/* Body System & Mechanism */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">BODY SYSTEM</h5>
                      <p className="text-sm text-gray-900 dark:text-white">{effect.body_system}</p>
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-3 mb-2">MECHANISM BASIS</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{effect.mechanism_basis}</p>
                    </div>

                    {/* Management Tips */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">MANAGEMENT TIPS</h5>
                      <ul className="space-y-1">
                        {effect.management_tips.map((tip, i) => (
                          <li key={i} className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* When to Seek Help */}
                  {effect.when_to_seek_help && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        WHEN TO SEEK MEDICAL HELP
                      </h5>
                      <p className="text-sm text-red-800 dark:text-red-200">{effect.when_to_seek_help}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredEffects.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No side effects found for the selected filter.
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>Disclaimer:</strong> This information is derived from the compound's mechanism of action and is for educational purposes only.
          Individual responses may vary. Always consult a healthcare professional for medical advice. Not all possible side effects are listed.
        </p>
      </div>
    </Card>
  );
};
