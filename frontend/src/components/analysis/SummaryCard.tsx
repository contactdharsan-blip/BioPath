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

  // Calculate average confidence score
  const allResults = [...known_targets, ...pathways];
  const averageConfidence = allResults.length > 0
    ? allResults.reduce((sum, item) => sum + (item.confidence_score || 0), 0) / allResults.length
    : 0;

  // Get confidence level label and color
  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return { label: 'High', color: 'text-green-600 dark:text-green-400' };
    if (score >= 0.6) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    if (score >= 0.4) return { label: 'Moderate', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'Low', color: 'text-gray-600 dark:text-gray-400' };
  };

  const confidenceInfo = getConfidenceLevel(averageConfidence);

  // Separate measured and predicted targets
  const measuredTargets = known_targets.filter(t => !t.is_predicted);
  const predictedTargets = known_targets.filter(t => t.is_predicted);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => final_summary.total_targets_predicted > 0 && setExpandedTargets(!expandedTargets)}>
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {final_summary.total_targets_measured}
            {final_summary.total_targets_predicted > 0 && (
              <span className="text-gray-400 dark:text-gray-500 text-2xl cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"> +{final_summary.total_targets_predicted}</span>
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {final_summary.total_targets_measured > 0 ? 'Measured' : ''}{' '}
            {final_summary.total_targets_predicted > 0 ? '& Predicted ' : ''}
            Target{(final_summary.total_targets_measured + final_summary.total_targets_predicted) > 1 ? 's' : ''}
          </div>
          {final_summary.total_targets_predicted > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Click to expand</p>
          )}
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {final_summary.total_pathways_affected}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Biological Pathway{final_summary.total_pathways_affected > 1 ? 's' : ''} Affected
          </div>
        </Card>

        <Card className="text-center">
          <div className={`text-3xl font-bold ${confidenceInfo.color}`}>
            {formatNumber(averageConfidence * 100, 0)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Average Confidence <span className={confidenceInfo.color}>{confidenceInfo.label}</span>
          </div>
        </Card>
      </div>

      {/* Expanded Targets Breakdown */}
      {expandedTargets && final_summary.total_targets_predicted > 0 && (
        <Card className="animate-slide-down space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Target Breakdown</h4>

          {/* Measured Targets */}
          {measuredTargets.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Measured Targets ({measuredTargets.length})
              </h5>
              <div className="space-y-2">
                {measuredTargets.map((target) => (
                  <div key={target.target_id} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{target.target_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{target.organism} • {target.target_type}</p>
                    {target.confidence_score && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Confidence: {Math.round(target.confidence_score * 100)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predicted Targets */}
          {predictedTargets.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Predicted Targets ({predictedTargets.length})
              </h5>
              <div className="space-y-2">
                {predictedTargets.map((target) => (
                  <div key={target.target_id} className="p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{target.target_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{target.organism} • {target.target_type}</p>
                    {target.confidence_score && (
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        Confidence: {Math.round(target.confidence_score * 100)}%
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
