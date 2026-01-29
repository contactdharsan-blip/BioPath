import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable = false }) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-md border border-gray-100 p-6',
        hoverable && 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
};
