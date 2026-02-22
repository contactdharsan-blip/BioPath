import React, { useState } from 'react';
import { Card } from '../common/Card';
import type { BodyImpactReport } from '../../api/types';
import { formatNumber } from '../../utils/formatters';

interface SummaryCardProps {
  report: BodyImpactReport;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ report }) => {
  const { final_summary, known_targets, pathways } = report;
  const [expandedTargets, setExpandedTargets] = useState(false);

  const allResults = [...known_targets, ...pathways];
  const averageConfidence = allResults.length > 0
    ? allResults.reduce((sum, item) => sum + (item.confidence_score || 0), 0) / allResults.length
    : 0;

  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return { label: 'High', color: 'text-green-400' };
    if (score >= 0.6) return { label: 'Good', color: 'text-blue-400' };
    if (score >= 0.4) return { label: 'Moderate', color: 'text-yellow-400' };
    return { label: 'Low', color: 'text-slate-400' };
  };

  const confidenceInfo = getConfidenceLevel(averageConfidence);

  const measuredTargets = known_targets.filter(t => !t.is_predicted);
  const predictedTargets = known_targets.filter(t => t.is_predicted);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card
          className="text-center !p-3 sm:!p-5"
          onClick={() => final_summary.total_targets_predicted > 0 && setExpandedTargets(!expandedTargets)}
        >
          <div className="text-2xl sm:text-3xl font-bold text-primary-400">
            {final_summary.total_targets_measured}
            {final_summary.total_targets_predicted > 0 && (
              <span className="text-slate-500 text-lg sm:text-2xl"> +{final_summary.total_targets_predicted}</span>
            )}
          </div>
          <div className="text-xs sm:text-sm text-slate-400 mt-1">
            Target{(final_summary.total_targets_measured + final_summary.total_targets_predicted) > 1 ? 's' : ''}
          </div>
        </Card>

        <Card className="text-center !p-3 sm:!p-5">
          <div className="text-2xl sm:text-3xl font-bold text-primary-400">
            {final_summary.total_pathways_affected}
          </div>
          <div className="text-xs sm:text-sm text-slate-400 mt-1">
            Pathway{final_summary.total_pathways_affected > 1 ? 's' : ''}
          </div>
        </Card>

        <Card className="text-center !p-3 sm:!p-5">
          <div className={`text-2xl sm:text-3xl font-bold ${confidenceInfo.color}`}>
            {formatNumber(averageConfidence * 100, 0)}%
          </div>
          <div className="text-xs sm:text-sm text-slate-400 mt-1">
            <span className={confidenceInfo.color}>{confidenceInfo.label}</span>
          </div>
        </Card>
      </div>

      {/* Expanded Targets Breakdown */}
      {expandedTargets && final_summary.total_targets_predicted > 0 && (
        <Card className="animate-slide-down space-y-4">
          <h4 className="font-semibold text-slate-200 text-sm">Target Breakdown</h4>

          {measuredTargets.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Measured ({measuredTargets.length})
              </h5>
              <div className="space-y-1.5">
                {measuredTargets.map((target) => (
                  <div key={target.target_id} className="p-2.5 bg-green-500/5 border border-green-500/10 rounded-xl">
                    <p className="text-sm font-medium text-slate-200">{target.target_name}</p>
                    <p className="text-xs text-slate-500">{target.organism} • {target.target_type}</p>
                    {target.confidence_score && (
                      <p className="text-xs text-green-400 mt-0.5">
                        {Math.round(target.confidence_score * 100)}% confidence
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {predictedTargets.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Predicted ({predictedTargets.length})
              </h5>
              <div className="space-y-1.5">
                {predictedTargets.map((target) => (
                  <div key={target.target_id} className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                    <p className="text-sm font-medium text-slate-200">{target.target_name}</p>
                    <p className="text-xs text-slate-500">{target.organism} • {target.target_type}</p>
                    {target.confidence_score && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {Math.round(target.confidence_score * 100)}% confidence
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
