import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../common/Card';
import type { TargetEvidence, DosageResponse, PotencyDataItem } from '../../api/types';
import clsx from 'clsx';

interface DosageTabProps {
  compoundName: string;
  pubchemCid?: number;
  inchikey?: string;
  smiles?: string;
  targets: TargetEvidence[];
}

type PotencyFilter = 'all' | 'very_potent' | 'potent' | 'moderate' | 'weak';

const PotencyBadge: React.FC<{ category: PotencyDataItem['potency_category'] }> = ({ category }) => {
  const config = {
    very_potent: { bg: 'bg-green-900/30', text: 'text-green-300', label: 'Very Potent' },
    potent: { bg: 'bg-blue-900/30', text: 'text-blue-300', label: 'Potent' },
    moderate: { bg: 'bg-amber-900/30', text: 'text-amber-300', label: 'Moderate' },
    weak: { bg: 'bg-gray-800', text: 'text-gray-300', label: 'Weak' },
  };
  const c = config[category];
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      {c.label}
    </span>
  );
};

const ConfidenceBadge: React.FC<{ confidence: string }> = ({ confidence }) => {
  const config: Record<string, { bg: string; text: string }> = {
    high: { bg: 'bg-green-900/30', text: 'text-green-300' },
    moderate: { bg: 'bg-amber-900/30', text: 'text-amber-300' },
    low: { bg: 'bg-gray-800', text: 'text-gray-400' },
  };
  const c = config[confidence] || config.moderate;
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      {confidence}
    </span>
  );
};

// Logarithmic position helper (maps a value to 0-100% on log scale)
function logPosition(value: number, min: number, max: number): number {
  if (value <= 0 || min <= 0 || max <= 0 || min >= max) return 0;
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logVal = Math.log10(Math.max(value, min));
  return Math.max(0, Math.min(100, ((logVal - logMin) / (logMax - logMin)) * 100));
}

export const DosageTab: React.FC<DosageTabProps> = ({
  compoundName,
  pubchemCid,
  inchikey,
  smiles,
  targets,
}) => {
  const [dosageData, setDosageData] = useState<DosageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [potencyFilter, setPotencyFilter] = useState<PotencyFilter>('all');
  const [expandedPotency, setExpandedPotency] = useState<number | null>(null);

  useEffect(() => {
    const fetchDosage = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/dosage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compound_name: compoundName,
            pubchem_cid: pubchemCid,
            inchikey: inchikey,
            smiles: smiles,
            targets: targets.map(t => t.target_name),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dosage data: ${response.statusText}`);
        }

        const data = await response.json();
        setDosageData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dosage data');
      } finally {
        setLoading(false);
      }
    };

    fetchDosage();
  }, [compoundName, pubchemCid, inchikey, smiles, targets]);

  const filteredPotency = useMemo(() => {
    if (!dosageData) return [];
    return potencyFilter === 'all'
      ? dosageData.potency_data
      : dosageData.potency_data.filter(p => p.potency_category === potencyFilter);
  }, [dosageData, potencyFilter]);

  const potencyCounts = useMemo(() => {
    if (!dosageData) return { very_potent: 0, potent: 0, moderate: 0, weak: 0 };
    return {
      very_potent: dosageData.potency_data.filter(p => p.potency_category === 'very_potent').length,
      potent: dosageData.potency_data.filter(p => p.potency_category === 'potent').length,
      moderate: dosageData.potency_data.filter(p => p.potency_category === 'moderate').length,
      weak: dosageData.potency_data.filter(p => p.potency_category === 'weak').length,
    };
  }, [dosageData]);

  // Compute range bar data
  const rangeBarData = useMemo(() => {
    if (!dosageData) return null;

    const allValues: number[] = [];

    // Collect all numeric values for scale
    dosageData.dosage_data.forEach(d => {
      if (d.value && d.value > 0) allValues.push(d.value);
      if (d.value_high && d.value_high > 0) allValues.push(d.value_high);
    });

    dosageData.potency_data.forEach(p => {
      if (p.effective_concentration_nm > 0) {
        // Convert nM to mg/kg roughly (divide by ~1000 for rough comparison)
        allValues.push(p.effective_concentration_nm / 1000);
      }
    });

    if (allValues.length === 0) return null;

    const min = Math.min(...allValues) * 0.1;
    const max = Math.max(...allValues) * 10;

    return { min, max };
  }, [dosageData]);

  if (loading) {
    return (
      <Card className="animate-slide-up">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-gray-400">Loading dosage data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="animate-slide-up">
        <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-red-300 font-semibold">Error Loading Dosage Data</p>
          <p className="text-red-400 text-sm mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  if (!dosageData) return null;

  const { safety_profile, dosage_data, potency_data, plant_concentrations } = dosageData;
  const hasData = dosage_data.length > 0 || potency_data.length > 0 || plant_concentrations.length > 0;

  return (
    <div className="space-y-4">
      {/* Safety Overview */}
      <Card className="animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Dosage & Safety
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Dosage ranges and safety data for {compoundName}
            </p>
          </div>

          {/* Safety classification badge */}
          {safety_profile.safety_classification && (
            <span className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-semibold flex-shrink-0 self-start',
              safety_profile.safety_classification === 'wide' && 'bg-green-900/30 text-green-300 border border-green-700/50',
              safety_profile.safety_classification === 'narrow_therapeutic_index' && 'bg-red-900/30 text-red-300 border border-red-700/50',
              safety_profile.safety_classification === 'unknown' && 'bg-gray-800 text-gray-300 border border-gray-700',
            )}>
              {safety_profile.safety_classification === 'wide' && 'Wide Therapeutic Index'}
              {safety_profile.safety_classification === 'narrow_therapeutic_index' && 'Narrow Therapeutic Index'}
              {safety_profile.safety_classification === 'unknown' && 'Unknown Safety Margin'}
            </span>
          )}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {safety_profile.ld50 && (
            <div className="bg-red-900/15 border border-red-800/40 rounded-lg p-3">
              <p className="text-xs text-red-400 font-medium mb-1">LD50</p>
              <p className="text-lg font-bold text-red-300">
                {safety_profile.ld50.value} {safety_profile.ld50.unit}
              </p>
              <p className="text-xs text-red-400/70 mt-0.5">
                {safety_profile.ld50.route} · {safety_profile.ld50.species}
              </p>
            </div>
          )}

          {safety_profile.therapeutic_range && (
            <div className="bg-green-900/15 border border-green-800/40 rounded-lg p-3">
              <p className="text-xs text-green-400 font-medium mb-1">Therapeutic Dose</p>
              <p className="text-lg font-bold text-green-300">
                {safety_profile.therapeutic_range.value}
                {safety_profile.therapeutic_range.value_high && ` - ${safety_profile.therapeutic_range.value_high}`}
                {' '}{safety_profile.therapeutic_range.unit}
              </p>
              <p className="text-xs text-green-400/70 mt-0.5">
                {safety_profile.therapeutic_range.route || 'oral'}
              </p>
            </div>
          )}

          {safety_profile.therapeutic_index && (
            <div className="bg-blue-900/15 border border-blue-800/40 rounded-lg p-3">
              <p className="text-xs text-blue-400 font-medium mb-1">Therapeutic Index</p>
              <p className="text-lg font-bold text-blue-300">
                {safety_profile.therapeutic_index}
              </p>
              <p className="text-xs text-blue-400/70 mt-0.5">
                LD50 / ED50 ratio
              </p>
            </div>
          )}

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-400 font-medium mb-1">Sources</p>
            <p className="text-lg font-bold text-gray-200">
              {dosageData.sources_queried.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {dosageData.sources_queried.join(', ')}
            </p>
          </div>
        </div>

        {/* Warnings */}
        {safety_profile.warnings.length > 0 && (
          <div className="space-y-2">
            {safety_profile.warnings.map((warning, i) => (
              <div key={i} className="bg-amber-900/15 border border-amber-800/40 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-amber-300/90">{warning}</p>
              </div>
            ))}
          </div>
        )}

        {/* Data quality note */}
        {dosageData.data_quality_note && (
          <p className="text-xs text-gray-500 mt-3 italic">{dosageData.data_quality_note}</p>
        )}
      </Card>

      {/* Dose-Response Range Bar */}
      {hasData && rangeBarData && (
        <Card className="animate-slide-up">
          <h4 className="text-lg font-semibold text-white mb-4">Dose-Response Range</h4>

          {/* Desktop: horizontal bar */}
          <div className="hidden md:block">
            <div className="relative h-12 bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
              {/* Therapeutic zone */}
              {dosage_data.filter(d => d.context === 'therapeutic').map((d, i) => {
                const left = logPosition(d.value || 1, rangeBarData.min, rangeBarData.max);
                const right = d.value_high
                  ? logPosition(d.value_high, rangeBarData.min, rangeBarData.max)
                  : left + 3;
                return (
                  <div
                    key={`therapeutic-${i}`}
                    className="absolute top-0 bottom-0 bg-green-500/20 border-l border-r border-green-500/40"
                    style={{ left: `${left}%`, width: `${Math.max(right - left, 2)}%` }}
                    title={d.description}
                  />
                );
              })}

              {/* Lethal zone */}
              {dosage_data.filter(d => d.context === 'lethal').map((d, i) => {
                const left = logPosition(d.value || 1, rangeBarData.min, rangeBarData.max);
                return (
                  <div
                    key={`lethal-${i}`}
                    className="absolute top-0 bottom-0 bg-red-500/20 border-l border-red-500/50"
                    style={{ left: `${left}%`, right: '0%' }}
                    title={d.description}
                  />
                );
              })}

              {/* Potency markers */}
              {potency_data.slice(0, 8).map((p, i) => {
                const nmAsMg = p.effective_concentration_nm / 1000;
                const pos = logPosition(nmAsMg, rangeBarData.min, rangeBarData.max);
                const colorMap = {
                  very_potent: 'bg-green-400',
                  potent: 'bg-blue-400',
                  moderate: 'bg-amber-400',
                  weak: 'bg-gray-400',
                };
                return (
                  <div
                    key={`potency-${i}`}
                    className={clsx(
                      'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gray-900',
                      colorMap[p.potency_category]
                    )}
                    style={{ left: `${pos}%` }}
                    title={`${p.target_name}: ${p.standard_type} = ${p.standard_value} ${p.standard_units} (pChEMBL ${p.pchembl_value})`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 bg-green-500/30 border border-green-500/50 rounded-sm" />
                <span>Therapeutic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 bg-red-500/30 border border-red-500/50 rounded-sm" />
                <span>Lethal (LD50)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-400 rounded-full" />
                <span>IC50/EC50</span>
              </div>
            </div>
          </div>

          {/* Mobile: vertical list */}
          <div className="md:hidden space-y-2">
            {dosage_data.map((d, i) => (
              <div
                key={`dose-${i}`}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  d.context === 'therapeutic' && 'bg-green-900/15 border-green-800/40',
                  d.context === 'lethal' && 'bg-red-900/15 border-red-800/40',
                  d.context === 'toxic' && 'bg-amber-900/15 border-amber-800/40',
                )}
              >
                <div className={clsx(
                  'w-1 h-8 rounded-full flex-shrink-0',
                  d.context === 'therapeutic' && 'bg-green-500',
                  d.context === 'lethal' && 'bg-red-500',
                  d.context === 'toxic' && 'bg-amber-500',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{d.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {d.source} · {d.confidence} confidence
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Potency Data Table */}
      {potency_data.length > 0 && (
        <Card className="animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Target Potency</h4>
              <p className="text-sm text-gray-400 mt-0.5">
                {potency_data.length} target(s) from ChEMBL bioactivity data
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {potencyCounts.very_potent > 0 && (
                <div className="text-center">
                  <span className="text-xl font-bold text-green-400">{potencyCounts.very_potent}</span>
                  <span className="text-xs text-gray-500 block">V.Potent</span>
                </div>
              )}
              <div className="text-center">
                <span className="text-xl font-bold text-blue-400">{potencyCounts.potent}</span>
                <span className="text-xs text-gray-500 block">Potent</span>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold text-amber-400">{potencyCounts.moderate}</span>
                <span className="text-xs text-gray-500 block">Moderate</span>
              </div>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['all', 'very_potent', 'potent', 'moderate', 'weak'] as const).map(filter => {
              const labels: Record<PotencyFilter, string> = {
                all: `All (${potency_data.length})`,
                very_potent: 'Very Potent',
                potent: 'Potent',
                moderate: 'Moderate',
                weak: 'Weak',
              };
              const activeColors: Record<PotencyFilter, string> = {
                all: 'bg-indigo-900/30 text-indigo-300',
                very_potent: 'bg-green-900/30 text-green-300',
                potent: 'bg-blue-900/30 text-blue-300',
                moderate: 'bg-amber-900/30 text-amber-300',
                weak: 'bg-gray-800 text-gray-300',
              };
              return (
                <button
                  key={filter}
                  onClick={() => setPotencyFilter(filter)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    potencyFilter === filter
                      ? activeColors[filter]
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  )}
                >
                  {labels[filter]}
                </button>
              );
            })}
          </div>

          {/* Potency list */}
          <div className="space-y-2">
            {filteredPotency.map((p, index) => (
              <div
                key={index}
                className="border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-200"
              >
                <div
                  onClick={() => setExpandedPotency(expandedPotency === index ? null : index)}
                  className="p-3 cursor-pointer hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h5 className="font-medium text-white truncate">{p.target_name}</h5>
                      <PotencyBadge category={p.potency_category} />
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-sm text-gray-300 font-mono">
                        pChEMBL {p.pchembl_value.toFixed(1)}
                      </span>
                      <button className={clsx('p-1 transition-transform duration-200', expandedPotency === index && 'rotate-180')}>
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {expandedPotency === index && (
                  <div className="px-3 pb-3 border-t border-gray-700/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="bg-gray-800/50 rounded-lg p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Type</p>
                        <p className="text-sm text-white font-medium">{p.standard_type}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Value</p>
                        <p className="text-sm text-white font-medium">{p.standard_value} {p.standard_units}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Effective (nM)</p>
                        <p className="text-sm text-white font-medium">{p.effective_concentration_nm.toFixed(1)}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-2">
                        <p className="text-xs text-gray-500 mb-0.5">pChEMBL</p>
                        <p className="text-sm text-white font-medium">{p.pchembl_value.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredPotency.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                No potency data for the selected filter.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Plant Concentrations */}
      {plant_concentrations.length > 0 && (
        <Card className="animate-slide-up">
          <h4 className="text-lg font-semibold text-white mb-3">Plant Tissue Concentrations</h4>
          <p className="text-sm text-gray-400 mb-4">Natural concentrations from Dr. Duke's Phytochemical Database</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plant_concentrations.map((pc, i) => (
              <div key={i} className="bg-emerald-900/10 border border-emerald-800/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <span className="text-sm font-medium text-emerald-300">
                    {pc.plant_part || 'Unknown part'}
                  </span>
                </div>
                <p className="text-lg font-bold text-white">
                  {pc.concentration_low != null && pc.concentration_low}
                  {pc.concentration_high != null && ` - ${pc.concentration_high}`}
                  {' '}{pc.unit}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Dosage Data Points */}
      {dosage_data.length > 0 && (
        <Card className="animate-slide-up">
          <h4 className="text-lg font-semibold text-white mb-3">All Dosage Data</h4>
          <div className="space-y-2">
            {dosage_data.map((d, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <div className={clsx(
                  'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                  d.context === 'therapeutic' && 'bg-green-400',
                  d.context === 'lethal' && 'bg-red-400',
                  d.context === 'toxic' && 'bg-amber-400',
                  d.context === 'potency' && 'bg-blue-400',
                  d.context === 'plant_concentration' && 'bg-emerald-400',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{d.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{d.source}</span>
                    <ConfidenceBadge confidence={d.confidence} />
                    {d.source_url && (
                      <a
                        href={d.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        View source
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No data state */}
      {!hasData && (
        <Card className="animate-slide-up">
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-400 mb-1">No Dosage Data Available</h4>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              No dosage, toxicity, or potency data was found for {compoundName} in PubChem, ChEMBL, or Dr. Duke's databases.
            </p>
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="animate-slide-up">
        <p className="text-xs text-gray-500">
          <strong>Disclaimer:</strong> Dosage information is aggregated from research databases and is for educational purposes only.
          Values may be from animal studies or in-vitro experiments and should not be used to determine human dosage.
          Always consult a healthcare professional for dosing guidance.
        </p>
      </Card>
    </div>
  );
};
