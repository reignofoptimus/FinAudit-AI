import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

/**
 * Status pill strictly following the 3-colour palette on dark frosted glass:
 * - Pure White on Midnight Black for 'Completed' / 'Matched' / 'Verified' / 'Clean'
 * - Golden Yellow on Golden Yellow/opacity for 'Processing' / 'Review' / 'Flagged' / 'Medium'
 * - Light Neutral Frosted on White/opacity for 'Pending' / 'Draft' / 'Critical' / 'High'
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toLowerCase().trim();

  let style = 'bg-[#F5F3EF] text-[#08090B] font-bold border border-white/60 shadow-xs'; // Completed / matched default
  let dot = 'bg-[#08090B]';

  if (
    norm === 'processing' ||
    norm === 'review' ||
    norm === 'in review' ||
    norm === 'flagged' ||
    norm === 'medium' ||
    norm === 'partial' ||
    norm === 'discrepancy' ||
    norm === 'action required'
  ) {
    // Golden Yellow on Golden Yellow / opacity
    style = 'bg-[#FFC900]/15 text-[#FFC900] border border-[#FFC900]/40 shadow-xs';
    dot = 'bg-[#FFC900]';
  } else if (
    norm === 'completed' ||
    norm === 'clean' ||
    norm === 'matched' ||
    norm === 'confirmed' ||
    norm === 'resolved' ||
    norm === 'verified' ||
    norm === 'active' ||
    norm === 'paid'
  ) {
    // Pure White background with Midnight Black text
    style = 'bg-[#F5F3EF] text-[#08090B] font-bold border border-white shadow-xs';
    dot = 'bg-[#08090B]';
  } else if (
    norm === 'pending' ||
    norm === 'draft' ||
    norm === 'unmatched' ||
    norm === 'suggested' ||
    norm === 'high' ||
    norm === 'critical' ||
    norm === 'fraud' ||
    norm === 'rejected'
  ) {
    // White/opacity pill on dark glass
    style = 'bg-white/10 text-[#F5F3EF] border border-white/20 shadow-xs';
    dot = 'bg-[#FFC900]';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${style} ${px} font-mono uppercase tracking-wider`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  );
};
