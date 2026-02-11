import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      className={clsx(
        'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-100/50 dark:border-gray-700/50 p-6 glow-card',
        hoverable && 'transition-all duration-200 hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};
