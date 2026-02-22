import React, { useState } from 'react';
import { Card } from './Card';
import clsx from 'clsx';

interface LegendProps {
  compact?: boolean;
}

export const Legend: React.FC<LegendProps> = ({ compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={clsx(compact && '!p-3 sm:!p-4')}>
      <div className="space-y-4">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-sm font-semibold text-slate-200">
            Legend
          </h3>
          <svg
            className={clsx(
              'w-4 h-4 text-slate-400 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="space-y-4 animate-content-fade">
            {/* Confidence Tiers */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Confidence Tiers
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></div>
                  <p className="text-xs text-slate-300">
                    <span className="font-medium">Tier A</span> - Measured bioassay data (95%+)
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0"></div>
                  <p className="text-xs text-slate-300">
                    <span className="font-medium">Tier B</span> - Curated mechanisms (70-80%)
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 flex-shrink-0"></div>
                  <p className="text-xs text-slate-300">
                    <span className="font-medium">Tier C</span> - ML predictions (30-85%)
                  </p>
                </div>
              </div>
            </div>

            {/* Interaction Severity */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Drug Interaction Severity
              </h4>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/15 text-red-400">
                  Major
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/15 text-yellow-400">
                  Moderate
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/15 text-blue-400">
                  Minor
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/15 text-green-400">
                  None
                </span>
              </div>
            </div>

            {/* Confidence Levels */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Confidence Levels
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 text-xs font-bold text-green-400">80%+</div>
                  <span className="text-xs text-slate-400">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 text-xs font-bold text-blue-400">60%+</div>
                  <span className="text-xs text-slate-400">Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 text-xs font-bold text-yellow-400">40%+</div>
                  <span className="text-xs text-slate-400">Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 text-xs font-bold text-slate-500">&lt;40%</div>
                  <span className="text-xs text-slate-400">Low</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
