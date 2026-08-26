import React from 'react';

export const CameraCardSkeleton: React.FC = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-pulse">
    <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
      <div className="h-4 bg-slate-800 rounded w-1/3" />
      <div className="h-4 bg-slate-800 rounded-full w-16" />
    </div>
    <div className="aspect-video bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-slate-600 animate-spin" />
    </div>
    <div className="p-3 border-t border-slate-800 flex items-center justify-between">
      <div className="h-4 bg-slate-800 rounded w-1/4" />
      <div className="flex gap-2">
        <div className="h-7 w-16 bg-slate-800 rounded" />
        <div className="h-7 w-16 bg-slate-800 rounded" />
      </div>
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 6 }) => (
  <tr className="border-b border-slate-800/80 animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-4 px-4">
        <div className="h-4 bg-slate-800/70 rounded w-full" />
      </td>
    ))}
  </tr>
);

export const StorageCardSkeleton: React.FC = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse space-y-4">
    <div className="h-4 bg-slate-800 rounded w-1/4" />
    <div className="h-8 bg-slate-800 rounded w-1/2" />
    <div className="h-2 bg-slate-800 rounded-full w-full" />
  </div>
);
