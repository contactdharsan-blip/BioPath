import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  compoundName?: string;
}

const steps = [
  'Resolving compound structure...',
  'Finding targets in ChEMBL...',
  'Mapping biological pathways...',
  'Analyzing interactions...',
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ compoundName }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="glass-strong rounded-2xl p-6 sm:p-8 text-center max-w-sm w-full mx-4">
        {/* Animated spinner */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-primary-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        </div>

        <h3 className="text-lg font-semibold text-slate-100 mb-1">
          Analyzing {compoundName || 'compound'}
        </h3>
        <p className="text-xs text-slate-500 mb-6">This may take up to a minute</p>

        {/* Progress bar */}
        <div className="loading-progress mb-6 rounded-full">
          <div className="loading-progress-bar rounded-full"></div>
        </div>

        {/* Steps */}
        <div className="space-y-2.5 text-left">
          {steps.map((step, index) => (
            <div
              key={index}
              className={clsx(
                'flex items-center text-sm transition-all duration-300',
                index <= activeStep ? 'text-slate-300' : 'text-slate-600'
              )}
            >
              <div className={clsx(
                'w-1.5 h-1.5 rounded-full mr-3 flex-shrink-0 transition-all duration-300',
                index < activeStep ? 'bg-green-500' :
                index === activeStep ? 'bg-primary-500 animate-pulse' :
                'bg-slate-700'
              )} />
              <span className="text-xs">{step}</span>
              {index < activeStep && (
                <svg className="w-3.5 h-3.5 ml-auto text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Need clsx for conditional classes
import clsx from 'clsx';
