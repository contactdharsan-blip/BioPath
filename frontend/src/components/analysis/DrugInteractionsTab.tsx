import React, { useState } from 'react';
import { Card } from '../common/Card';
import type { TargetEvidence, PathwayMatch } from '../../api/types';
import clsx from 'clsx';

interface PersonalizedInteraction {
  medication_name: string;
  severity: 'major' | 'moderate' | 'minor' | 'none';
  mechanism: string;
  clinical_effect?: string;
  recommendation: string;
  evidence_level: 'established' | 'theoretical' | 'predicted';
  shared_targets?: string[];
  shared_pathways?: string[];
}

interface DrugInteractionsTabProps {
  targets: TargetEvidence[];
  pathways: PathwayMatch[];
  compoundName: string;
  personalized_interactions?: PersonalizedInteraction[];
}

type InteractionSeverity = 'major' | 'moderate' | 'minor';
type EvidenceLevel = 'established' | 'theoretical' | 'case-reports';

interface DrugInteraction {
  drugClass: string;
  examples: string[];
  interactionType: string;
  severity: InteractionSeverity;
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
  evidenceLevel: EvidenceLevel;
  references: string[];
}

// Map targets to potential drug interactions based on mechanism
function getDrugInteractions(targets: TargetEvidence[], pathways: PathwayMatch[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  const addedInteractions = new Set<string>();

  const addInteraction = (interaction: DrugInteraction) => {
    if (!addedInteractions.has(interaction.drugClass)) {
      interactions.push(interaction);
      addedInteractions.add(interaction.drugClass);
    }
  };

  for (const target of targets) {
    const targetLower = target.target_name.toLowerCase();

    // COX inhibitor interactions
    if (targetLower.includes('cyclooxygenase') || targetLower.includes('prostaglandin') ||
        target.target_id === 'P23219' || target.target_id === 'P35354') {

      addInteraction({
        drugClass: 'Anticoagulants (Blood Thinners)',
        examples: ['Warfarin (Coumadin)', 'Heparin', 'Enoxaparin (Lovenox)'],
        interactionType: 'Pharmacodynamic',
        severity: 'major',
        mechanism: 'Both COX inhibitors and anticoagulants affect hemostasis through different mechanisms. COX inhibition reduces platelet aggregation while anticoagulants prevent clot formation.',
        clinicalEffect: 'Significantly increased risk of bleeding, including gastrointestinal bleeding and hemorrhagic stroke.',
        recommendation: 'Avoid combination if possible. If necessary, use lowest effective doses and monitor closely for signs of bleeding. Consider gastroprotective agents.',
        evidenceLevel: 'established',
        references: [
          'Lanas A, et al. Am J Gastroenterol. 2006;101(4):701-10',
          'García Rodríguez LA, et al. Circulation. 2011;123(21):2226-35',
          'FDA Drug Safety Communication: NSAIDs and Anticoagulants'
        ]
      });

      addInteraction({
        drugClass: 'Other NSAIDs',
        examples: ['Aspirin', 'Naproxen (Aleve)', 'Diclofenac', 'Celecoxib'],
        interactionType: 'Pharmacodynamic',
        severity: 'major',
        mechanism: 'Additive inhibition of cyclooxygenase enzymes throughout the body.',
        clinicalEffect: 'Increased risk of gastrointestinal ulceration, bleeding, and cardiovascular events without additional therapeutic benefit.',
        recommendation: 'Avoid concurrent use of multiple NSAIDs. Choose one NSAID at the lowest effective dose.',
        evidenceLevel: 'established',
        references: [
          'Antman EM, et al. Circulation. 2007;115(12):1634-42',
          'FDA Label: NSAIDs Class Warning'
        ]
      });

      addInteraction({
        drugClass: 'ACE Inhibitors & ARBs',
        examples: ['Lisinopril', 'Enalapril', 'Losartan', 'Valsartan'],
        interactionType: 'Pharmacodynamic',
        severity: 'moderate',
        mechanism: 'NSAIDs reduce prostaglandin-mediated vasodilation and sodium excretion, counteracting the antihypertensive effects of ACE inhibitors and ARBs.',
        clinicalEffect: 'Reduced blood pressure control, potential worsening of heart failure, and increased risk of acute kidney injury (especially with dehydration).',
        recommendation: 'Monitor blood pressure and renal function. Ensure adequate hydration. Consider alternative pain relief if blood pressure becomes difficult to control.',
        evidenceLevel: 'established',
        references: [
          'Fournier JP, et al. BMJ. 2012;344:e458',
          'White WB. Clin Pharmacol Ther. 2007;82(6):676-90'
        ]
      });

      addInteraction({
        drugClass: 'Diuretics',
        examples: ['Furosemide (Lasix)', 'Hydrochlorothiazide', 'Spironolactone'],
        interactionType: 'Pharmacodynamic',
        severity: 'moderate',
        mechanism: 'NSAIDs promote sodium and water retention by inhibiting renal prostaglandins, opposing the natriuretic effect of diuretics.',
        clinicalEffect: 'Reduced diuretic efficacy, fluid retention, potential edema, and worsening of hypertension or heart failure.',
        recommendation: 'Monitor weight, blood pressure, and signs of fluid retention. May need to adjust diuretic dosing.',
        evidenceLevel: 'established',
        references: [
          'Brater DC. Clin Pharmacol Ther. 1999;66(6):557-62'
        ]
      });

      addInteraction({
        drugClass: 'SSRIs & SNRIs (Antidepressants)',
        examples: ['Sertraline (Zoloft)', 'Fluoxetine (Prozac)', 'Venlafaxine (Effexor)'],
        interactionType: 'Pharmacodynamic',
        severity: 'moderate',
        mechanism: 'SSRIs deplete platelet serotonin, impairing platelet aggregation. Combined with NSAID-induced COX inhibition, bleeding risk increases.',
        clinicalEffect: 'Approximately 2-3 fold increased risk of upper gastrointestinal bleeding.',
        recommendation: 'Consider gastroprotective therapy (PPI) if combination is necessary. Monitor for signs of bleeding.',
        evidenceLevel: 'established',
        references: [
          'Loke YK, et al. Aliment Pharmacol Ther. 2008;27(1):31-40',
          'de Abajo FJ, et al. BMJ. 1999;319(7217):1106-9'
        ]
      });

      addInteraction({
        drugClass: 'Lithium',
        examples: ['Lithium carbonate (Lithobid)', 'Lithium citrate'],
        interactionType: 'Pharmacokinetic',
        severity: 'major',
        mechanism: 'NSAIDs reduce renal lithium clearance by inhibiting prostaglandin-mediated renal blood flow and sodium excretion.',
        clinicalEffect: 'Increased lithium serum levels by 15-30%, potentially causing lithium toxicity (tremor, confusion, cardiac effects).',
        recommendation: 'Avoid if possible. If necessary, reduce lithium dose by 25-50% and monitor lithium levels closely. Watch for signs of toxicity.',
        evidenceLevel: 'established',
        references: [
          'Phelan KM, et al. Ann Pharmacother. 2003;37(3):346-51',
          'Ragheb M. J Clin Psychiatry. 1990;51(5):197-200'
        ]
      });

      addInteraction({
        drugClass: 'Methotrexate',
        examples: ['Methotrexate (Trexall, Rheumatrex)'],
        interactionType: 'Pharmacokinetic',
        severity: 'major',
        mechanism: 'NSAIDs reduce renal clearance of methotrexate and may displace it from protein binding sites.',
        clinicalEffect: 'Elevated methotrexate levels leading to bone marrow suppression, hepatotoxicity, and mucositis.',
        recommendation: 'Avoid with high-dose methotrexate. With low-dose methotrexate (rheumatoid arthritis), use caution and monitor blood counts.',
        evidenceLevel: 'established',
        references: [
          'Skeith KJ, et al. Clin Pharmacol Ther. 1997;62(5):516-26',
          'Frenia ML, Long KS. Pharmacotherapy. 1992;12(4):305-9'
        ]
      });

      addInteraction({
        drugClass: 'Corticosteroids',
        examples: ['Prednisone', 'Dexamethasone', 'Hydrocortisone'],
        interactionType: 'Pharmacodynamic',
        severity: 'moderate',
        mechanism: 'Both drug classes can damage the gastrointestinal mucosa, and corticosteroids may mask symptoms of GI complications.',
        clinicalEffect: 'Increased risk of GI ulceration and bleeding. Corticosteroids may delay wound healing.',
        recommendation: 'Use gastroprotective therapy (PPI or misoprostol) if combination is needed. Limit duration of concurrent use.',
        evidenceLevel: 'established',
        references: [
          'Piper JM, et al. Ann Intern Med. 1991;114(9):735-40'
        ]
      });
    }

    // CYP450 interactions
    if (targetLower.includes('cytochrome') || targetLower.includes('cyp')) {
      addInteraction({
        drugClass: 'CYP450-Metabolized Drugs',
        examples: ['Phenytoin', 'Warfarin', 'Theophylline', 'Certain statins'],
        interactionType: 'Pharmacokinetic',
        severity: 'moderate',
        mechanism: 'Inhibition or induction of cytochrome P450 enzymes alters the metabolism of drugs processed by the same pathway.',
        clinicalEffect: 'May increase or decrease blood levels of affected medications, altering their efficacy or causing toxicity.',
        recommendation: 'Review all medications for potential CYP450 interactions. Monitor drug levels where applicable.',
        evidenceLevel: 'established',
        references: [
          'Flockhart DA. Drug Interactions: Cytochrome P450 Drug Interaction Table. Indiana University School of Medicine',
          'Zanger UM, Schwab M. Pharmacol Rev. 2013;65(4):1199-1214'
        ]
      });
    }

    // Kinase inhibitors
    if (targetLower.includes('kinase')) {
      addInteraction({
        drugClass: 'Tyrosine Kinase Inhibitors',
        examples: ['Imatinib (Gleevec)', 'Gefitinib', 'Erlotinib'],
        interactionType: 'Pharmacodynamic',
        severity: 'moderate',
        mechanism: 'Potential additive effects on kinase inhibition pathways.',
        clinicalEffect: 'May enhance or interfere with kinase inhibitor therapy effects.',
        recommendation: 'Consult oncologist. Monitor for enhanced side effects.',
        evidenceLevel: 'theoretical',
        references: [
          'Drug interaction databases (Lexicomp, Micromedex)'
        ]
      });
    }
  }

  // Check pathways for additional interactions
  for (const pathway of pathways) {
    const pathwayLower = pathway.pathway_name.toLowerCase();

    if (pathwayLower.includes('platelet') || pathwayLower.includes('coagulation')) {
      addInteraction({
        drugClass: 'Antiplatelet Agents',
        examples: ['Clopidogrel (Plavix)', 'Prasugrel', 'Ticagrelor'],
        interactionType: 'Pharmacodynamic',
        severity: 'major',
        mechanism: 'Additive inhibition of platelet function through different mechanisms.',
        clinicalEffect: 'Significantly increased bleeding risk, particularly gastrointestinal bleeding.',
        recommendation: 'Use combination only when clearly indicated (e.g., post-cardiac stent). Add gastroprotection.',
        evidenceLevel: 'established',
        references: [
          'Bhatt DL, et al. JAMA. 2008;300(22):2620-2',
          'Abraham NS, et al. Circulation. 2010;122(12):1183-9'
        ]
      });
    }

    if (pathwayLower.includes('serotonin') || pathwayLower.includes('dopamine')) {
      addInteraction({
        drugClass: 'Serotonergic Drugs',
        examples: ['Tramadol', 'Triptans', 'MAOIs', 'St. John\'s Wort'],
        interactionType: 'Pharmacodynamic',
        severity: 'moderate',
        mechanism: 'Additive effects on serotonin pathways.',
        clinicalEffect: 'Potential for serotonin syndrome (agitation, hyperthermia, tremor, hyperreflexia).',
        recommendation: 'Avoid combining multiple serotonergic agents. Monitor for signs of serotonin syndrome.',
        evidenceLevel: 'case-reports',
        references: [
          'Boyer EW, Shannon M. N Engl J Med. 2005;352(11):1112-20'
        ]
      });
    }
  }

  // Sort by severity
  const severityOrder: Record<InteractionSeverity, number> = { major: 0, moderate: 1, minor: 2 };
  return interactions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

const SeverityIcon: React.FC<{ severity: InteractionSeverity }> = ({ severity }) => {
  const config = {
    major: { color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
    moderate: { color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    minor: { color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  };
  const c = config[severity];

  return (
    <div className={clsx('p-2 rounded-full', c.bg)}>
      <svg className={clsx('w-5 h-5', c.color)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {severity === 'major' && (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        )}
        {severity === 'moderate' && (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        )}
        {severity === 'minor' && (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        )}
      </svg>
    </div>
  );
};

const EvidenceBadge: React.FC<{ level: EvidenceLevel }> = ({ level }) => {
  const config = {
    established: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Established' },
    'case-reports': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: 'Case Reports' },
    theoretical: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-300', label: 'Theoretical' },
  };
  const c = config[level];

  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', c.bg, c.text)}>
      {c.label} Evidence
    </span>
  );
};

const getPersonalizedSeverityColor = (severity: string) => {
  switch (severity) {
    case 'major':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'moderate':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    case 'minor':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    default:
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  }
};

const getPersonalizedSeverityBadgeColor = (severity: string) => {
  switch (severity) {
    case 'major':
      return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
    case 'moderate':
      return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
    case 'minor':
      return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
    default:
      return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
  }
};

const getPersonalizedEvidenceBadge = (level: string) => {
  switch (level) {
    case 'established':
      return { text: 'Established', color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' };
    case 'theoretical':
      return { text: 'Theoretical', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' };
    case 'predicted':
      return { text: 'Predicted', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' };
    default:
      return { text: 'Unknown', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' };
  }
};

export const DrugInteractionsTab: React.FC<DrugInteractionsTabProps> = ({ targets, pathways, compoundName, personalized_interactions = [] }) => {
  const [expandedMed, setExpandedMed] = useState<string | null>(null);
  const [expandedInteraction, setExpandedInteraction] = useState<Set<number>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<InteractionSeverity | 'all'>('all');

  const interactions = getDrugInteractions(targets, pathways);

  const filteredInteractions = filterSeverity === 'all'
    ? interactions
    : interactions.filter(i => i.severity === filterSeverity);

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedInteraction);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedInteraction(newExpanded);
  };

  const expandAll = () => {
    setExpandedInteraction(new Set(filteredInteractions.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedInteraction(new Set());
  };

  const severityCounts = {
    major: interactions.filter(i => i.severity === 'major').length,
    moderate: interactions.filter(i => i.severity === 'moderate').length,
    minor: interactions.filter(i => i.severity === 'minor').length,
  };

  // Personalized interactions summary
  const personalizedMajorCount = personalized_interactions.filter((i) => i.severity === 'major').length;
  const personalizedModerateCount = personalized_interactions.filter((i) => i.severity === 'moderate').length;
  const personalizedMinorCount = personalized_interactions.filter((i) => i.severity === 'minor').length;

  return (
    <div className="animate-slide-up space-y-6">
      {/* Section 1: Personalized Interactions (Your Medications) */}
      {personalized_interactions.length > 0 && (
        <Card>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Interactions with Your Medications
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  How {compoundName} may interact with your current medications
                </p>
              </div>

              {/* Summary Stats */}
              <div className="flex gap-4">
                {personalizedMajorCount > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{personalizedMajorCount}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Major</div>
                  </div>
                )}
                {personalizedModerateCount > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{personalizedModerateCount}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Moderate</div>
                  </div>
                )}
                {personalizedMinorCount > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{personalizedMinorCount}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Minor</div>
                  </div>
                )}
              </div>
            </div>

            {/* Interactions List */}
            <div className="space-y-3">
              {personalized_interactions.map((interaction, index) => (
                <div
                  key={index}
                  className={clsx(
                    'border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md',
                    getPersonalizedSeverityColor(interaction.severity)
                  )}
                  onClick={() =>
                    setExpandedMed(expandedMed === interaction.medication_name ? null : interaction.medication_name)
                  }
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {interaction.medication_name}
                          </h4>
                          <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', getPersonalizedSeverityBadgeColor(interaction.severity))}>
                            {interaction.severity.charAt(0).toUpperCase() + interaction.severity.slice(1)}
                          </span>
                          <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', getPersonalizedEvidenceBadge(interaction.evidence_level).color)}>
                            {getPersonalizedEvidenceBadge(interaction.evidence_level).text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {interaction.mechanism}
                        </p>
                      </div>
                    </div>
                    <svg
                      className={clsx('w-5 h-5 transition-transform flex-shrink-0', expandedMed === interaction.medication_name && 'rotate-180')}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* Expanded Details */}
                  {expandedMed === interaction.medication_name && (
                    <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-3">
                      {interaction.clinical_effect && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Clinical Effect:
                          </h5>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{interaction.clinical_effect}</p>
                        </div>
                      )}

                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          Recommendation:
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{interaction.recommendation}</p>
                      </div>

                      {(interaction.shared_targets?.length ?? 0) > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Shared Targets:
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {interaction.shared_targets?.map((target, i) => (
                              <span
                                key={i}
                                className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-300 dark:border-gray-600"
                              >
                                {target}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(interaction.shared_pathways?.length ?? 0) > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Affected Pathways:
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {interaction.shared_pathways?.map((pathway, i) => (
                              <span
                                key={i}
                                className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-300 dark:border-gray-600"
                              >
                                {pathway}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Warning Box */}
            {personalizedMajorCount > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">
                  ⚠️ Important Safety Notice
                </p>
                <p className="text-sm text-red-800 dark:text-red-400">
                  Major interactions detected. <strong>Consult your healthcare provider immediately</strong> before using this substance in combination with your medications.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Section 2: General Drug Interactions */}
      <Card className="animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Drug Interactions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Potential interactions with {compoundName}
          </p>
        </div>

        {/* Severity Summary */}
        <div className="flex gap-3 flex-shrink-0">
          <div className="text-center">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">{severityCounts.major}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Major</span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{severityCounts.moderate}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Moderate</span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{severityCounts.minor}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Minor</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterSeverity('all')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filterSeverity === 'all'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            All ({interactions.length})
          </button>
          <button
            onClick={() => setFilterSeverity('major')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filterSeverity === 'major'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            Major
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
        </div>

        {/* Expand/Collapse All */}
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Interactions List */}
      <div className="space-y-3">
        {filteredInteractions.map((interaction, index) => {
          const isExpanded = expandedInteraction.has(index);

          return (
            <div
              key={index}
              className={clsx(
                'border rounded-xl overflow-hidden transition-all duration-200',
                interaction.severity === 'major' && 'border-red-200 dark:border-red-800',
                interaction.severity === 'moderate' && 'border-amber-200 dark:border-amber-800',
                interaction.severity === 'minor' && 'border-blue-200 dark:border-blue-800',
                isExpanded && 'shadow-lg'
              )}
            >
              {/* Header - Collapsible */}
              <div
                onClick={() => toggleExpand(index)}
                className={clsx(
                  'p-4 cursor-pointer transition-colors',
                  'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <div className="flex items-center gap-4">
                  <SeverityIcon severity={interaction.severity} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{interaction.drugClass}</h4>
                      <EvidenceBadge level={interaction.evidenceLevel} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      Examples: {interaction.examples.join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-semibold uppercase',
                      interaction.severity === 'major' && 'bg-red-500 text-white',
                      interaction.severity === 'moderate' && 'bg-amber-500 text-white',
                      interaction.severity === 'minor' && 'bg-blue-500 text-white'
                    )}>
                      {interaction.severity}
                    </span>

                    <button className={clsx('p-1 transition-transform duration-200', isExpanded && 'rotate-180')}>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="pt-4 space-y-4">
                    {/* Drug Examples */}
                    <div>
                      <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">AFFECTED DRUGS</h5>
                      <div className="flex flex-wrap gap-2">
                        {interaction.examples.map((drug, i) => (
                          <span key={i} className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300">
                            {drug}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Mechanism */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                        <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            MECHANISM
                          </span>
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{interaction.mechanism}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-500 dark:text-gray-400">
                          {interaction.interactionType}
                        </span>
                      </div>

                      {/* Clinical Effect */}
                      <div className={clsx(
                        'rounded-lg p-3 border',
                        interaction.severity === 'major' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                        interaction.severity === 'moderate' && 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
                        interaction.severity === 'minor' && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      )}>
                        <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            CLINICAL EFFECT
                          </span>
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{interaction.clinicalEffect}</p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <h5 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          RECOMMENDATION
                        </span>
                      </h5>
                      <p className="text-sm text-green-800 dark:text-green-200">{interaction.recommendation}</p>
                    </div>

                    {/* References */}
                    <div>
                      <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          REFERENCES
                        </span>
                      </h5>
                      <ul className="space-y-1">
                        {interaction.references.map((ref, i) => (
                          <li key={i} className="text-xs text-gray-500 dark:text-gray-400 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
                            {ref}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredInteractions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No drug interactions found for the selected filter.
          </div>
        )}
      </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Important:</strong> This list is not exhaustive. Drug interactions depend on individual patient factors, dosages, and duration of use.
            Always consult a pharmacist or healthcare provider for personalized drug interaction checking. Clinical references are provided for educational purposes.
          </p>
        </div>
      </Card>

      {/* General Disclaimer */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Disclaimer:</strong> This information is for educational purposes only and should not be considered medical advice.
          Always consult with your healthcare provider or pharmacist before combining any substances with your medications.
          Interactions depend on dose, timing, individual metabolism, and other factors not captured here.
        </p>
      </div>
    </div>
  );
};
