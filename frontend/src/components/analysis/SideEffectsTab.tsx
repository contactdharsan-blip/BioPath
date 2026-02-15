import React, { useState } from 'react';
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
  bodySystem: string;
  mechanismBasis: string;
  managementTips: string[];
  whenToSeekHelp?: string;
}

// Map targets to potential side effects based on mechanism of action
function getSideEffectsFromTargets(targets: TargetEvidence[], pathways: PathwayMatch[]): SideEffect[] {
  const effects: SideEffect[] = [];
  const addedEffects = new Set<string>();

  const addEffect = (effect: SideEffect) => {
    if (!addedEffects.has(effect.name)) {
      effects.push(effect);
      addedEffects.add(effect.name);
    }
  };

  for (const target of targets) {
    const targetLower = target.target_name.toLowerCase();

    // COX inhibitors side effects
    if (targetLower.includes('cyclooxygenase') || targetLower.includes('prostaglandin') ||
        target.target_id === 'P23219' || target.target_id === 'P35354') {
      addEffect({
        name: 'Gastrointestinal Irritation',
        description: 'Stomach discomfort, heartburn, or nausea due to reduced protective prostaglandins in the stomach lining.',
        severity: 'moderate',
        frequency: 'common',
        bodySystem: 'Digestive',
        mechanismBasis: 'COX-1 inhibition reduces gastric mucosal protection',
        managementTips: [
          'Take with food or milk',
          'Use lowest effective dose',
          'Consider enteric-coated formulations',
          'Avoid alcohol consumption'
        ],
        whenToSeekHelp: 'Black or bloody stools, severe stomach pain, vomiting blood'
      });

      addEffect({
        name: 'Increased Bleeding Risk',
        description: 'Reduced ability for blood to clot due to effects on platelet function.',
        severity: 'moderate',
        frequency: 'uncommon',
        bodySystem: 'Cardiovascular',
        mechanismBasis: 'COX-1 inhibition reduces thromboxane A2 production in platelets',
        managementTips: [
          'Inform healthcare providers before surgery',
          'Avoid combining with other blood thinners',
          'Watch for unusual bruising'
        ],
        whenToSeekHelp: 'Unusual bleeding, prolonged bleeding from cuts, severe bruising'
      });

      addEffect({
        name: 'Kidney Function Changes',
        description: 'May affect kidney blood flow, especially in those with existing kidney conditions.',
        severity: 'moderate',
        frequency: 'uncommon',
        bodySystem: 'Urinary',
        mechanismBasis: 'Prostaglandins help maintain renal blood flow',
        managementTips: [
          'Stay well hydrated',
          'Avoid prolonged use',
          'Regular monitoring if using long-term'
        ],
        whenToSeekHelp: 'Decreased urination, swelling in legs/feet, unusual fatigue'
      });

      addEffect({
        name: 'Cardiovascular Risk',
        description: 'Long-term use may slightly increase risk of heart problems in susceptible individuals.',
        severity: 'serious',
        frequency: 'rare',
        bodySystem: 'Cardiovascular',
        mechanismBasis: 'COX-2 selective inhibition may affect vascular prostacyclin balance',
        managementTips: [
          'Use lowest dose for shortest time',
          'Discuss cardiovascular history with doctor',
          'Consider alternatives if high risk'
        ],
        whenToSeekHelp: 'Chest pain, shortness of breath, sudden weakness on one side'
      });
    }

    // Lipoxygenase effects
    if (targetLower.includes('lipoxygenase') || target.target_id === 'P09917') {
      addEffect({
        name: 'Altered Immune Response',
        description: 'Changes in leukotriene production may affect inflammatory and immune responses.',
        severity: 'mild',
        frequency: 'uncommon',
        bodySystem: 'Immune',
        mechanismBasis: 'Leukotrienes are important immune signaling molecules',
        managementTips: [
          'Monitor for signs of infection',
          'Report unusual symptoms'
        ]
      });
    }

    // CYP450 effects
    if (targetLower.includes('cytochrome') || targetLower.includes('cyp')) {
      addEffect({
        name: 'Drug Metabolism Changes',
        description: 'May alter how the liver processes other medications, affecting their effectiveness or safety.',
        severity: 'moderate',
        frequency: 'common',
        bodySystem: 'Hepatic',
        mechanismBasis: 'CYP450 enzymes metabolize many medications',
        managementTips: [
          'Inform all healthcare providers about all medications',
          'Watch for increased or decreased effects of other drugs',
          'Consider drug interaction checking'
        ],
        whenToSeekHelp: 'Unexpected medication side effects, signs of medication toxicity'
      });
    }

    // Kinase effects
    if (targetLower.includes('kinase')) {
      addEffect({
        name: 'Cell Signaling Alterations',
        description: 'May affect cellular growth and signaling pathways.',
        severity: 'mild',
        frequency: 'uncommon',
        bodySystem: 'Cellular',
        mechanismBasis: 'Kinases regulate many cellular processes',
        managementTips: [
          'Monitor for unusual symptoms',
          'Follow recommended dosing'
        ]
      });
    }

    // Channel/receptor effects
    if (targetLower.includes('channel') || targetLower.includes('receptor')) {
      addEffect({
        name: 'Nervous System Effects',
        description: 'May cause mild drowsiness, dizziness, or changes in mood in some individuals.',
        severity: 'mild',
        frequency: 'uncommon',
        bodySystem: 'Nervous',
        mechanismBasis: 'Ion channels and receptors mediate neural signaling',
        managementTips: [
          'Avoid driving if drowsy',
          'Avoid alcohol',
          'Start with lower doses'
        ]
      });
    }
  }

  // Check pathways for additional effects
  for (const pathway of pathways) {
    const pathwayLower = pathway.pathway_name.toLowerCase();

    // Coagulation and platelet pathways
    if (pathwayLower.includes('platelet') || pathwayLower.includes('coagulation')) {
      addEffect({
        name: 'Bleeding Tendency',
        description: 'Affects blood clotting mechanisms, may increase bleeding risk.',
        severity: 'moderate',
        frequency: 'uncommon',
        bodySystem: 'Hematologic',
        mechanismBasis: 'Pathway involvement in coagulation cascade',
        managementTips: [
          'Avoid with anticoagulants unless advised',
          'Inform surgeons and dentists',
          'Watch for unusual bleeding'
        ],
        whenToSeekHelp: 'Prolonged bleeding, blood in urine or stool'
      });
    }

    // Inflammation pathways
    if (pathwayLower.includes('inflammat') || pathwayLower.includes('nfkb') || pathwayLower.includes('tnf')) {
      addEffect({
        name: 'Immunosuppression',
        description: 'May suppress inflammatory and immune responses, affecting ability to fight infections.',
        severity: 'moderate',
        frequency: 'uncommon',
        bodySystem: 'Immune',
        mechanismBasis: 'Inhibition of inflammatory signaling pathways',
        managementTips: [
          'Avoid live vaccines during use',
          'Monitor for signs of infection',
          'Maintain good hygiene practices'
        ],
        whenToSeekHelp: 'Persistent fever, unusual infections, delayed wound healing'
      });
    }

    // Histamine and allergic pathways
    if (pathwayLower.includes('histamine') || pathwayLower.includes('allergic')) {
      addEffect({
        name: 'Allergic Reactions',
        description: 'Some individuals may experience allergic responses.',
        severity: 'moderate',
        frequency: 'rare',
        bodySystem: 'Immune',
        mechanismBasis: 'Individual sensitivity and immune pathway involvement',
        managementTips: [
          'Start with small dose to test tolerance',
          'Have antihistamines available',
          'Know signs of allergic reaction'
        ],
        whenToSeekHelp: 'Difficulty breathing, swelling of face/throat, severe rash'
      });
    }

    // Serotonin and dopamine pathways
    if (pathwayLower.includes('serotonin') || pathwayLower.includes('dopamine') || pathwayLower.includes('monoamine')) {
      addEffect({
        name: 'Neurochemical Effects',
        description: 'May affect mood, sleep patterns, and emotional well-being.',
        severity: 'mild',
        frequency: 'uncommon',
        bodySystem: 'Nervous',
        mechanismBasis: 'Alterations in neurotransmitter levels and signaling',
        managementTips: [
          'Monitor mood and emotional changes',
          'Maintain regular sleep schedule',
          'Avoid sudden discontinuation'
        ],
        whenToSeekHelp: 'Severe mood changes, suicidal thoughts, persistent insomnia'
      });
    }

    // Glucose and metabolic pathways
    if (pathwayLower.includes('glucose') || pathwayLower.includes('insulin') || pathwayLower.includes('metabolis')) {
      addEffect({
        name: 'Metabolic Changes',
        description: 'May affect blood glucose levels and overall metabolic function.',
        severity: 'moderate',
        frequency: 'uncommon',
        bodySystem: 'Endocrine',
        mechanismBasis: 'Pathway involvement in glucose homeostasis and metabolic regulation',
        managementTips: [
          'Monitor blood glucose if diabetic',
          'Maintain consistent meal timing',
          'Report significant weight changes'
        ],
        whenToSeekHelp: 'Extreme hunger/thirst, unusual weight changes, blurred vision'
      });
    }

    // Cardiovascular and vascular pathways
    if (pathwayLower.includes('hypertens') || pathwayLower.includes('vascular') || pathwayLower.includes('cardiovasc')) {
      addEffect({
        name: 'Blood Pressure Changes',
        description: 'May affect blood pressure regulation.',
        severity: 'moderate',
        frequency: 'uncommon',
        bodySystem: 'Cardiovascular',
        mechanismBasis: 'Vascular tone and blood pressure regulation pathway involvement',
        managementTips: [
          'Monitor blood pressure regularly',
          'Report significant changes to healthcare provider',
          'Limit salt intake'
        ],
        whenToSeekHelp: 'Severe headaches, chest pain, dizziness, shortness of breath'
      });
    }

    // Renal and electrolyte pathways
    if (pathwayLower.includes('renal') || pathwayLower.includes('electrolyte') || pathwayLower.includes('sodium') || pathwayLower.includes('potassium')) {
      addEffect({
        name: 'Electrolyte Imbalance',
        description: 'May affect kidney function and electrolyte balance.',
        severity: 'moderate',
        frequency: 'uncommon',
        bodySystem: 'Urinary',
        mechanismBasis: 'Renal function and electrolyte handling pathway involvement',
        managementTips: [
          'Monitor urine output',
          'Maintain proper hydration',
          'Periodic electrolyte monitoring if long-term use'
        ],
        whenToSeekHelp: 'Decreased urination, muscle weakness, irregular heartbeat'
      });
    }

    // Hepatic and detoxification pathways
    if (pathwayLower.includes('hepatic') || pathwayLower.includes('liver') || pathwayLower.includes('glutathione') || pathwayLower.includes('detox')) {
      addEffect({
        name: 'Liver Function Changes',
        description: 'May affect liver function and detoxification capacity.',
        severity: 'moderate',
        frequency: 'uncommon',
        bodySystem: 'Hepatic',
        mechanismBasis: 'Hepatic metabolism and detoxification pathway involvement',
        managementTips: [
          'Avoid alcohol consumption',
          'Monitor liver enzymes if recommended',
          'Report jaundice or dark urine'
        ],
        whenToSeekHelp: 'Yellowing of skin/eyes, dark urine, light-colored stools, abdominal pain'
      });
    }

    // Bone and mineral pathways
    if (pathwayLower.includes('bone') || pathwayLower.includes('calcium') || pathwayLower.includes('mineral') || pathwayLower.includes('osteo')) {
      addEffect({
        name: 'Bone and Mineral Changes',
        description: 'May affect bone density and mineral metabolism.',
        severity: 'mild',
        frequency: 'uncommon',
        bodySystem: 'Musculoskeletal',
        mechanismBasis: 'Bone remodeling and mineral metabolism pathway involvement',
        managementTips: [
          'Ensure adequate calcium and vitamin D intake',
          'Weight-bearing exercise',
          'Bone density monitoring if long-term use'
        ],
        whenToSeekHelp: 'Severe bone pain, frequent fractures, muscle weakness'
      });
    }

    // Hypersensitivity and autoimmune pathways
    if (pathwayLower.includes('hypersensit') || pathwayLower.includes('autoimmune') || pathwayLower.includes('immune response')) {
      addEffect({
        name: 'Immune System Dysregulation',
        description: 'May trigger or exacerbate autoimmune or hypersensitivity reactions.',
        severity: 'serious',
        frequency: 'rare',
        bodySystem: 'Immune',
        mechanismBasis: 'Autoimmune or hypersensitivity pathway activation',
        managementTips: [
          'Monitor for unusual symptoms',
          'Report joint pain, persistent fatigue',
          'Inform healthcare provider of autoimmune history'
        ],
        whenToSeekHelp: 'Joint pain with swelling, persistent fever, widespread rash, severe fatigue'
      });
    }
  }

  // Sort by severity then frequency
  const severityOrder: Record<SeverityLevel, number> = { serious: 0, moderate: 1, mild: 2 };
  const frequencyOrder: Record<FrequencyLevel, number> = { common: 0, uncommon: 1, rare: 2 };

  return effects.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return frequencyOrder[a.frequency] - frequencyOrder[b.frequency];
  });
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

  const sideEffects = getSideEffectsFromTargets(targets, pathways);

  const filteredEffects = filterSeverity === 'all'
    ? sideEffects
    : sideEffects.filter(e => e.severity === filterSeverity);

  const severityCounts = {
    serious: sideEffects.filter(e => e.severity === 'serious').length,
    moderate: sideEffects.filter(e => e.severity === 'moderate').length,
    mild: sideEffects.filter(e => e.severity === 'mild').length,
  };

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
            Based on {compoundName}'s mechanism of action
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
                      <SeverityBadge severity={effect.severity} />
                      <FrequencyBadge frequency={effect.frequency} />
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
                      <p className="text-sm text-gray-900 dark:text-white">{effect.bodySystem}</p>
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-3 mb-2">MECHANISM BASIS</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{effect.mechanismBasis}</p>
                    </div>

                    {/* Management Tips */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">MANAGEMENT TIPS</h5>
                      <ul className="space-y-1">
                        {effect.managementTips.map((tip, i) => (
                          <li key={i} className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* When to Seek Help */}
                  {effect.whenToSeekHelp && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        WHEN TO SEEK MEDICAL HELP
                      </h5>
                      <p className="text-sm text-red-800 dark:text-red-200">{effect.whenToSeekHelp}</p>
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
