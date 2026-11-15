import React, { ReactNode } from 'react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: string;
  isPositive?: boolean;
  badge?: string;
  badgeVariant?: 'warning' | 'alert' | 'neutral' | 'default';
  icon: ReactNode;
  sparklineData?: number[];
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  delta,
  isPositive = true,
  badge,
  badgeVariant = 'warning',
  icon,
  sparklineData = [10, 14, 12, 18, 16, 22, 28],
  onClick,
}) => {
  // Normalize sparkline data to fit 0-20 height and 0-100 width
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * 100;
      const y = 20 - ((val - min) / range) * 16 - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const getBadgeClass = () => {
    switch (badgeVariant) {
      case 'alert':
        return 'bg-white/15 text-[#F5F3EF] border border-white/20';
      case 'neutral':
        return 'bg-white/10 text-[#F5F3EF] border border-white/15';
      case 'warning':
      default:
        return 'bg-[#FFC900]/20 text-[#FFC900] border border-[#FFC900]/40';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-200 border border-white/10 ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-[#FFC900]/50 hover:shadow-xl' : ''
      }`}
    >
      {/* Top Row: Label (left) + Tinted Icon Chip (right) */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#F5F3EF]/60">
          {title}
        </p>

        {/* Tinted icon chip */}
        <div className="w-10 h-10 rounded-2xl bg-[#FFC900]/15 border border-[#FFC900]/30 flex items-center justify-center text-[#FFC900] shrink-0">
          {icon}
        </div>
      </div>

      {/* Middle Row: Big Mono Number + Optional Badge / Delta Pill */}
      <div className="flex items-baseline justify-between gap-2 my-1">
        <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F5F3EF] tracking-tight">
          {value}
        </div>

        {badge && (
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${getBadgeClass()}`}>
            {badge}
          </span>
        )}

        {delta && !badge && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FFC900]/20 text-[#FFC900] border border-[#FFC900]/30">
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{delta}</span>
          </span>
        )}
      </div>

      {/* Bottom Row: Subtitle + Mini Sparkline */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        {subtitle && (
          <span className="text-xs font-sans text-[#F5F3EF]/60 truncate font-medium">
            {subtitle}
          </span>
        )}

        {sparklineData && sparklineData.length > 0 && (
          <div className="w-16 h-4 shrink-0">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#FFC900"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
