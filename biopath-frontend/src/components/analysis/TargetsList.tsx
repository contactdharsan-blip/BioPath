import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import type { TargetEvidence } from '../../api/types';
import { formatPChEMBL, getPotencyDescription } from '../../utils/formatters';
import clsx from 'clsx';

interface TargetsListProps {
  targets: TargetEvidence[];
}

// Organ types for visualization
type OrganId = 'brain' | 'heart' | 'lungs' | 'liver' | 'stomach' | 'kidneys' | 'joints' | 'blood';
type EffectType = 'therapeutic' | 'adverse' | 'neutral';

interface OrganEffect {
  organ: OrganId;
  effectType: EffectType;
  label: string;
}

// Body effects database for common protein targets
const getTargetBodyEffects = (targetName: string, targetId: string): {
  systems: string[];
  organs: OrganEffect[];
  effects: { metric: string; effect: string; direction: 'increase' | 'decrease' | 'modulate' }[];
} => {
  const targetLower = targetName.toLowerCase();

  // COX enzymes (Prostaglandin synthases)
  if (targetLower.includes('cyclooxygenase') || targetLower.includes('prostaglandin') || targetId === 'P23219' || targetId === 'P35354') {
    return {
      systems: ['Inflammatory Response', 'Pain Signaling', 'Cardiovascular', 'Gastrointestinal'],
      organs: [
        { organ: 'joints', effectType: 'therapeutic', label: 'Reduces pain & inflammation' },
        { organ: 'stomach', effectType: 'adverse', label: 'May reduce protection' },
        { organ: 'heart', effectType: 'neutral', label: 'Affects platelet function' },
        { organ: 'kidneys', effectType: 'neutral', label: 'May affect blood flow' },
      ],
      effects: [
        { metric: 'Prostaglandin Production', effect: 'Reduces inflammatory prostaglandins', direction: 'decrease' },
        { metric: 'Pain Perception', effect: 'Decreases pain signaling', direction: 'decrease' },
        { metric: 'Inflammation', effect: 'Reduces swelling and redness', direction: 'decrease' },
        { metric: 'Platelet Aggregation', effect: 'May affect blood clotting', direction: 'modulate' },
        { metric: 'Gastric Protection', effect: 'May reduce stomach lining protection', direction: 'decrease' },
      ],
    };
  }

  // Lipoxygenases
  if (targetLower.includes('lipoxygenase') || targetId === 'P09917') {
    return {
      systems: ['Inflammatory Response', 'Immune System', 'Respiratory'],
      organs: [
        { organ: 'lungs', effectType: 'therapeutic', label: 'Reduces airway inflammation' },
        { organ: 'joints', effectType: 'therapeutic', label: 'Anti-inflammatory' },
        { organ: 'blood', effectType: 'neutral', label: 'Affects immune cells' },
      ],
      effects: [
        { metric: 'Leukotriene Production', effect: 'Modulates leukotriene synthesis', direction: 'modulate' },
        { metric: 'Airway Inflammation', effect: 'Affects bronchial constriction', direction: 'modulate' },
        { metric: 'Allergic Response', effect: 'Influences allergic reactions', direction: 'modulate' },
      ],
    };
  }

  // Cytochrome P450 enzymes
  if (targetLower.includes('cytochrome') || targetLower.includes('cyp') || targetId.startsWith('P11')) {
    return {
      systems: ['Drug Metabolism', 'Liver Function', 'Detoxification'],
      organs: [
        { organ: 'liver', effectType: 'neutral', label: 'Primary metabolism site' },
      ],
      effects: [
        { metric: 'Drug Metabolism', effect: 'Alters drug processing speed', direction: 'modulate' },
        { metric: 'Drug Interactions', effect: 'May affect other medication levels', direction: 'modulate' },
        { metric: 'Liver Enzyme Activity', effect: 'Influences hepatic function', direction: 'modulate' },
      ],
    };
  }

  // Aldo-keto reductases
  if (targetLower.includes('aldo-keto') || targetLower.includes('reductase')) {
    return {
      systems: ['Steroid Metabolism', 'Prostaglandin Metabolism', 'Detoxification'],
      organs: [
        { organ: 'liver', effectType: 'neutral', label: 'Metabolic processing' },
        { organ: 'kidneys', effectType: 'neutral', label: 'Steroid metabolism' },
      ],
      effects: [
        { metric: 'Steroid Levels', effect: 'Modulates steroid hormone metabolism', direction: 'modulate' },
        { metric: 'Prostaglandin Levels', effect: 'Affects prostaglandin inactivation', direction: 'modulate' },
      ],
    };
  }

  // Phospholipases
  if (targetLower.includes('phospholipase')) {
    return {
      systems: ['Cell Signaling', 'Inflammatory Response', 'Membrane Function'],
      organs: [
        { organ: 'joints', effectType: 'therapeutic', label: 'Reduces inflammation' },
        { organ: 'blood', effectType: 'neutral', label: 'Cell membrane effects' },
      ],
      effects: [
        { metric: 'Arachidonic Acid Release', effect: 'Affects inflammatory precursor release', direction: 'modulate' },
        { metric: 'Cell Membrane Integrity', effect: 'Influences membrane composition', direction: 'modulate' },
      ],
    };
  }

  // Kinases
  if (targetLower.includes('kinase')) {
    return {
      systems: ['Cell Signaling', 'Cell Growth', 'Metabolism'],
      organs: [
        { organ: 'brain', effectType: 'neutral', label: 'Cell signaling' },
        { organ: 'heart', effectType: 'neutral', label: 'Growth regulation' },
      ],
      effects: [
        { metric: 'Cell Proliferation', effect: 'Modulates cell growth signals', direction: 'modulate' },
        { metric: 'Protein Phosphorylation', effect: 'Affects cellular signaling cascades', direction: 'modulate' },
      ],
    };
  }

  // Ion channels and receptors
  if (targetLower.includes('channel') || targetLower.includes('receptor')) {
    return {
      systems: ['Nervous System', 'Cell Signaling', 'Muscle Function'],
      organs: [
        { organ: 'brain', effectType: 'therapeutic', label: 'Neural signaling' },
        { organ: 'heart', effectType: 'neutral', label: 'Muscle function' },
      ],
      effects: [
        { metric: 'Neural Signaling', effect: 'Modulates nerve impulse transmission', direction: 'modulate' },
        { metric: 'Cellular Excitability', effect: 'Affects cell responsiveness', direction: 'modulate' },
      ],
    };
  }

  // Default for unknown targets
  return {
    systems: ['Cellular Function'],
    organs: [
      { organ: 'blood', effectType: 'neutral', label: 'Systemic effects' },
    ],
    effects: [
      { metric: 'Protein Activity', effect: 'Modulates target protein function', direction: 'modulate' },
    ],
  };
};

// Mini organ diagram component
const MiniOrganDiagram: React.FC<{ organs: OrganEffect[] }> = ({ organs }) => {
  const organMap = new Map(organs.map(o => [o.organ, o]));

  const getOrganColor = (organ: OrganId) => {
    const effect = organMap.get(organ);
    if (!effect) return { fill: 'fill-gray-200 dark:fill-gray-700', stroke: 'stroke-gray-300 dark:stroke-gray-600' };
    switch (effect.effectType) {
      case 'therapeutic':
        return { fill: 'fill-green-400/50 dark:fill-green-500/40', stroke: 'stroke-green-500 dark:stroke-green-400' };
      case 'adverse':
        return { fill: 'fill-red-400/50 dark:fill-red-500/40', stroke: 'stroke-red-500 dark:stroke-red-400' };
      default:
        return { fill: 'fill-yellow-400/50 dark:fill-yellow-500/40', stroke: 'stroke-yellow-500 dark:stroke-yellow-400' };
    }
  };

  return (
    <div className="flex items-start gap-4">
      {/* SVG Body Diagram */}
      <svg viewBox="0 0 120 180" className="w-24 h-36 flex-shrink-0">
        {/* Head outline */}
        <ellipse cx="60" cy="22" rx="18" ry="18" className="fill-gray-100 dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" strokeWidth="1" />

        {/* Brain */}
        <ellipse cx="60" cy="20" rx="12" ry="10" className={clsx(getOrganColor('brain').fill, getOrganColor('brain').stroke, 'stroke-2 transition-colors')} />

        {/* Neck */}
        <rect x="54" y="38" width="12" height="10" className="fill-gray-100 dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" strokeWidth="1" />

        {/* Torso */}
        <path d="M30 48 Q30 46 40 46 L80 46 Q90 46 90 48 L90 120 Q90 125 80 125 L40 125 Q30 125 30 120 Z" className="fill-gray-100 dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" strokeWidth="1" />

        {/* Lungs */}
        <ellipse cx="45" cy="65" rx="10" ry="14" className={clsx(getOrganColor('lungs').fill, getOrganColor('lungs').stroke, 'stroke-2 transition-colors')} />
        <ellipse cx="75" cy="65" rx="10" ry="14" className={clsx(getOrganColor('lungs').fill, getOrganColor('lungs').stroke, 'stroke-2 transition-colors')} />

        {/* Heart */}
        <ellipse cx="60" cy="68" rx="8" ry="8" className={clsx(getOrganColor('heart').fill, getOrganColor('heart').stroke, 'stroke-2 transition-colors')} />

        {/* Liver */}
        <ellipse cx="48" cy="88" rx="12" ry="8" className={clsx(getOrganColor('liver').fill, getOrganColor('liver').stroke, 'stroke-2 transition-colors')} />

        {/* Stomach */}
        <ellipse cx="70" cy="92" rx="10" ry="7" className={clsx(getOrganColor('stomach').fill, getOrganColor('stomach').stroke, 'stroke-2 transition-colors')} />

        {/* Kidneys */}
        <ellipse cx="42" cy="105" rx="6" ry="8" className={clsx(getOrganColor('kidneys').fill, getOrganColor('kidneys').stroke, 'stroke-2 transition-colors')} />
        <ellipse cx="78" cy="105" rx="6" ry="8" className={clsx(getOrganColor('kidneys').fill, getOrganColor('kidneys').stroke, 'stroke-2 transition-colors')} />

        {/* Legs for joints */}
        <path d="M40 125 L38 165 L35 170 L45 170 L43 165 L50 125" className="fill-gray-100 dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" strokeWidth="1" />
        <path d="M80 125 L82 165 L85 170 L75 170 L77 165 L70 125" className="fill-gray-100 dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" strokeWidth="1" />

        {/* Joints (knees) */}
        <circle cx="40" cy="145" r="5" className={clsx(getOrganColor('joints').fill, getOrganColor('joints').stroke, 'stroke-2 transition-colors')} />
        <circle cx="80" cy="145" r="5" className={clsx(getOrganColor('joints').fill, getOrganColor('joints').stroke, 'stroke-2 transition-colors')} />

        {/* Blood indicator (small circle) */}
        {organMap.has('blood') && (
          <circle cx="100" cy="68" r="6" className={clsx(getOrganColor('blood').fill, getOrganColor('blood').stroke, 'stroke-2 transition-colors')} />
        )}
      </svg>

      {/* Organ Legend */}
      <div className="flex-1 space-y-1.5">
        {organs.map((organ, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className={clsx(
              'w-2.5 h-2.5 rounded-full flex-shrink-0',
              organ.effectType === 'therapeutic' && 'bg-green-500',
              organ.effectType === 'adverse' && 'bg-red-500',
              organ.effectType === 'neutral' && 'bg-yellow-500'
            )} />
            <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{organ.organ}:</span>
            <span className="text-gray-500 dark:text-gray-400">{organ.label}</span>
          </div>
        ))}
        <div className="pt-2 flex gap-3 text-[10px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Therapeutic</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Neutral</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Caution</span>
        </div>
      </div>
    </div>
  );
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

                  {/* Affected Organs Visualization */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Affected Organs
                    </h5>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                      <MiniOrganDiagram organs={bodyEffects.organs} />
                    </div>
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
