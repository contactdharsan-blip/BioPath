import React from 'react';
import { Card } from '../common/Card';
import type { BodyImpactReport } from '../../api/types';
import { formatNumber } from '../../utils/formatters';

interface SummaryCardProps {
  report: BodyImpactReport;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ report }) => {
  const { final_summary } = report;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="text-center">
        <div className="text-3xl font-bold text-primary-600">
          {final_summary.total_targets_measured}
          {final_summary.total_targets_predicted > 0 && (
            <span className="text-gray-400 text-2xl"> +{final_summary.total_targets_predicted}</span>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {final_summary.total_targets_measured > 0 ? 'Measured' : ''}{' '}
          {final_summary.total_targets_predicted > 0 ? '& Predicted ' : ''}
          Target{(final_summary.total_targets_measured + final_summary.total_targets_predicted) > 1 ? 's' : ''}
        </div>
      </Card>

      <Card className="text-center">
        <div className="text-3xl font-bold text-primary-600">
          {final_summary.total_pathways_affected}
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Biological Pathway{final_summary.total_pathways_affected > 1 ? 's' : ''} Affected
        </div>
      </Card>

      <Card className="text-center">
        <div className="text-3xl font-bold text-primary-600">
          {formatNumber(report.total_analysis_duration_seconds || 0, 1)}s
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Analysis Duration
        </div>
      </Card>
    </div>
  );
};
