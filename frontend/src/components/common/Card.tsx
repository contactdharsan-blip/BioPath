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
        'card-glass-outer rounded-2xl transition-all duration-200',
        hoverable && 'hover:border-white/15 hover:shadow-lg',
        onClick && 'cursor-pointer active:scale-[0.99]',
        className
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Background warp layer - distorts what's behind the card */}
      <div className="card-glass-warp" aria-hidden="true" />
      {/* Content layer - renders cleanly above the warp */}
      <div className="card-glass-content p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};
