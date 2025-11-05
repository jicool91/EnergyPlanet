import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  width,
  height,
  count = 1,
}) => {
  const baseClass =
    'animate-shimmer bg-gradient-to-r from-layer-overlay-strong/70 via-surface-glass-strong to-layer-overlay-strong/70 bg-[length:200%_100%]';

  const getVariantClass = () => {
    switch (variant) {
      case 'text':
        return `h-3 rounded-full ${baseClass}`;
      case 'circle':
        return `rounded-full ${baseClass}`;
      case 'rect':
      default:
        return `rounded-2xl ${baseClass}`;
    }
  };

  const style: React.CSSProperties = {};
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  const variantClass = getVariantClass();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${variantClass} ${className}`} style={style} />
      ))}
    </>
  );
};
