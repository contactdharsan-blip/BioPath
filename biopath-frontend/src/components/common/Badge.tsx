import React from 'react';
import clsx from 'clsx';
import type { ConfidenceTier } from '../../api/types';
import { getTierColor } from '../../utils/colors';

interface BadgeProps {
  tier?: ConfidenceTier;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ tier, children, className }) => {
  const tierStyles = tier ? getTierColor(tier) : null;

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        tier && tierStyles ? `${tierStyles.bg} ${tierStyles.text}` : 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {children}
    </span>
  );
};
