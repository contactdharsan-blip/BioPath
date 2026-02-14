import React, { useMemo, useState } from 'react';
import { Card } from '../common/Card';
import type { TargetEvidence, PathwayMatch } from '../../api/types';

interface BodyDiagramProps {
  targets: TargetEvidence[];
  pathways: PathwayMatch[];
  compoundName: string;
}

// Map targets and pathways to body systems
const BODY_SYSTEMS = {
  cardiovascular: {
    name: 'Cardiovascular System',
    organs: ['Heart', 'Blood Vessels', 'Blood Pressure'],
    keywords: ['ACE', 'ADRB', 'HTN', 'CYP2D6', 'calcium', 'potassium', 'renin'],
    color: '#ef4444'
  },
  respiratory: {
    name: 'Respiratory System',
    organs: ['Lungs', 'Airways', 'Bronchi'],
    keywords: ['bronch', 'respir', 'asthma', 'COPD', 'histamine', 'leukotriene'],
    color: '#f59e0b'
  },
  digestive: {
    name: 'Digestive System',
    organs: ['Stomach', 'Intestines', 'Liver'],
    keywords: ['stomach', 'GI', 'digestive', 'acid', 'PPI', 'CYP3A4', 'CYP2C9', 'hepatic'],
    color: '#eab308'
  },
  nervous: {
    name: 'Nervous System',
    organs: ['Brain', 'Spinal Cord', 'Neurons'],
    keywords: ['dopamine', 'serotonin', 'GABA', 'glutamate', 'acetylcholine', 'CNS', 'neurotransmitter'],
    color: '#8b5cf6'
  },
  immune: {
    name: 'Immune System',
    organs: ['Lymph Nodes', 'Spleen', 'Thymus'],
    keywords: ['immune', 'inflammation', 'TNF', 'IL-', 'COX', 'NSAID', 'interferon', 'cytokine'],
    color: '#06b6d4'
  },
  endocrine: {
    name: 'Endocrine System',
    organs: ['Pancreas', 'Thyroid', 'Pituitary'],
    keywords: ['glucose', 'insulin', 'diabetes', 'thyroid', 'hormone', 'cortisol', 'estrogen'],
    color: '#ec4899'
  },
  metabolic: {
    name: 'Metabolic System',
    organs: ['Liver', 'Kidneys', 'Mitochondria'],
    keywords: ['metabolism', 'CYP450', 'gluconeogenesis', 'HMGCR', 'statin', 'kidney', 'renal'],
    color: '#10b981'
  },
  musculoskeletal: {
    name: 'Musculoskeletal System',
    organs: ['Muscles', 'Bones', 'Joints'],
    keywords: ['muscle', 'bone', 'joint', 'arthritis', 'calcium', 'vitamin D', 'RANKL'],
    color: '#f97316'
  }
};

export const BodyDiagram: React.FC<BodyDiagramProps> = ({ targets, pathways, compoundName }) => {
  const [expandedMechanisms, setExpandedMechanisms] = useState(false);

  // Determine affected body systems
  const affectedSystems = useMemo(() => {
    const allText = [
      ...targets.map(t => `${t.target_name} ${t.target_id}`),
      ...pathways.map(p => `${p.pathway_name} ${p.explanation || ''}`)
    ].join(' ').toLowerCase();

    const affected = Object.entries(BODY_SYSTEMS).filter(([_, system]) => {
      return system.keywords.some(keyword => allText.includes(keyword.toLowerCase()));
    });

    return affected.length > 0 ? affected : Object.entries(BODY_SYSTEMS).slice(0, 3);
  }, [targets, pathways]);

  const affectedSystemCount = affectedSystems.length;

  return (
    <Card className="space-y-6">
      <div>
        <h3 className="text-lg font-600 text-primary-700 dark:text-primary-300 mb-2">
          Body Systems Affected
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {compoundName} may affect {affectedSystemCount} major body system{affectedSystemCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Body Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {affectedSystems.map(([key, system]) => (
          <div
            key={key}
            className="p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
            style={{
              borderColor: system.color,
              backgroundColor: `${system.color}10`
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                style={{ backgroundColor: system.color }}
              >
                {system.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h4 className="font-600 text-gray-900 dark:text-gray-100 mb-1">
                  {system.name}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {system.organs.map((organ, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border"
                      style={{ borderColor: system.color }}
                    >
                      {organ}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Related Targets and Pathways */}
      {(targets.length > 0 || pathways.length > 0) && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-600 text-gray-900 dark:text-gray-100">
              Related Mechanisms ({targets.length + pathways.length})
            </h4>
            {(targets.length > 5 || pathways.length > 3) && (
              <button
                onClick={() => setExpandedMechanisms(!expandedMechanisms)}
                className="text-xs px-3 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
              >
                {expandedMechanisms ? 'Collapse' : 'Expand All'}
              </button>
            )}
          </div>

          <div className={`space-y-2 text-sm ${expandedMechanisms ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
            {(expandedMechanisms ? targets : targets.slice(0, 5)).map((target) => (
              <div key={target.target_id} className="flex items-start gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-primary-600 dark:text-primary-400 font-bold">→</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {target.target_name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {target.organism} • {target.target_type}
                  </p>
                </div>
              </div>
            ))}

            {(expandedMechanisms ? pathways : pathways.slice(0, 3)).map((pathway, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-primary-600 dark:text-primary-400 font-bold">▶</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {pathway.pathway_name}
                  </p>
                  {pathway.explanation && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {pathway.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!expandedMechanisms && (targets.length > 5 || pathways.length > 3) && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              Click "Expand All" to see {targets.length - 5 + (pathways.length > 3 ? pathways.length - 3 : 0)} more mechanism{targets.length - 5 + (pathways.length > 3 ? pathways.length - 3 : 0) !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          <strong>Body System Impact:</strong> This diagram shows which major body systems may be affected based on the drug's known targets and biological pathways. Color intensity indicates the primary systems of action.
        </p>
      </div>
    </Card>
  );
};
