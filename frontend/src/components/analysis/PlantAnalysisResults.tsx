import React from 'react';
import { Card } from '../common/Card';
import type { PlantAnalysisResponse, AggregatePathway, PlantCompound } from '../../api/types';

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

  const getInteractionRiskColor = (risk: number) => {
    if (risk >= 0.7) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (risk >= 0.5) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    if (risk >= 0.3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  };

  const getResearchLevelLabel = (level: number) => {
    if (level >= 0.8) return 'Well-Researched';
    if (level >= 0.6) return 'Moderate Research';
    if (level >= 0.4) return 'Limited Research';
    return 'Minimal Research';
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
              {summary.average_research_confidence !== undefined && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  {getResearchLevelLabel(summary.average_research_confidence)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Drug Interaction Warning - Prominent Alert */}
      {summary.drug_interaction_warning && (
        <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-300 text-lg mb-2">
                Drug Interaction Warning
              </h3>
              <p className="text-red-700 dark:text-red-400">
                {summary.drug_interaction_warning}
              </p>
              {summary.high_interaction_compounds && summary.high_interaction_compounds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.high_interaction_compounds.map((comp, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-200 rounded-full text-sm font-medium"
                    >
                      {comp.name} ({(comp.risk_level * 100).toFixed(0)}% risk)
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lifestyle Categories Affected */}
      {summary.lifestyle_categories_affected && summary.lifestyle_categories_affected.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Body Systems Affected
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            This plant's compounds may influence these aspects of health and lifestyle:
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.lifestyle_categories_affected.map((category, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm capitalize"
              >
                {category}
              </span>
            ))}
          </div>
        </Card>
      )}

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

      {/* Compounds Found - With Confidence Scoring */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Active Compounds
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Compounds are ranked by research depth, biological impact, and drug interaction importance.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {compounds_found.map((compound: PlantCompound, idx: number) => {
            const analysis = compound_analyses.find(a => a.compound_name === compound.name);
            return (
              <div
                key={idx}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-primary-500"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary-500">#{idx + 1}</span>
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {compound.name}
                    </h4>
                  </div>
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

                {/* Confidence Scores */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {compound.drug_interaction_risk !== undefined && compound.drug_interaction_risk >= 0.5 && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getInteractionRiskColor(compound.drug_interaction_risk)}`}>
                      {compound.drug_interaction_risk >= 0.7 ? 'High' : 'Moderate'} Interaction Risk
                    </span>
                  )}
                  {compound.research_level !== undefined && (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {getResearchLevelLabel(compound.research_level)}
                    </span>
                  )}
                </div>

                {/* Lifestyle Categories */}
                {compound.lifestyle_categories && compound.lifestyle_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {compound.lifestyle_categories.map((cat, cidx) => (
                      <span
                        key={cidx}
                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs capitalize"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {analysis && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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
