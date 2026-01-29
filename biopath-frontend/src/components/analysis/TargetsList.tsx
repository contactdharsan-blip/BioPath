import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import type { TargetEvidence } from '../../api/types';
import { formatPChEMBL, getPotencyDescription } from '../../utils/formatters';

interface TargetsListProps {
  targets: TargetEvidence[];
}

export const TargetsList: React.FC<TargetsListProps> = ({ targets }) => {
  const [sortBy, setSortBy] = useState<'name' | 'potency'>('potency');

  const sortedTargets = [...targets].sort((a, b) => {
    if (sortBy === 'name') {
      return a.target_name.localeCompare(b.target_name);
    }
    // Sort by potency (pChEMBL value, higher = stronger)
    return (b.pchembl_value || 0) - (a.pchembl_value || 0);
  });

  return (
    <Card className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Known Targets</h3>
          <p className="text-sm text-gray-500 mt-1">
            {targets.length} target{targets.length !== 1 ? 's' : ''} with measured potency
          </p>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'potency')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="potency">Sort by Potency</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      <div className="space-y-3">
        {sortedTargets.map((target, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors duration-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{target.target_name}</h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  {target.target_id} {target.organism && `• ${target.organism}`}
                </p>
              </div>
              <Badge tier={target.confidence_tier}>
                Tier {target.confidence_tier}
              </Badge>
            </div>

            {target.pchembl_value && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    pChEMBL: {formatPChEMBL(target.pchembl_value)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getPotencyDescription(target.pchembl_value)} Potency
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                    style={{ width: `${(target.pchembl_value / 10) * 100}%` }}
                  />
                </div>
                {target.standard_type && target.standard_value && target.standard_units && (
                  <p className="text-xs text-gray-500 mt-1">
                    {target.standard_type}: {target.standard_value} {target.standard_units}
                  </p>
                )}
              </div>
            )}

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span>Source: {target.source}</span>
              {target.assay_references?.length > 0 && (
                <span>• {target.assay_references.length} assay{target.assay_references.length > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        ))}

        {targets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No known targets found for this compound.
          </div>
        )}
      </div>
    </Card>
  );
};
