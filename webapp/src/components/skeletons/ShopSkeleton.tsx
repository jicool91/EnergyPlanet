import React from 'react';
import { Skeleton } from './Skeleton';

interface ShopSkeletonProps {
  count?: number;
}

export const ShopSkeleton: React.FC<ShopSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 p-3 rounded-lg bg-dark-secondary border border-cyan/[0.14]"
        >
          {/* Item Image/Icon */}
          <Skeleton width="100%" height={80} variant="rect" />

          {/* Item Name */}
          <Skeleton width="80%" height={16} variant="text" />

          {/* Price */}
          <Skeleton width="60%" height={14} variant="text" />

          {/* Buy Button */}
          <Skeleton width="100%" height={32} />
        </div>
      ))}
    </div>
  );
};
