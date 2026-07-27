import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  borderRadius = '8px'
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: width,
        height: height,
        borderRadius: borderRadius,
        background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.4) 0%, rgba(51, 65, 85, 0.7) 50%, rgba(30, 41, 59, 0.4) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s infinite linear'
      }}
    />
  );
};
