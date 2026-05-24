import React from 'react';

export default function Skeleton({ className = '', variant = 'text' }) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'card':
        return 'rounded-2xl h-80 w-full';
      case 'text':
      default:
        return 'rounded-md h-4 w-full';
    }
  };

  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-white/10 ${getVariantStyles()} ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, var(--tw-numeric-spacing, rgba(229,231,235,0.2)) 25%, var(--tw-numeric-spacing, rgba(229,231,235,0.4)) 50%, var(--tw-numeric-spacing, rgba(229,231,235,0.2)) 75%)',
        backgroundSize: '200% 100%'
      }}
    />
  );
}
