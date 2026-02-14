import React, { useState } from 'react';
import { Card } from './Card';
import clsx from 'clsx';

interface LegendProps {
  compact?: boolean;
}

export const Legend: React.FC<LegendProps> = ({ compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={clsx('bg-gray-50 dark:bg-gray-800/50', compact && 'p-4')}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-600 text-gray-900 dark:text-gray-100">
            Legend
          </h3>
          {compact && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          )}
        </div>

        {!compact || isExpanded ? (
          <>
            {/* Confidence Tiers */}
            <div className="space-y-3">
              <h4 className="text-sm font-600 text-gray-900 dark:text-gray-100">
                Confidence Tiers
              </h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Tier A - Measured Data
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Actual bioassay measurements from ChEMBL. Highest confidence (95%+)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Tier B - Curated Data
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Expert-curated mechanisms and pathways. Good confidence (70-80%)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-400 mt-1 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Tier C - Predicted Data
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Machine learning predictions and pattern matching. Lower confidence (30-85%)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Types */}
            <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-sm font-600 text-gray-900 dark:text-gray-100">
                Target Types
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Single Protein
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Individual protein target (most common)
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Protein Complex
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Multi-subunit protein complex
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Gene/Protein Family
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Group of related proteins with similar function
                  </p>
                </div>
              </div>
            </div>

            {/* Interaction Severity */}
            <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-sm font-600 text-gray-900 dark:text-gray-100">
                Drug Interaction Severity
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                    Major
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Significant interaction - avoid concurrent use
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                    Moderate
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Notable interaction - monitor closely
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    Minor
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Mild interaction - minimal clinical impact
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    None
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    No known interactions
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-sm font-600 text-gray-900 dark:text-gray-100">
                Result Confidence Level
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 text-sm font-bold text-white bg-green-600 rounded">
                    80%+
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      High
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Results are reliable and well-supported
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 text-sm font-bold text-white bg-blue-600 rounded">
                    60-80%
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Good
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Results are generally trustworthy
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 text-sm font-bold text-white bg-yellow-600 rounded">
                    40-60%
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Moderate
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Use with caution and verify important findings
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 text-sm font-bold text-white bg-gray-600 rounded">
                    Below 40%
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Low
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Limited confidence - require further validation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Measured vs Predicted */}
            <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-sm font-600 text-gray-900 dark:text-gray-100">
                Measured vs Predicted
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Measured Targets
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Targets tested in actual bioassays with potency values (IC50, Ki, Kd)
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Predicted Targets
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Targets predicted by machine learning or pattern matching without direct bioassay data
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click "Expand" to view all definitions
          </p>
        )}
      </div>
    </Card>
  );
};
