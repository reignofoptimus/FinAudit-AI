import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toLowerCase().trim();

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let dot = 'bg-slate-400';
  let label = status;

  if (norm === 'high' || norm === 'critical' || norm === 'fraud' || norm === 'rejected') {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    dot = 'bg-rose-500';
  } else if (norm === 'medium' || norm === 'flagged' || norm === 'suspicious' || norm === 'partial' || norm === 'discrepancy' || norm === 'action required') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    dot = 'bg-amber-500';
  } else if (norm === 'low' || norm === 'clean' || norm === 'matched' || norm === 'confirmed' || norm === 'resolved' || norm === 'completed' || norm === 'verified') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dot = 'bg-emerald-500';
  } else if (norm === 'pending' || norm === 'suggested' || norm === 'in review' || norm === 'processing' || norm === 'draft') {
    bg = 'bg-blue-50 text-blue-700 border-blue-200';
    dot = 'bg-blue-500';
  } else if (norm === 'unmatched') {
    bg = 'bg-slate-100 text-slate-600 border-slate-200';
    dot = 'bg-slate-400';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${bg} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      <span className="capitalize">{label.replace(/_/g, ' ')}</span>
    </span>
  );
};
