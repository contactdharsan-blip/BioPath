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

/**
 * Remove citations from Reactome summation text.
 * Strips patterns like [1], (Smith et al., 2020), doi references, etc.
 */
function removeCitations(text: string): string {
  let cleaned = text;
  // Remove bracketed references like [1], [2,3], [1-3]
  cleaned = cleaned.replace(/\s*\[[\d,\s\-–]+\]/g, '');
  // Remove parenthetical author citations like (Smith et al., 2020)
  cleaned = cleaned.replace(/\s*\([A-Z][a-zA-Z]+\s+et\s+al\.?,?\s*\d{4}[a-z]?\)/g, '');
  // Remove (Author & Author, 2020) style
  cleaned = cleaned.replace(/\s*\([A-Z][a-zA-Z]+\s*(?:&|and)\s*[A-Z][a-zA-Z]+,?\s*\d{4}[a-z]?\)/g, '');
  // Remove DOI references
  cleaned = cleaned.replace(/\s*doi:\s*\S+/gi, '');
  // Remove PMID references
  cleaned = cleaned.replace(/\s*PMID:\s*\d+/gi, '');
  // Clean up extra spaces and trailing punctuation
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  // Remove trailing period after citation removal if it creates double periods
  cleaned = cleaned.replace(/\.\./g, '.');
  return cleaned;
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
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs',
            system === primarySystem
              ? 'bg-primary-500/15 text-primary-300 font-medium'
              : 'bg-white/5 text-slate-400'
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
  <div className="flex items-center justify-center py-6">
    <div className="relative w-6 h-6">
      <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 animate-spin"></div>
    </div>
    <span className="ml-3 text-xs text-slate-500">Loading Reactome data...</span>
  </div>
);

/** Collapsible Reactome Description */
const ReactomeDescription: React.FC<{ summation: string }> = ({ summation }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cleaned = removeCitations(summation);
  const isLong = cleaned.length > 200;
  const displayText = isLong && !isExpanded ? cleaned.slice(0, 200) + '...' : cleaned;

  return (
    <div className="bg-primary-500/5 border border-primary-500/10 rounded-xl p-3 sm:p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <h5 className="font-medium text-slate-300 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Reactome Description
          </span>
          {isLong && (
            <svg
              className={clsx(
                'w-4 h-4 text-slate-500 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </h5>
      </button>
      <p className="text-sm text-slate-400 leading-relaxed">
        {displayText}
      </p>
      <div className="mt-2 text-xs text-slate-600">
        Source: Reactome Database
      </div>
    </div>
  );
};

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
    <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
      {/* Reactome Official Description - Collapsible with citations removed */}
      {reactomeData?.summation && (
        <ReactomeDescription summation={reactomeData.summation} />
      )}

      {/* Error message */}
      {error && (
        <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/10">
          <p className="text-sm text-amber-400">{error}</p>
        </div>
      )}

      {/* Health Description */}
      <div className={clsx('p-3 sm:p-4 rounded-xl border', impactColors.bg, impactColors.border)}>
        <div className="flex items-start gap-3">
          <span className="text-xl">{healthInfo.icon}</span>
          <div className="flex-1 min-w-0">
            <h5 className="font-medium text-slate-200 text-sm mb-1">
              Health Relevance
            </h5>
            <p className={clsx('text-sm', impactColors.text)}>
              {healthInfo.healthDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Physiological Role & Clinical Relevance */}
      <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-white/[0.03] rounded-xl p-3">
          <h5 className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Physiological Role
          </h5>
          <p className="text-sm text-slate-300">
            {healthInfo.physiologicalRole}
          </p>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-3">
          <h5 className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Clinical Relevance
          </h5>
          <p className="text-sm text-slate-300">
            {healthInfo.clinicalRelevance}
          </p>
        </div>
      </div>

      {/* Pathway Participants from Reactome */}
      {reactomeData && reactomeData.participants.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
          <h5 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            Participants ({reactomeData.total_participants})
            {reactomeData.has_more_participants && (
              <span className="text-slate-600 normal-case">
                showing {reactomeData.participants.length}
              </span>
            )}
          </h5>
          <div className="flex flex-wrap gap-1">
            {reactomeData.participants.map((participant: string, idx: number) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-lg text-xs font-mono"
              >
                {participant}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related Pathways from Reactome */}
      {reactomeData && reactomeData.related_pathways.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
          <h5 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Related Pathways ({reactomeData.related_pathway_count})
          </h5>
          <div className="flex flex-wrap gap-1">
            {reactomeData.related_pathways.map((pathwayId, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-mono"
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
          <h5 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Related Conditions
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {healthInfo.relatedConditions.map((condition, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-full text-xs text-slate-300"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Affected Body Systems */}
      <div>
        <h5 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
          Body Systems
        </h5>
        <BodySystemPills systems={healthInfo.bodySystems} primarySystem={healthInfo.primarySystem} />
      </div>

      {/* Pathway Technical Info */}
      <div className="bg-white/[0.02] rounded-xl p-3">
        <h5 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
          Technical Details
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">ID</span>
            <span className="text-slate-300 font-mono">{pathway.pathway_id}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Species</span>
            <span className="text-slate-300">{pathway.pathway_species}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Measured</span>
            <span className="text-slate-300">{pathway.measured_targets_count}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Predicted</span>
            <span className="text-slate-300">{pathway.predicted_targets_count}</span>
          </div>
        </div>
        {pathway.matched_targets.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/5">
            <span className="text-slate-500 block text-xs mb-1">Matched Targets</span>
            <div className="flex flex-wrap gap-1">
              {pathway.matched_targets.map((target, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-primary-500/10 text-primary-400 rounded text-xs font-mono"
                >
                  {target}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Original Explanation */}
      {pathway.explanation && (
        <div className="text-xs text-slate-500 italic bg-white/[0.02] rounded-xl p-3 border border-white/5">
          <span className="font-medium text-slate-400 not-italic">Note: </span>
          {pathway.explanation}
        </div>
      )}

      {/* Data Source */}
      <div className="text-xs text-slate-600 pt-2 border-t border-white/5">
        Data from Reactome (reactome.org)
      </div>
    </div>
  );
};

export const PathwaysList: React.FC<PathwaysListProps> = ({ pathways }) => {
  const [expandedPathway, setExpandedPathway] = useState<number | null>(null);

  const sortedPathways = [...pathways].sort((a, b) => b.impact_score - a.impact_score);

  const toggleExpand = (index: number) => {
    setExpandedPathway(expandedPathway === index ? null : index);
  };

  return (
    <Card className="animate-slide-up">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Affected Pathways</h3>
        <p className="text-xs text-slate-500 mt-1">
          {pathways.length} pathway{pathways.length !== 1 ? 's' : ''} found. Tap to expand.
        </p>
      </div>

      {/* Pathway Cards */}
      <div className="space-y-2 sm:space-y-3">
        {sortedPathways.map((pathway, index) => {
          const healthInfo = getPathwayHealthInfo(pathway.pathway_name);
          const isExpanded = expandedPathway === index;

          return (
            <div
              key={index}
              className={clsx(
                'border rounded-xl transition-all duration-200 overflow-hidden',
                isExpanded
                  ? 'border-primary-500/30 bg-white/[0.03]'
                  : 'border-white/5 hover:border-white/10'
              )}
            >
              {/* Pathway Header */}
              <div
                onClick={() => toggleExpand(index)}
                className="p-3 sm:p-4 cursor-pointer hover:bg-white/[0.02] transition-colors active:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg flex-shrink-0">{healthInfo.icon}</span>
                      <h4 className="font-semibold text-slate-200 text-sm sm:text-base truncate">
                        {pathway.pathway_name}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <HealthImpactBadge impact={healthInfo.healthImpact} />
                      <Badge tier={pathway.confidence_tier}>
                        Tier {pathway.confidence_tier}
                      </Badge>
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        {getBodySystemIcon(healthInfo.primarySystem)} {getBodySystemDisplayName(healthInfo.primarySystem)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">
                      {healthInfo.healthDescription}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-bold text-slate-200">
                        {formatImpactScore(pathway.impact_score)}
                      </span>
                      <span className="text-xs text-slate-500 block">Impact</span>
                    </div>

                    <svg
                      className={clsx(
                        'w-4 h-4 text-slate-500 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Impact Bar */}
                <div className="mt-2">
                  <div className="w-full bg-white/5 rounded-full h-1">
                    <div
                      className="h-1 rounded-full transition-all duration-300"
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
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <PathwayDetail pathway={pathway} isExpanded={isExpanded} />
                </div>
              )}
            </div>
          );
        })}

        {pathways.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            No pathways found for this compound.
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-slate-500">Beneficial</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-500">Mixed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-500">Caution</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-500">Neutral</span>
          </span>
        </div>
      </div>
    </Card>
  );
};
