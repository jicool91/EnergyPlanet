import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-0">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-border-cyan/60 bg-surface-glass-strong p-md shadow-elevation-2">
        {/* Avatar */}
        <Skeleton width={64} height={64} variant="circle" />

        {/* User Info */}
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton width="60%" height={18} variant="text" />
          <Skeleton width="40%" height={14} variant="text" />
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex flex-col gap-2">
        <Skeleton width="40%" height={18} variant="text" />
        <div className="grid grid-cols-2 gap-sm-plus">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border-cyan/50 bg-surface-glass-strong p-sm-plus shadow-elevation-1"
            >
              <Skeleton width="80%" height={14} variant="text" />
              <Skeleton width="60%" height={18} variant="text" className="mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Equipped Cosmetics */}
      <div className="flex flex-col gap-2">
        <Skeleton width="50%" height={18} variant="text" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={60} variant="rect" />
          ))}
        </div>
      </div>
    </div>
  );
};
