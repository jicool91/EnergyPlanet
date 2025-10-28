import React from 'react';
import { Skeleton } from './Skeleton';

interface LeaderboardSkeletonProps {
  count?: number;
}

export const LeaderboardSkeleton: React.FC<LeaderboardSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="flex flex-col gap-sm-plus">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-sm-plus rounded-2xl border border-[rgba(0,217,255,0.22)] bg-[rgba(12,18,40,0.84)] p-md shadow-elevation-2"
        >
          {/* Rank Badge */}
          <Skeleton width={32} height={32} variant="circle" />

          {/* Player Info */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <Skeleton width="70%" height={16} variant="text" />
            <Skeleton width="50%" height={14} variant="text" />
          </div>

          {/* Energy Value */}
          <Skeleton width="80px" height={16} variant="text" />
        </div>
      ))}
    </div>
  );
};
