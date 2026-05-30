import React from 'react';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`animate-spin rounded-full border-t-cyan-400 border-r-cyan-400/20 border-b-cyan-400/20 border-l-cyan-400/20 ${sizeClasses[size]}`}></div>
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card-premium p-6 w-full ${className}`}>
      <div className="skeleton-loading h-6 w-2/3 mb-4"></div>
      <div className="skeleton-loading h-10 w-1/3 mb-3"></div>
      <div className="skeleton-loading h-4 w-full mb-2"></div>
      <div className="skeleton-loading h-4 w-4/5"></div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 w-full ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-loading h-4"
          style={{ width: i === lines - 1 ? '70%' : '100%' }}
        ></div>
      ))}
    </div>
  );
}

export function SkeletonRow({ cols = 5, className = '' }) {
  return (
    <div className={`flex items-center space-x-4 py-3 border-b border-slate-800 ${className}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="skeleton-loading h-4 flex-1"
          style={{ height: '16px' }}
        ></div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`card-premium p-6 w-full ${className}`}>
      <div className="skeleton-loading h-6 w-1/4 mb-6"></div>
      <div className="flex items-end justify-between h-48 px-4 border-b border-slate-800 pb-2">
        <div className="skeleton-loading w-8 h-24"></div>
        <div className="skeleton-loading w-8 h-36"></div>
        <div className="skeleton-loading w-8 h-16"></div>
        <div className="skeleton-loading w-8 h-40"></div>
        <div className="skeleton-loading w-8 h-28"></div>
        <div className="skeleton-loading w-8 h-44"></div>
      </div>
    </div>
  );
}
