import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import type { PathwayMatch } from '../../api/types';
import { formatImpactScore } from '../../utils/formatters';

interface PathwaysListProps {
  pathways: PathwayMatch[];
}

export const PathwaysList: React.FC<PathwaysListProps> = ({ pathways }) => {
  // Sort by impact score (descending)
  const sortedPathways = [...pathways].sort((a, b) => b.impact_score - a.impact_score);

  // Prepare data for chart
  const chartData = sortedPathways.slice(0, 10).map((pathway) => ({
    name: pathway.pathway_name.length > 30
      ? pathway.pathway_name.substring(0, 30) + '...'
      : pathway.pathway_name,
    fullName: pathway.pathway_name,
    impact: pathway.impact_score * 100, // Convert to percentage
    tier: pathway.confidence_tier,
  }));

  const getBarColor = (tier: string) => {
    const colors = {
      A: '#10b981', // green
      B: '#f59e0b', // yellow
      C: '#6b7280', // gray
    };
    return colors[tier as keyof typeof colors] || colors.C;
  };

  return (
    <Card className="animate-slide-up">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Affected Pathways</h3>
      <p className="text-sm text-gray-500 mb-6">
        {pathways.length} biological pathway{pathways.length !== 1 ? 's' : ''} affected
      </p>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="mb-8">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="horizontal">
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        <p className="font-medium text-gray-900 text-sm">{data.fullName}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Impact: {data.impact.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Tier {data.tier}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.tier)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed List */}
      <div className="space-y-3">
        {sortedPathways.map((pathway, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors duration-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{pathway.pathway_name}</h4>
                {pathway.pathway_url && (
                  <a
                    href={pathway.pathway_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline mt-1 inline-block"
                  >
                    View on Reactome →
                  </a>
                )}
              </div>
              <Badge tier={pathway.confidence_tier}>
                Tier {pathway.confidence_tier}
              </Badge>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Impact Score: {formatImpactScore(pathway.impact_score)}
                </span>
                <span className="text-xs text-gray-500">
                  {pathway.measured_targets_count} measured
                  {pathway.predicted_targets_count > 0 && ` + ${pathway.predicted_targets_count} predicted`} target{pathway.matched_targets.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300`}
                  style={{
                    width: `${pathway.impact_score * 100}%`,
                    backgroundColor: getBarColor(pathway.confidence_tier),
                  }}
                />
              </div>
            </div>

            {pathway.explanation && (
              <p className="text-sm text-gray-600 mt-3 italic">
                {pathway.explanation}
              </p>
            )}

            <div className="mt-2 text-xs text-gray-500">
              {pathway.pathway_species} • {pathway.pathway_id}
            </div>
          </div>
        ))}

        {pathways.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No pathways found for this compound.
          </div>
        )}
      </div>
    </Card>
  );
};
