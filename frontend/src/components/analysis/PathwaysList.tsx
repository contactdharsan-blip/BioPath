import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import type { PathwayMatch } from '../../api/types';
import { reactomeAPI, type ReactomeFullPathway } from '../../api/endpoints';
import { formatImpactScore } from '../../utils/formatters';
import {
  getPathwayHealthInfo,
  getBodySystemDisplayName,
  getHealthImpactColors,
  getBodySystemIcon,
  type HealthImpactType,
} from '../../utils/pathwayHealthMapper';
import clsx from 'clsx';

interface PathwaysListProps {
  pathways: PathwayMatch[];
}

// Health Impact Badge component
const HealthImpactBadge: React.FC<{ impact: HealthImpactType }> = ({ impact }) => {
  const colors = getHealthImpactColors(impact);
  const labels: Record<HealthImpactType, string> = {
    beneficial: 'Beneficial',
    caution: 'Use Caution',
    mixed: 'Mixed Effects',
    neutral: 'Neutral',
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
      colors.bg, colors.text
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', colors.dot)} />
      {labels[impact]}
    </span>
  );
};

// Body System Pills component
const BodySystemPills: React.FC<{ systems: string[]; primarySystem: string }> = ({ systems, primarySystem }) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {systems.map((system, idx) => (
        <span
          key={idx}
          className={clsx(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs',
            system === primarySystem
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          )}
        >
          <span>{getBodySystemIcon(system as any)}</span>
          {getBodySystemDisplayName(system as any)}
        </span>
      ))}
    </div>
  );
};

// Loading Spinner
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Loading Reactome data...</span>
  </div>
);

// Expanded Pathway Detail component with Reactome API integration
const PathwayDetail: React.FC<{ pathway: PathwayMatch; isExpanded: boolean }> = ({ pathway, isExpanded }) => {
  const [reactomeData, setReactomeData] = useState<ReactomeFullPathway | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const healthInfo = getPathwayHealthInfo(pathway.pathway_name);
  const impactColors = getHealthImpactColors(healthInfo.healthImpact);

  // Fetch Reactome data when expanded
  useEffect(() => {
    if (isExpanded && !reactomeData && !loading) {
      setLoading(true);
      setError(null);

      reactomeAPI.getFullPathwayInfo(pathway.pathway_id)
        .then(data => {
          setReactomeData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch Reactome data:', err);
          setError('Could not load pathway details from Reactome');
          setLoading(false);
        });
    }
  }, [isExpanded, pathway.pathway_id, reactomeData, loading]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      {/* Reactome Official Description */}
      {reactomeData?.summation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Reactome Description
          </h5>
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            {reactomeData.summation}
          </p>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            Source: Reactome Database
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
          <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
        </div>
      )}

      {/* Health Description */}
      <div className={clsx('p-4 rounded-lg border', impactColors.bg, impactColors.border)}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{healthInfo.icon}</span>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
              Health Relevance Analysis
            </h5>
            <p className={clsx('text-sm', impactColors.text)}>
              {healthInfo.healthDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Physiological Role & Clinical Relevance */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Physiological Role
          </h5>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {healthInfo.physiologicalRole}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Clinical Relevance
          </h5>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {healthInfo.clinicalRelevance}
          </p>
        </div>
      </div>

      {/* Pathway Participants from Reactome */}
      {reactomeData && reactomeData.participants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Pathway Participants ({reactomeData.total_participants} proteins)
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {reactomeData.participants.map((participant, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-mono"
              >
                {participant}
              </span>
            ))}
            {reactomeData.has_more_participants && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded text-xs">
                +{reactomeData.total_participants - reactomeData.participants.length} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Related Pathways from Reactome */}
      {reactomeData && reactomeData.related_pathways.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Related Pathways ({reactomeData.related_pathway_count})
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {reactomeData.related_pathways.map((pathwayId, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-mono"
              >
                {pathwayId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related Conditions */}
      {healthInfo.relatedConditions.length > 0 && (
        <div>
          <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Related Health Conditions
          </h5>
          <div className="flex flex-wrap gap-2">
            {healthInfo.relatedConditions.map((condition, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-xs text-gray-700 dark:text-gray-300"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Affected Body Systems */}
      <div>
        <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Affected Body Systems
        </h5>
        <BodySystemPills systems={healthInfo.bodySystems} primarySystem={healthInfo.primarySystem} />
      </div>

      {/* Pathway Technical Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Technical Details
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Pathway ID</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs">{pathway.pathway_id}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Species</span>
            <span className="text-gray-900 dark:text-white">{pathway.pathway_species}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Measured Targets</span>
            <span className="text-gray-900 dark:text-white">{pathway.measured_targets_count}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Predicted Targets</span>
            <span className="text-gray-900 dark:text-white">{pathway.predicted_targets_count}</span>
          </div>
        </div>
        {pathway.matched_targets.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400 block mb-1">Matched Targets</span>
            <div className="flex flex-wrap gap-1">
              {pathway.matched_targets.map((target, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs font-mono"
                >
                  {target}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Original Explanation if available */}
      {pathway.explanation && (
        <div className="text-sm text-gray-600 dark:text-gray-400 italic bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
          <span className="font-medium text-gray-700 dark:text-gray-300">Analysis Note: </span>
          {pathway.explanation}
        </div>
      )}

      {/* Data Source Attribution */}
      <div className="text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
        Pathway data from Reactome (reactome.org) • Health relevance analysis based on mechanism of action
      </div>
    </div>
  );
};

export const PathwaysList: React.FC<PathwaysListProps> = ({ pathways }) => {
  const [expandedPathway, setExpandedPathway] = useState<number | null>(null);

  // Sort by impact score (descending)
  const sortedPathways = [...pathways].sort((a, b) => b.impact_score - a.impact_score);

  const toggleExpand = (index: number) => {
    setExpandedPathway(expandedPathway === index ? null : index);
  };

  return (
    <Card className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Affected Pathways</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pathways.length} biological pathway{pathways.length !== 1 ? 's' : ''} affected • Click to load Reactome details
          </p>
        </div>
      </div>


      {/* Pathway Cards */}
      <div className="space-y-4">
          {sortedPathways.map((pathway, index) => {
            const healthInfo = getPathwayHealthInfo(pathway.pathway_name);
            const isExpanded = expandedPathway === index;

            return (
              <div
                key={index}
                className={clsx(
                  'border rounded-xl transition-all duration-200 overflow-hidden',
                  isExpanded
                    ? 'border-primary-300 dark:border-primary-600 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700'
                )}
              >
                {/* Pathway Header - Always Visible */}
                <div
                  onClick={() => toggleExpand(index)}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{healthInfo.icon}</span>
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {pathway.pathway_name}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <HealthImpactBadge impact={healthInfo.healthImpact} />
                        <Badge tier={pathway.confidence_tier}>
                          Tier {pathway.confidence_tier}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getBodySystemIcon(healthInfo.primarySystem)} {getBodySystemDisplayName(healthInfo.primarySystem)}
                        </span>
                      </div>

                      {/* Quick Health Summary */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {healthInfo.healthDescription}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatImpactScore(pathway.impact_score)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">Impact</span>
                      </div>

                      <button
                        className={clsx(
                          'p-1.5 rounded-full transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Impact Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${pathway.impact_score * 100}%`,
                          backgroundColor:
                            pathway.confidence_tier === 'A' ? '#10b981' :
                            pathway.confidence_tier === 'B' ? '#f59e0b' :
                            '#6b7280'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Detail Section */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <PathwayDetail pathway={pathway} isExpanded={isExpanded} />
                  </div>
                )}
              </div>
            );
          })}

          {pathways.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No pathways found for this compound.
            </div>
          )}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Health Impact Legend</h5>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-gray-600 dark:text-gray-300">Beneficial - Generally positive health effects</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-300">Mixed - Both benefits and considerations</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-gray-600 dark:text-gray-300">Caution - Monitor for potential effects</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
            <span className="text-gray-600 dark:text-gray-300">Neutral - Standard biological process</span>
          </span>
        </div>
      </div>
    </Card>
  );
};
