import React from 'react';

export const SkeletonCard = () => (
  <div className="flex flex-col h-full rounded-2xl overflow-hidden">
    <div className="w-full aspect-square skeleton" />
    <div className="p-4 flex flex-col flex-grow">
      <div className="h-4 bg-ghost rounded w-3/4 mb-2 skeleton" />
      <div className="h-3 bg-ghost rounded w-1/2 mb-4 skeleton" />
      <div className="mt-auto">
        <div className="h-5 bg-ghost rounded w-1/3 skeleton" />
      </div>
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 4, cols = 'grid-cols-2 lg:grid-cols-4' }) => (
  <div className={`grid ${cols} gap-6`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default SkeletonCard;
