import React from 'react';
import { Card } from '../common/Card';
import type { PlantAnalysisResponse, AggregatePathway } from '../../api/types';

interface PlantAnalysisResultsProps {
  result: PlantAnalysisResponse;
  onNewAnalysis: () => void;
}

export const PlantAnalysisResults: React.FC<PlantAnalysisResultsProps> = ({
  result,
  onNewAnalysis,
}) => {
  const { identification, compounds_found, compound_analyses, aggregate_pathways, summary } = result;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 dark:text-green-400';
    if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (!identification.success) {
    return (
      <Card className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🌿</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Plant Identification Failed
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {identification.error || 'Unable to identify the plant from the image.'}
          </p>
          <button
            onClick={onNewAnalysis}
            className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try Another Photo
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Plant Identification Summary */}
      <Card>
        <div className="flex items-start gap-6">
          <div className="text-6xl">🌿</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.plant_identified}
            </h2>
            {summary.common_names && summary.common_names.length > 0 && (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {summary.common_names.join(', ')}
              </p>
            )}
            {summary.family && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Family: {summary.family}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(summary.identification_confidence)}`}>
                {(summary.identification_confidence * 100).toFixed(0)}% confidence
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                {summary.compounds_analyzed} compounds analyzed
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                {summary.total_pathways_affected} pathways affected
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Traditional Uses */}
      {summary.traditional_uses && summary.traditional_uses.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Traditional Uses
          </h3>
          <div className="flex flex-wrap gap-2">
            {summary.traditional_uses.map((use, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm"
              >
                {use}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Compounds Found */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Compounds
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {compounds_found.map((compound, idx) => {
            const analysis = compound_analyses.find(a => a.compound_name === compound.name);
            return (
              <div
                key={idx}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                    {compound.name}
                  </h4>
                  {compound.chembl_id && (
                    <a
                      href={`https://www.ebi.ac.uk/chembl/compound_report_card/${compound.chembl_id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-500 hover:text-primary-600"
                    >
                      {compound.chembl_id}
                    </a>
                  )}
                </div>
                {analysis && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="mr-3">{analysis.targets_found} targets</span>
                    <span>{analysis.pathways_found} pathways</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top Pathways - Aggregated */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Most Affected Biological Pathways
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Pathways affected by multiple compounds from this plant receive higher aggregate scores.
        </p>
        <div className="space-y-3">
          {aggregate_pathways.slice(0, 10).map((pathway: AggregatePathway, idx: number) => (
            <div
              key={pathway.pathway_id}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                      #{idx + 1}
                    </span>
                    <a
                      href={pathway.pathway_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 dark:text-white hover:text-primary-500"
                    >
                      {pathway.pathway_name}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pathway.compounds.map((compound, cidx) => (
                      <span
                        key={cidx}
                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs"
                      >
                        {compound}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${getScoreColor(pathway.aggregate_score)}`}>
                    {(pathway.aggregate_score * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {pathway.num_compounds} compound{pathway.num_compounds > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Analysis Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {summary.compounds_analyzed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Compounds</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {summary.total_targets_found}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Targets</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {summary.total_pathways_affected}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pathways</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {(summary.identification_confidence * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">ID Confidence</div>
          </div>
        </div>
      </Card>

      {/* Top Pathways from Summary */}
      {summary.top_pathways && summary.top_pathways.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Key Biological Effects
          </h3>
          <div className="space-y-3">
            {summary.top_pathways.map((pathway, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{pathway.name}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {pathway.compounds_involved.map((compound, cidx) => (
                      <span key={cidx} className="text-xs text-gray-500 dark:text-gray-400">
                        {compound}{cidx < pathway.compounds_involved.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`font-bold ${getScoreColor(pathway.score)}`}>
                  {(pathway.score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm">
        <p className="font-medium text-yellow-900 dark:text-yellow-400 mb-1">Disclaimer</p>
        <p className="text-yellow-800 dark:text-yellow-300">{summary.disclaimer}</p>
      </div>

      {/* Warning if plant not in database */}
      {summary.warning && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-sm">
          <p className="font-medium text-orange-900 dark:text-orange-400 mb-1">Notice</p>
          <p className="text-orange-800 dark:text-orange-300">{summary.warning}</p>
        </div>
      )}

      {/* New Analysis Button */}
      <div className="text-center">
        <button
          onClick={onNewAnalysis}
          className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          Analyze Another Plant
        </button>
      </div>
    </div>
  );
};
