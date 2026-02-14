import React from 'react';
import { Card } from '../common/Card';
import type { BodyImpactReport } from '../../api/types';
import { formatNumber } from '../../utils/formatters';

interface SummaryCardProps {
  report: BodyImpactReport;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ report }) => {
  const { final_summary, known_targets, pathways } = report;

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="text-center">
        <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
          {final_summary.total_targets_measured}
          {final_summary.total_targets_predicted > 0 && (
            <span className="text-gray-400 dark:text-gray-500 text-2xl"> +{final_summary.total_targets_predicted}</span>
          )}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {final_summary.total_targets_measured > 0 ? 'Measured' : ''}{' '}
          {final_summary.total_targets_predicted > 0 ? '& Predicted ' : ''}
          Target{(final_summary.total_targets_measured + final_summary.total_targets_predicted) > 1 ? 's' : ''}
        </div>
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
  );
};
