import React, { useState } from 'react';
import clsx from 'clsx';
import { Card } from '../common/Card';
import type { AffectedSystem, BodySystem, EffectType } from '../../utils/bodyEffectsMapper';

interface BodySystemDiagramProps {
  affectedSystems: AffectedSystem[];
  onSystemClick?: (system: BodySystem) => void;
}

interface OrganRegion {
  id: BodySystem;
  label: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

const ORGAN_REGIONS: OrganRegion[] = [
  { id: 'brain', label: 'Brain & CNS', cx: 100, cy: 35, rx: 22, ry: 18 },
  { id: 'lungs', label: 'Lungs', cx: 100, cy: 95, rx: 35, ry: 22 },
  { id: 'heart', label: 'Heart', cx: 100, cy: 105, rx: 12, ry: 12 },
  { id: 'liver', label: 'Liver', cx: 80, cy: 135, rx: 18, ry: 14 },
  { id: 'stomach', label: 'Stomach', cx: 115, cy: 140, rx: 15, ry: 12 },
  { id: 'kidneys', label: 'Kidneys', cx: 100, cy: 160, rx: 25, ry: 10 },
  { id: 'joints', label: 'Joints', cx: 100, cy: 200, rx: 30, ry: 15 },
  { id: 'skin', label: 'Skin', cx: 100, cy: 240, rx: 20, ry: 10 },
  { id: 'blood', label: 'Blood', cx: 140, cy: 105, rx: 10, ry: 10 },
];

const effectColors: Record<EffectType, { fill: string; stroke: string; glow: string }> = {
  therapeutic: {
    fill: 'fill-green-400/40 dark:fill-green-500/30',
    stroke: 'stroke-green-500 dark:stroke-green-400',
    glow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]',
  },
  adverse: {
    fill: 'fill-red-400/40 dark:fill-red-500/30',
    stroke: 'stroke-red-500 dark:stroke-red-400',
    glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  },
  neutral: {
    fill: 'fill-yellow-400/40 dark:fill-yellow-500/30',
    stroke: 'stroke-yellow-500 dark:stroke-yellow-400',
    glow: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]',
  },
};

const OrganTooltip: React.FC<{
  region: OrganRegion;
  system: AffectedSystem | undefined;
  position: { x: number; y: number };
}> = ({ region, system, position }) => {
  if (!system) return null;

  return (
    <div
      className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[200px] max-w-[280px] pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={clsx(
            'w-3 h-3 rounded-full',
            system.effectType === 'therapeutic' && 'bg-green-500',
            system.effectType === 'adverse' && 'bg-red-500',
            system.effectType === 'neutral' && 'bg-yellow-500'
          )}
        />
        <span className="font-medium text-gray-900 dark:text-white">{region.label}</span>
      </div>
      <ul className="space-y-1">
        {system.effects.map((effect, i) => (
          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
            <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
            <span>{effect}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const BodySystemDiagram: React.FC<BodySystemDiagramProps> = ({ affectedSystems, onSystemClick }) => {
  const [hoveredOrgan, setHoveredOrgan] = useState<BodySystem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const systemMap = new Map(affectedSystems.map(s => [s.system, s]));

  const handleMouseEnter = (e: React.MouseEvent, region: OrganRegion) => {
    setHoveredOrgan(region.id);
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = e.currentTarget.closest('.body-diagram-container')?.getBoundingClientRect();
    if (parent) {
      setTooltipPos({
        x: rect.left - parent.left + rect.width / 2,
        y: rect.top - parent.top,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredOrgan(null);
  };

  if (affectedSystems.length === 0) {
    return (
      <Card className="p-8 text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">No body system effects identified</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Body Systems Affected
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {affectedSystems.length} systems
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Body Diagram */}
        <Card className="p-6 body-diagram-container relative">
          <svg
            viewBox="0 0 200 280"
            className="w-full max-w-[300px] mx-auto"
            style={{ height: 'auto' }}
          >
            {/* Body silhouette */}
            <defs>
              <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Head */}
            <ellipse
              cx="100"
              cy="35"
              rx="28"
              ry="30"
              className="fill-gray-200 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
              strokeWidth="1"
            />

            {/* Neck */}
            <rect
              x="90"
              y="60"
              width="20"
              height="15"
              className="fill-gray-200 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
              strokeWidth="1"
            />

            {/* Torso */}
            <path
              d="M55 75 Q55 70 70 70 L130 70 Q145 70 145 75 L145 180 Q145 190 130 190 L70 190 Q55 190 55 180 Z"
              className="fill-gray-200 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
              strokeWidth="1"
            />

            {/* Arms */}
            <path
              d="M55 75 L30 120 L25 160 L35 162 L45 125 L55 90"
              className="fill-gray-200 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
              strokeWidth="1"
            />
            <path
              d="M145 75 L170 120 L175 160 L165 162 L155 125 L145 90"
              className="fill-gray-200 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
              strokeWidth="1"
            />

            {/* Legs */}
            <path
              d="M70 190 L65 260 L55 265 L55 270 L80 270 L80 265 L75 260 L85 190"
              className="fill-gray-200 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
              strokeWidth="1"
            />
            <path
              d="M130 190 L135 260 L145 265 L145 270 L120 270 L120 265 L125 260 L115 190"
              className="fill-gray-200 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
              strokeWidth="1"
            />

            {/* Organ highlights */}
            {ORGAN_REGIONS.map(region => {
              const system = systemMap.get(region.id);
              const isHovered = hoveredOrgan === region.id;
              const colors = system ? effectColors[system.effectType] : null;

              return (
                <g key={region.id}>
                  <ellipse
                    cx={region.cx}
                    cy={region.cy}
                    rx={region.rx}
                    ry={region.ry}
                    className={clsx(
                      'transition-all duration-300 cursor-pointer',
                      system ? [colors?.fill, colors?.stroke, 'stroke-2'] : 'fill-transparent stroke-transparent',
                      isHovered && system && colors?.glow,
                      isHovered && 'scale-110'
                    )}
                    style={{ transformOrigin: `${region.cx}px ${region.cy}px` }}
                    onMouseEnter={(e) => handleMouseEnter(e, region)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => system && onSystemClick?.(region.id)}
                  />
                  {system && (
                    <circle
                      cx={region.cx + region.rx - 5}
                      cy={region.cy - region.ry + 5}
                      r="4"
                      className={clsx(
                        system.effectType === 'therapeutic' && 'fill-green-500',
                        system.effectType === 'adverse' && 'fill-red-500',
                        system.effectType === 'neutral' && 'fill-yellow-500'
                      )}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredOrgan && (
            <OrganTooltip
              region={ORGAN_REGIONS.find(r => r.id === hoveredOrgan)!}
              system={systemMap.get(hoveredOrgan)}
              position={tooltipPos}
            />
          )}
        </Card>

        {/* Systems List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
            Affected Systems
          </h4>
          <div className="space-y-2">
            {affectedSystems.map((system) => {
              const region = ORGAN_REGIONS.find(r => r.id === system.system);
              if (!region) return null;

              return (
                <Card
                  key={system.system}
                  className={clsx(
                    'p-3 cursor-pointer transition-all',
                    hoveredOrgan === system.system && 'ring-2 ring-primary-500'
                  )}
                  hoverable
                  onMouseEnter={() => setHoveredOrgan(system.system)}
                  onMouseLeave={() => setHoveredOrgan(null)}
                  onClick={() => onSystemClick?.(system.system)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        'w-3 h-3 rounded-full mt-1 flex-shrink-0',
                        system.effectType === 'therapeutic' && 'bg-green-500',
                        system.effectType === 'adverse' && 'bg-red-500',
                        system.effectType === 'neutral' && 'bg-yellow-500'
                      )}
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {region.label}
                      </div>
                      <ul className="mt-1 space-y-0.5">
                        {system.effects.slice(0, 2).map((effect, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                            {effect}
                          </li>
                        ))}
                        {system.effects.length > 2 && (
                          <li className="text-sm text-primary-600 dark:text-primary-400">
                            +{system.effects.length - 2} more
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Therapeutic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Adverse</span>
        </div>
      </div>
    </div>
  );
};
