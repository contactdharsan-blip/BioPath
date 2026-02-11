import type { ConfidenceTier } from '../api/types';

export const TIER_COLORS = {
  A: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    badge: 'bg-green-500',
    label: 'Measured',
    description: 'Experimental bioassay evidence',
  },
  B: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    badge: 'bg-yellow-500',
    label: 'Inferred',
    description: 'Pathway role from known targets',
  },
  C: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    badge: 'bg-gray-500',
    label: 'Predicted',
    description: 'Computational prediction',
  },
} as const;

export const getTierColor = (tier: ConfidenceTier) => {
  return TIER_COLORS[tier] || TIER_COLORS.C;
};
