import React from 'react';
import clsx from 'clsx';
import { Card } from '../common/Card';
import type { SideEffect } from '../../utils/bodyEffectsMapper';

interface SideEffectsProfileProps {
  effects: SideEffect[];
  overallAssessment: 'favorable' | 'neutral' | 'unfavorable';
}

const SeverityBadge: React.FC<{ severity: SideEffect['severity']; type: SideEffect['type'] }> = ({ severity, type }) => {
  const colors = type === 'therapeutic'
    ? {
        mild: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        moderate: 'bg-green-200 text-green-800 dark:bg-green-800/40 dark:text-green-300',
        severe: 'bg-green-300 text-green-900 dark:bg-green-700/50 dark:text-green-200',
      }
    : {
        mild: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        moderate: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        severe: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      };

  return (
    <span className={clsx('px-2 py-0.5 text-xs rounded-full capitalize', colors[severity])}>
      {severity}
    </span>
  );
};

const AssessmentBar: React.FC<{ assessment: SideEffectsProfileProps['overallAssessment']; benefitCount: number; riskCount: number }> = ({
  assessment,
  benefitCount,
  riskCount,
}) => {
  const total = benefitCount + riskCount || 1;
  const benefitPercent = (benefitCount / total) * 100;

  const assessmentConfig = {
    favorable: {
      label: 'Favorable',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500',
    },
    neutral: {
      label: 'Balanced',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500',
    },
    unfavorable: {
      label: 'Use Caution',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500',
    },
  };

  const config = assessmentConfig[assessment];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Benefit-Risk Balance</span>
        <span className={clsx('font-medium', config.color)}>{config.label}</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
        <div
          className="bg-green-500 dark:bg-green-400 transition-all duration-500"
          style={{ width: `${benefitPercent}%` }}
        />
        <div
          className="bg-red-400 dark:bg-red-500 transition-all duration-500"
          style={{ width: `${100 - benefitPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{benefitCount} Benefits</span>
        <span>{riskCount} Risks</span>
      </div>
    </div>
  );
};

export const SideEffectsProfile: React.FC<SideEffectsProfileProps> = ({ effects, overallAssessment }) => {
  const benefits = effects.filter(e => e.type === 'therapeutic');
  const risks = effects.filter(e => e.type === 'adverse');

  if (effects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">No side effects data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Side Effects Profile
        </h3>
      </div>

      <Card className="p-4">
        <AssessmentBar
          assessment={overallAssessment}
          benefitCount={benefits.length}
          riskCount={risks.length}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Benefits Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="font-medium text-green-700 dark:text-green-400">Therapeutic Benefits</h4>
          </div>

          {benefits.length === 0 ? (
            <Card className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No specific benefits identified</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {benefits.map((effect, index) => (
                <Card key={index} className="p-3" hoverable>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">{effect.name}</span>
                        <SeverityBadge severity={effect.severity} type={effect.type} />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{effect.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Risks Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="font-medium text-red-700 dark:text-red-400">Potential Risks</h4>
          </div>

          {risks.length === 0 ? (
            <Card className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No specific risks identified</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {risks.map((effect, index) => (
                <Card key={index} className="p-3" hoverable>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">{effect.name}</span>
                        <SeverityBadge severity={effect.severity} type={effect.type} />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{effect.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            This profile is based on known molecular targets and pathways. Individual responses may vary. Consult a healthcare provider for personalized medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};
