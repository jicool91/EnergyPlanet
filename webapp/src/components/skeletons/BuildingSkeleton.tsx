import React from 'react';
import { Skeleton } from './Skeleton';

interface BuildingSkeletonProps {
  count?: number;
}

export const BuildingSkeleton: React.FC<BuildingSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 p-4 rounded-lg bg-dark-secondary border border-cyan/[0.14]"
        >
          {/* Header: Name + Count */}
          <div className="flex justify-between items-center gap-3">
            <Skeleton width="40%" height={20} variant="text" />
            <Skeleton width="30px" height={20} variant="text" />
          </div>

          {/* Info: Level, Income, Payback */}
          <div className="flex gap-4 text-xs flex-wrap">
            <Skeleton width="60px" height={16} variant="text" />
            <Skeleton width="80px" height={16} variant="text" />
            <Skeleton width="70px" height={16} variant="text" />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Skeleton width="120px" height={34} />
            <Skeleton width="120px" height={34} />
          </div>
        </div>
      ))}
    </div>
  );
};
