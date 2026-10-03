import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-4 space-y-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
};
