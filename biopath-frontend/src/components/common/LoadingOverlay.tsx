import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Card } from './Card';

interface LoadingOverlayProps {
  compoundName?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ compoundName }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <Card className="p-8 text-center max-w-md mx-4">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Analyzing {compoundName || 'compound'}...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          This may take around 1 minute
        </p>
        <div className="mt-6 space-y-2 text-left">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <div className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse"></div>
            Resolving compound structure...
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <div className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.2s'}}></div>
            Finding targets in ChEMBL...
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <div className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.4s'}}></div>
            Mapping biological pathways...
          </div>
        </div>
      </Card>
    </div>
  );
};
