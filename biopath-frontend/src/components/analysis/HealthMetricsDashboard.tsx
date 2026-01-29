import React from 'react';
import clsx from 'clsx';
import { Card } from '../common/Card';
import type { HealthMetric } from '../../utils/bodyEffectsMapper';

interface HealthMetricsDashboardProps {
  metrics: HealthMetric[];
}

const DirectionIcon: React.FC<{ direction: HealthMetric['direction'] }> = ({ direction }) => {
  if (direction === 'increase') {
    return (
      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </div>
    );
  }
  if (direction === 'decrease') {
    return (
      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    </div>
  );
};

const EvidenceDots: React.FC<{ level: HealthMetric['evidence'] }> = ({ level }) => {
  const filled = level === 'strong' ? 5 : level === 'moderate' ? 3 : 1;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((dot) => (
        <div
          key={dot}
          className={clsx(
            'w-1.5 h-1.5 rounded-full transition-colors',
            dot <= filled
              ? 'bg-primary-500 dark:bg-primary-400'
              : 'bg-gray-200 dark:bg-gray-600'
          )}
        />
      ))}
      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 capitalize">
        {level} evidence
      </span>
    </div>
  );
};

const categoryColors: Record<string, string> = {
  inflammatory: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  cardiovascular: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  neurological: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  metabolic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gastrointestinal: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  respiratory: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  immune: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  musculoskeletal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cellular: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export const HealthMetricsDashboard: React.FC<HealthMetricsDashboardProps> = ({ metrics }) => {
  if (metrics.length === 0) {
    return (
      <Card className="p-8 text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">No health metrics data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Health Metrics
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {metrics.length} metrics identified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-4" hoverable>
            <div className="flex items-start gap-3">
              <DirectionIcon direction={metric.direction} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {metric.name}
                  </h4>
                  <span className={clsx(
                    'px-2 py-0.5 text-xs rounded-full whitespace-nowrap',
                    categoryColors[metric.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  )}>
                    {metric.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {metric.description}
                </p>
                <EvidenceDots level={metric.evidence} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <span>Decrease</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
          <span>Increase</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
          <span>Stable/Variable</span>
        </div>
      </div>
    </div>
  );
};
