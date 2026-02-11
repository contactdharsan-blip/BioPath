import React, { useState } from 'react';
import { Card } from '../common/Card';
import clsx from 'clsx';

interface PersonalizedInteractionsTabProps {
  compoundName: string;
  personalized_interactions?: PersonalizedInteraction[];
}

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

const getSeverityColor = (severity: string) => {
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

const getSeverityBadgeColor = (severity: string) => {
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

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'major':
      return '🔴';
    case 'moderate':
      return '🟡';
    case 'minor':
      return '🔵';
    default:
      return '🟢';
  }
};

const getEvidenceBadge = (level: string) => {
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

export const PersonalizedInteractionsTab: React.FC<PersonalizedInteractionsTabProps> = ({
  compoundName,
  personalized_interactions = [],
}) => {
  const [expandedMed, setExpandedMed] = useState<string | null>(null);

  // Group interactions by severity for overview
  const majorCount = personalized_interactions.filter((i) => i.severity === 'major').length;
  const moderateCount = personalized_interactions.filter((i) => i.severity === 'moderate').length;
  const minorCount = personalized_interactions.filter((i) => i.severity === 'minor').length;
  const noneCount = personalized_interactions.filter((i) => i.severity === 'none').length;

  return (
    <Card className="animate-slide-up space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            Interactions with Your Medications
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            How {compoundName} may interact with your current medications
          </p>
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4">
          {majorCount > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{majorCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Major</div>
            </div>
          )}
          {moderateCount > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{moderateCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Moderate</div>
            </div>
          )}
          {minorCount > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{minorCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Minor</div>
            </div>
          )}
          {noneCount > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">✓</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Safe ({noneCount})</div>
            </div>
          )}
        </div>
      </div>

      {/* Interactions List */}
      <div className="space-y-3">
        {personalized_interactions.length === 0 ? (
          <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
            <p className="text-lg font-medium text-green-900 dark:text-green-300">✓ No Known Interactions</p>
            <p className="text-sm text-green-800 dark:text-green-400 mt-2">
              Based on available data, {compoundName} does not have known interactions with your medications.
            </p>
          </div>
        ) : (
          personalized_interactions.map((interaction, index) => (
            <div
              key={index}
              className={clsx(
                'border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md',
                getSeverityColor(interaction.severity)
              )}
              onClick={() =>
                setExpandedMed(expandedMed === interaction.medication_name ? null : interaction.medication_name)
              }
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-xl mt-1">{getSeverityIcon(interaction.severity)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {interaction.medication_name}
                      </h4>
                      <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', getSeverityBadgeColor(interaction.severity))}>
                        {interaction.severity.charAt(0).toUpperCase() + interaction.severity.slice(1)}
                      </span>
                      <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', getEvidenceBadge(interaction.evidence_level).color)}>
                        {getEvidenceBadge(interaction.evidence_level).text}
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
          ))
        )}
      </div>

      {/* Warning Box */}
      {majorCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">
            ⚠️ Important Safety Notice
          </p>
          <p className="text-sm text-red-800 dark:text-red-400">
            Major interactions detected. <strong>Consult your healthcare provider immediately</strong> before using this
            substance in combination with your medications.
          </p>
        </div>
      )}

      {/* General Disclaimer */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Disclaimer:</strong> This information is for educational purposes only and should not be considered medical advice.
          Always consult with your healthcare provider or pharmacist before combining any substances with your medications.
          Interactions depend on dose, timing, individual metabolism, and other factors not captured here.
        </p>
      </div>
    </Card>
  );
};
