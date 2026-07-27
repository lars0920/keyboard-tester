import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export const PostListSkeleton: React.FC = () => {
  return (
    <div className="post-skeleton-wrapper" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
      {[...Array(8)].map((_, i) => (
        <div 
          key={i} 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'rgba(30, 41, 59, 0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <Skeleton width="40px" height="24px" borderRadius="6px" />
            <Skeleton width="60px" height="24px" borderRadius="20px" />
            <Skeleton width="60%" height="22px" borderRadius="6px" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Skeleton width="80px" height="20px" borderRadius="6px" />
            <Skeleton width="90px" height="20px" borderRadius="6px" />
            <Skeleton width="50px" height="20px" borderRadius="6px" />
          </div>
        </div>
      ))}
    </div>
  );
};
