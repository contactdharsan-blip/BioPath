import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import type { TargetEvidence } from '../../api/types';
import { formatPChEMBL, getPotencyDescription } from '../../utils/formatters';
import clsx from 'clsx';

interface TargetsListProps {
  targets: TargetEvidence[];
}

// Body effects database for common protein targets
const getTargetBodyEffects = (targetName: string, targetId: string): {
  systems: string[];
  effects: { metric: string; effect: string; direction: 'increase' | 'decrease' | 'modulate' }[];
  mechanism: string;
} => {
  const targetLower = targetName.toLowerCase();

  // COX enzymes (Prostaglandin synthases)
  if (targetLower.includes('cyclooxygenase') || targetLower.includes('prostaglandin') || targetId === 'P23219' || targetId === 'P35354') {
    return {
      systems: ['Inflammatory Response', 'Pain Signaling', 'Cardiovascular', 'Gastrointestinal'],
      effects: [
        { metric: 'Prostaglandin Production', effect: 'Reduces inflammatory prostaglandins', direction: 'decrease' },
        { metric: 'Pain Perception', effect: 'Decreases pain signaling', direction: 'decrease' },
        { metric: 'Inflammation', effect: 'Reduces swelling and redness', direction: 'decrease' },
        { metric: 'Platelet Aggregation', effect: 'May affect blood clotting', direction: 'modulate' },
        { metric: 'Gastric Protection', effect: 'May reduce stomach lining protection', direction: 'decrease' },
      ],
      mechanism: 'Inhibition blocks the conversion of arachidonic acid to prostaglandins, reducing inflammation and pain.',
    };
  }

  // Lipoxygenases
  if (targetLower.includes('lipoxygenase') || targetId === 'P09917') {
    return {
      systems: ['Inflammatory Response', 'Immune System', 'Respiratory'],
      effects: [
        { metric: 'Leukotriene Production', effect: 'Modulates leukotriene synthesis', direction: 'modulate' },
        { metric: 'Airway Inflammation', effect: 'Affects bronchial constriction', direction: 'modulate' },
        { metric: 'Allergic Response', effect: 'Influences allergic reactions', direction: 'modulate' },
      ],
      mechanism: 'Affects leukotriene pathway, influencing inflammatory and allergic responses.',
    };
  }

  // Cytochrome P450 enzymes
  if (targetLower.includes('cytochrome') || targetLower.includes('cyp') || targetId.startsWith('P11')) {
    return {
      systems: ['Drug Metabolism', 'Liver Function', 'Detoxification'],
      effects: [
        { metric: 'Drug Metabolism', effect: 'Alters drug processing speed', direction: 'modulate' },
        { metric: 'Drug Interactions', effect: 'May affect other medication levels', direction: 'modulate' },
        { metric: 'Liver Enzyme Activity', effect: 'Influences hepatic function', direction: 'modulate' },
      ],
      mechanism: 'Interaction with CYP450 enzymes affects how drugs are metabolized in the liver.',
    };
  }

  // Aldo-keto reductases
  if (targetLower.includes('aldo-keto') || targetLower.includes('reductase')) {
    return {
      systems: ['Steroid Metabolism', 'Prostaglandin Metabolism', 'Detoxification'],
      effects: [
        { metric: 'Steroid Levels', effect: 'Modulates steroid hormone metabolism', direction: 'modulate' },
        { metric: 'Prostaglandin Levels', effect: 'Affects prostaglandin inactivation', direction: 'modulate' },
      ],
      mechanism: 'Involved in the metabolism of steroids and prostaglandins.',
    };
  }

  // Phospholipases
  if (targetLower.includes('phospholipase')) {
    return {
      systems: ['Cell Signaling', 'Inflammatory Response', 'Membrane Function'],
      effects: [
        { metric: 'Arachidonic Acid Release', effect: 'Affects inflammatory precursor release', direction: 'modulate' },
        { metric: 'Cell Membrane Integrity', effect: 'Influences membrane composition', direction: 'modulate' },
      ],
      mechanism: 'Releases fatty acids from cell membranes, affecting downstream signaling.',
    };
  }

  // Kinases
  if (targetLower.includes('kinase')) {
    return {
      systems: ['Cell Signaling', 'Cell Growth', 'Metabolism'],
      effects: [
        { metric: 'Cell Proliferation', effect: 'Modulates cell growth signals', direction: 'modulate' },
        { metric: 'Protein Phosphorylation', effect: 'Affects cellular signaling cascades', direction: 'modulate' },
      ],
      mechanism: 'Phosphorylates proteins to regulate cellular processes.',
    };
  }

  // Ion channels
  if (targetLower.includes('channel') || targetLower.includes('receptor')) {
    return {
      systems: ['Nervous System', 'Cell Signaling', 'Muscle Function'],
      effects: [
        { metric: 'Neural Signaling', effect: 'Modulates nerve impulse transmission', direction: 'modulate' },
        { metric: 'Cellular Excitability', effect: 'Affects cell responsiveness', direction: 'modulate' },
      ],
      mechanism: 'Modulates ion flow or receptor activation affecting cell signaling.',
    };
  }

  // Default for unknown targets
  return {
    systems: ['Cellular Function'],
    effects: [
      { metric: 'Protein Activity', effect: 'Modulates target protein function', direction: 'modulate' },
    ],
    mechanism: 'Interacts with target protein, potentially affecting its normal function.',
  };
};

export const TargetsList: React.FC<TargetsListProps> = ({ targets }) => {
  const [sortBy, setSortBy] = useState<'name' | 'potency'>('potency');
  const [expandedTarget, setExpandedTarget] = useState<number | null>(null);

  const sortedTargets = [...targets].sort((a, b) => {
    if (sortBy === 'name') {
      return a.target_name.localeCompare(b.target_name);
    }
    return (b.pchembl_value || 0) - (a.pchembl_value || 0);
  });

  const toggleTarget = (index: number) => {
    setExpandedTarget(expandedTarget === index ? null : index);
  };

  const getDirectionIcon = (direction: 'increase' | 'decrease' | 'modulate') => {
    switch (direction) {
      case 'increase':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        );
      case 'decrease':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
    }
  };

  return (
    <Card className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Known Targets</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {targets.length} target{targets.length !== 1 ? 's' : ''} with measured potency
          </p>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'potency')}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="potency">Sort by Potency</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      <div className="space-y-3">
        {sortedTargets.map((target, index) => {
          const isExpanded = expandedTarget === index;
          const bodyEffects = getTargetBodyEffects(target.target_name, target.target_id);

          return (
            <div
              key={index}
              className={clsx(
                'border rounded-lg transition-all duration-200 overflow-hidden',
                isExpanded
                  ? 'border-primary-400 dark:border-primary-500 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
              )}
            >
              {/* Target Header - Clickable */}
              <div
                onClick={() => toggleTarget(index)}
                className="p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{target.target_name}</h4>
                      <svg
                        className={clsx(
                          'w-4 h-4 text-gray-400 transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {target.target_id}
                    </p>
                  </div>
                  <Badge tier={target.confidence_tier}>
                    Tier {target.confidence_tier}
                  </Badge>
                </div>

                {target.pchembl_value && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        pChEMBL: {formatPChEMBL(target.pchembl_value)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getPotencyDescription(target.pchembl_value)} Potency
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                        style={{ width: `${(target.pchembl_value / 10) * 100}%` }}
                      />
                    </div>
                    {target.standard_type && target.standard_value && target.standard_units && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {target.standard_type}: {target.standard_value} {target.standard_units}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Source: {target.source}</span>
                  {target.assay_references?.length > 0 && (
                    <span>• {target.assay_references.length} assay{target.assay_references.length > 1 ? 's' : ''}</span>
                  )}
                  <span className="ml-auto text-primary-500 dark:text-primary-400">
                    {isExpanded ? 'Click to collapse' : 'Click for body effects'}
                  </span>
                </div>
              </div>

              {/* Expanded Body Effects Section */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-4">
                  {/* Affected Body Systems */}
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Affected Body Systems
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {bodyEffects.systems.map((system, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full"
                        >
                          {system}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Body Metrics Effects */}
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Body Metric Effects
                    </h5>
                    <div className="space-y-2">
                      {bodyEffects.effects.map((effect, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
                        >
                          <div className="mt-0.5">
                            {getDirectionIcon(effect.direction)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {effect.metric}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {effect.effect}
                            </p>
                          </div>
                          <span className={clsx(
                            'text-xs px-2 py-0.5 rounded-full',
                            effect.direction === 'increase' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
                            effect.direction === 'decrease' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                            effect.direction === 'modulate' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          )}>
                            {effect.direction === 'increase' ? 'Increases' : effect.direction === 'decrease' ? 'Decreases' : 'Modulates'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mechanism of Action */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Mechanism of Action
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                      {bodyEffects.mechanism}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {targets.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No known targets found for this compound.
          </div>
        )}
      </div>
    </Card>
  );
};
