import type { TargetEvidence, PathwayMatch } from '../api/types';

// Types for body effects
export type BodySystem = 'brain' | 'heart' | 'lungs' | 'liver' | 'stomach' | 'kidneys' | 'joints' | 'skin' | 'blood';
export type EffectType = 'therapeutic' | 'adverse' | 'neutral';
export type EffectDirection = 'increase' | 'decrease' | 'stable';
export type EvidenceLevel = 'strong' | 'moderate' | 'weak';
export type Severity = 'mild' | 'moderate' | 'severe';

export interface AffectedSystem {
  system: BodySystem;
  effectType: EffectType;
  effects: string[];
}

export interface HealthMetric {
  name: string;
  direction: EffectDirection;
  description: string;
  evidence: EvidenceLevel;
  category: string;
}

export interface SideEffect {
  name: string;
  type: 'therapeutic' | 'adverse';
  severity: Severity;
  description: string;
}

export interface BodyEffectsData {
  affectedSystems: AffectedSystem[];
  healthMetrics: HealthMetric[];
  sideEffects: SideEffect[];
  overallAssessment: 'favorable' | 'neutral' | 'unfavorable';
}

// Target pattern to body system mappings
interface TargetMapping {
  patterns: string[];
  systems: Array<{ system: BodySystem; effectType: EffectType; effect: string }>;
  metrics: HealthMetric[];
  sideEffects: SideEffect[];
}

const TARGET_MAPPINGS: TargetMapping[] = [
  {
    patterns: ['cyclooxygenase', 'cox-1', 'cox-2', 'ptgs1', 'ptgs2'],
    systems: [
      { system: 'stomach', effectType: 'adverse', effect: 'May reduce protective mucus production' },
      { system: 'joints', effectType: 'therapeutic', effect: 'Reduces inflammation and pain' },
      { system: 'heart', effectType: 'neutral', effect: 'Affects platelet aggregation' },
      { system: 'kidneys', effectType: 'neutral', effect: 'May affect renal blood flow' },
    ],
    metrics: [
      { name: 'Inflammation', direction: 'decrease', description: 'Reduces prostaglandin-mediated inflammation', evidence: 'strong', category: 'inflammatory' },
      { name: 'Pain Sensitivity', direction: 'decrease', description: 'Blocks pain signaling pathways', evidence: 'strong', category: 'neurological' },
      { name: 'Fever', direction: 'decrease', description: 'Reduces hypothalamic fever response', evidence: 'strong', category: 'metabolic' },
      { name: 'Platelet Aggregation', direction: 'decrease', description: 'May affect blood clotting', evidence: 'moderate', category: 'cardiovascular' },
    ],
    sideEffects: [
      { name: 'Pain Relief', type: 'therapeutic', severity: 'mild', description: 'Effective reduction in pain and discomfort' },
      { name: 'Anti-inflammatory', type: 'therapeutic', severity: 'mild', description: 'Reduces swelling and inflammation' },
      { name: 'GI Irritation', type: 'adverse', severity: 'moderate', description: 'May cause stomach upset or ulcers with prolonged use' },
      { name: 'Cardiovascular Risk', type: 'adverse', severity: 'moderate', description: 'Potential increased cardiovascular risk with long-term use' },
    ],
  },
  {
    patterns: ['lipoxygenase', 'lox', 'alox', '5-lox', '12-lox', '15-lox'],
    systems: [
      { system: 'lungs', effectType: 'therapeutic', effect: 'May reduce airway inflammation' },
      { system: 'joints', effectType: 'therapeutic', effect: 'Anti-inflammatory effects' },
      { system: 'skin', effectType: 'therapeutic', effect: 'May reduce skin inflammation' },
    ],
    metrics: [
      { name: 'Leukotriene Production', direction: 'decrease', description: 'Reduces inflammatory leukotrienes', evidence: 'moderate', category: 'inflammatory' },
      { name: 'Airway Inflammation', direction: 'decrease', description: 'May improve respiratory function', evidence: 'moderate', category: 'respiratory' },
    ],
    sideEffects: [
      { name: 'Respiratory Support', type: 'therapeutic', severity: 'mild', description: 'May help reduce airway inflammation' },
      { name: 'Anti-inflammatory', type: 'therapeutic', severity: 'mild', description: 'Reduces inflammatory mediators' },
    ],
  },
  {
    patterns: ['cytochrome p450', 'cyp', 'cyp1', 'cyp2', 'cyp3'],
    systems: [
      { system: 'liver', effectType: 'neutral', effect: 'Primary metabolism site' },
    ],
    metrics: [
      { name: 'Drug Metabolism', direction: 'stable', description: 'Affects hepatic drug processing', evidence: 'strong', category: 'metabolic' },
      { name: 'Drug Interactions', direction: 'increase', description: 'May interact with other medications', evidence: 'moderate', category: 'metabolic' },
    ],
    sideEffects: [
      { name: 'Hepatic Processing', type: 'therapeutic', severity: 'mild', description: 'Normal liver metabolism' },
      { name: 'Drug Interactions', type: 'adverse', severity: 'moderate', description: 'Potential interactions with other medications' },
    ],
  },
  {
    patterns: ['kinase', 'tyrosine kinase', 'protein kinase', 'mapk', 'jak', 'src'],
    systems: [
      { system: 'brain', effectType: 'neutral', effect: 'Affects cellular signaling' },
      { system: 'heart', effectType: 'neutral', effect: 'May affect cardiac function' },
      { system: 'blood', effectType: 'neutral', effect: 'Affects immune cell signaling' },
    ],
    metrics: [
      { name: 'Cell Signaling', direction: 'stable', description: 'Modulates intracellular pathways', evidence: 'moderate', category: 'cellular' },
      { name: 'Immune Response', direction: 'stable', description: 'May affect immune cell activity', evidence: 'weak', category: 'immune' },
    ],
    sideEffects: [
      { name: 'Signaling Modulation', type: 'therapeutic', severity: 'mild', description: 'Affects cell communication pathways' },
    ],
  },
  {
    patterns: ['serotonin', '5-ht', 'htr', 'tryptophan hydroxylase'],
    systems: [
      { system: 'brain', effectType: 'therapeutic', effect: 'Affects mood and cognition' },
      { system: 'stomach', effectType: 'neutral', effect: 'May affect GI motility' },
    ],
    metrics: [
      { name: 'Mood', direction: 'increase', description: 'May improve mood and well-being', evidence: 'moderate', category: 'neurological' },
      { name: 'Serotonin Levels', direction: 'increase', description: 'Affects serotonergic signaling', evidence: 'moderate', category: 'neurological' },
    ],
    sideEffects: [
      { name: 'Mood Enhancement', type: 'therapeutic', severity: 'mild', description: 'May improve mood and reduce anxiety' },
      { name: 'GI Effects', type: 'adverse', severity: 'mild', description: 'May cause nausea or digestive changes' },
    ],
  },
  {
    patterns: ['dopamine', 'drd', 'tyrosine hydroxylase', 'dat'],
    systems: [
      { system: 'brain', effectType: 'therapeutic', effect: 'Affects reward and movement' },
    ],
    metrics: [
      { name: 'Dopamine Activity', direction: 'stable', description: 'Modulates dopaminergic signaling', evidence: 'moderate', category: 'neurological' },
      { name: 'Motor Function', direction: 'stable', description: 'May affect movement control', evidence: 'weak', category: 'neurological' },
    ],
    sideEffects: [
      { name: 'Reward Modulation', type: 'therapeutic', severity: 'mild', description: 'Affects pleasure and motivation pathways' },
    ],
  },
  {
    patterns: ['adrenergic', 'adra', 'adrb', 'norepinephrine', 'epinephrine'],
    systems: [
      { system: 'heart', effectType: 'neutral', effect: 'Affects heart rate and contractility' },
      { system: 'lungs', effectType: 'therapeutic', effect: 'May cause bronchodilation' },
      { system: 'blood', effectType: 'neutral', effect: 'Affects blood pressure' },
    ],
    metrics: [
      { name: 'Heart Rate', direction: 'stable', description: 'May affect cardiac rhythm', evidence: 'moderate', category: 'cardiovascular' },
      { name: 'Blood Pressure', direction: 'stable', description: 'May affect vascular tone', evidence: 'moderate', category: 'cardiovascular' },
      { name: 'Bronchodilation', direction: 'increase', description: 'May open airways', evidence: 'moderate', category: 'respiratory' },
    ],
    sideEffects: [
      { name: 'Cardiovascular Effects', type: 'adverse', severity: 'mild', description: 'May affect heart rate or blood pressure' },
      { name: 'Airway Opening', type: 'therapeutic', severity: 'mild', description: 'May improve breathing' },
    ],
  },
  {
    patterns: ['acetylcholinesterase', 'ache', 'cholinergic', 'muscarinic', 'nicotinic'],
    systems: [
      { system: 'brain', effectType: 'therapeutic', effect: 'Affects cognition and memory' },
      { system: 'heart', effectType: 'neutral', effect: 'May affect heart rate' },
      { system: 'stomach', effectType: 'neutral', effect: 'Affects GI motility' },
    ],
    metrics: [
      { name: 'Acetylcholine', direction: 'increase', description: 'Increases cholinergic signaling', evidence: 'moderate', category: 'neurological' },
      { name: 'Cognitive Function', direction: 'increase', description: 'May improve memory and attention', evidence: 'moderate', category: 'neurological' },
    ],
    sideEffects: [
      { name: 'Cognitive Enhancement', type: 'therapeutic', severity: 'mild', description: 'May improve memory and thinking' },
      { name: 'GI Side Effects', type: 'adverse', severity: 'mild', description: 'May cause nausea or diarrhea' },
    ],
  },
  {
    patterns: ['gaba', 'gamma-aminobutyric', 'gabaa', 'gabab'],
    systems: [
      { system: 'brain', effectType: 'therapeutic', effect: 'Calming and sedative effects' },
    ],
    metrics: [
      { name: 'Anxiety', direction: 'decrease', description: 'Reduces anxiety symptoms', evidence: 'strong', category: 'neurological' },
      { name: 'Muscle Tension', direction: 'decrease', description: 'Promotes muscle relaxation', evidence: 'moderate', category: 'musculoskeletal' },
      { name: 'Sedation', direction: 'increase', description: 'May cause drowsiness', evidence: 'strong', category: 'neurological' },
    ],
    sideEffects: [
      { name: 'Anxiety Relief', type: 'therapeutic', severity: 'mild', description: 'Reduces feelings of anxiety' },
      { name: 'Sedation', type: 'adverse', severity: 'moderate', description: 'May cause drowsiness or fatigue' },
    ],
  },
  {
    patterns: ['histamine', 'hrh1', 'hrh2', 'hrh3', 'hrh4'],
    systems: [
      { system: 'brain', effectType: 'neutral', effect: 'Affects alertness' },
      { system: 'stomach', effectType: 'therapeutic', effect: 'Reduces gastric acid' },
      { system: 'skin', effectType: 'therapeutic', effect: 'Reduces allergic reactions' },
      { system: 'lungs', effectType: 'therapeutic', effect: 'Reduces airway constriction' },
    ],
    metrics: [
      { name: 'Allergic Response', direction: 'decrease', description: 'Reduces histamine-mediated reactions', evidence: 'strong', category: 'immune' },
      { name: 'Gastric Acid', direction: 'decrease', description: 'Reduces stomach acid production', evidence: 'strong', category: 'gastrointestinal' },
      { name: 'Alertness', direction: 'decrease', description: 'May cause drowsiness', evidence: 'moderate', category: 'neurological' },
    ],
    sideEffects: [
      { name: 'Allergy Relief', type: 'therapeutic', severity: 'mild', description: 'Reduces allergic symptoms' },
      { name: 'Drowsiness', type: 'adverse', severity: 'mild', description: 'May cause sleepiness' },
    ],
  },
];

// Pathway to body system mappings
const PATHWAY_SYSTEM_MAP: Record<string, BodySystem[]> = {
  'arachidonic acid': ['joints', 'stomach', 'blood'],
  'prostaglandin': ['joints', 'stomach', 'kidneys'],
  'leukotriene': ['lungs', 'skin'],
  'inflammation': ['joints', 'skin', 'blood'],
  'immune': ['blood', 'skin'],
  'cardiac': ['heart'],
  'neurological': ['brain'],
  'hepatic': ['liver'],
  'renal': ['kidneys'],
  'respiratory': ['lungs'],
  'gastrointestinal': ['stomach'],
  'metabolic': ['liver'],
  'platelet': ['blood', 'heart'],
  'coagulation': ['blood'],
  'signal transduction': ['brain', 'heart'],
};

function matchesPattern(text: string, patterns: string[]): boolean {
  const lowerText = text.toLowerCase();
  return patterns.some(pattern => lowerText.includes(pattern.toLowerCase()));
}

function getEvidenceLevel(target: TargetEvidence): EvidenceLevel {
  if (target.confidence_tier === 'A' || (target.pchembl_value && target.pchembl_value >= 7)) {
    return 'strong';
  }
  if (target.confidence_tier === 'B' || (target.pchembl_value && target.pchembl_value >= 5)) {
    return 'moderate';
  }
  return 'weak';
}

export function mapTargetsToBodyEffects(
  targets: TargetEvidence[],
  pathways: PathwayMatch[]
): BodyEffectsData {
  const systemsMap = new Map<BodySystem, { effectType: EffectType; effects: Set<string> }>();
  const metricsMap = new Map<string, HealthMetric>();
  const sideEffectsMap = new Map<string, SideEffect>();

  // Process targets
  for (const target of targets) {
    const targetName = target.target_name.toLowerCase();
    const targetId = target.target_id.toLowerCase();

    for (const mapping of TARGET_MAPPINGS) {
      if (matchesPattern(targetName, mapping.patterns) || matchesPattern(targetId, mapping.patterns)) {
        // Add systems
        for (const sys of mapping.systems) {
          const existing = systemsMap.get(sys.system);
          if (existing) {
            existing.effects.add(sys.effect);
            // Therapeutic takes precedence over neutral, adverse over therapeutic
            if (sys.effectType === 'adverse' || (sys.effectType === 'therapeutic' && existing.effectType === 'neutral')) {
              existing.effectType = sys.effectType;
            }
          } else {
            systemsMap.set(sys.system, { effectType: sys.effectType, effects: new Set([sys.effect]) });
          }
        }

        // Add metrics with evidence from target
        const evidence = getEvidenceLevel(target);
        for (const metric of mapping.metrics) {
          if (!metricsMap.has(metric.name)) {
            metricsMap.set(metric.name, { ...metric, evidence });
          }
        }

        // Add side effects
        for (const effect of mapping.sideEffects) {
          if (!sideEffectsMap.has(effect.name)) {
            sideEffectsMap.set(effect.name, effect);
          }
        }
      }
    }
  }

  // Process pathways to add additional system mappings
  for (const pathway of pathways) {
    const pathwayName = pathway.pathway_name.toLowerCase();

    for (const [keyword, systems] of Object.entries(PATHWAY_SYSTEM_MAP)) {
      if (pathwayName.includes(keyword)) {
        for (const sys of systems) {
          if (!systemsMap.has(sys)) {
            systemsMap.set(sys, { effectType: 'neutral', effects: new Set([`Involved in ${pathway.pathway_name}`]) });
          }
        }
      }
    }
  }

  // Convert maps to arrays
  const affectedSystems: AffectedSystem[] = Array.from(systemsMap.entries()).map(([system, data]) => ({
    system,
    effectType: data.effectType,
    effects: Array.from(data.effects),
  }));

  const healthMetrics: HealthMetric[] = Array.from(metricsMap.values());
  const sideEffects: SideEffect[] = Array.from(sideEffectsMap.values());

  // Calculate overall assessment
  const therapeuticCount = sideEffects.filter(e => e.type === 'therapeutic').length;
  const adverseCount = sideEffects.filter(e => e.type === 'adverse').length;
  const severityScore = sideEffects
    .filter(e => e.type === 'adverse')
    .reduce((sum, e) => sum + (e.severity === 'severe' ? 3 : e.severity === 'moderate' ? 2 : 1), 0);

  let overallAssessment: 'favorable' | 'neutral' | 'unfavorable';
  if (therapeuticCount > adverseCount && severityScore < 4) {
    overallAssessment = 'favorable';
  } else if (adverseCount > therapeuticCount * 2 || severityScore >= 6) {
    overallAssessment = 'unfavorable';
  } else {
    overallAssessment = 'neutral';
  }

  return {
    affectedSystems,
    healthMetrics,
    sideEffects,
    overallAssessment,
  };
}
