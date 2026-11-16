import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [highRiskThreshold, setHighRiskThreshold] = useState('25000');
  const [mediumRiskThreshold, setMediumRiskThreshold] = useState('5000');
  const [contaminationRatio, setContaminationRatio] = useState('0.08');
  const [fuzzyThreshold, setFuzzyThreshold] = useState('0.82');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Controls Updated', 'Institutional audit materiality thresholds and reconciliation tolerances saved.');
  };

  return (
    <div className="space-y-6 max-w-4xl pb-8">
      {/* Banner */}
      <div className="glass-card p-4 sm:p-6 border border-white/10 shadow-xl">
        <h2 className="text-base sm:text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
          Audit Controls & Materiality Parameters
        </h2>
        <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
          Configure financial materiality thresholds, outlier sensitivity coefficients, and reconciliation matching tolerances
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Risk Thresholds */}
        <div className="glass-card p-4 sm:p-6 space-y-4 border border-white/10 shadow-xl">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold font-display text-[#F5F3EF]">Financial Materiality Limits</h3>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">Defines variance levels for mandatory forensic workpaper escalation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="font-semibold text-[#F5F3EF] block mb-1">
                High-Risk Materiality Amount (₹)
              </label>
              <input
                type="number"
                value={highRiskThreshold}
                onChange={(e) => setHighRiskThreshold(e.target.value)}
                className="w-full h-11 glass-input rounded-2xl px-3.5 text-xs text-[#F5F3EF] font-mono border border-white/10"
              />
              <p className="text-[11px] text-[#F5F3EF]/50 font-mono mt-1">Discrepancies exceeding this value require supervisory partner sign-off.</p>
            </div>

            <div>
              <label className="font-semibold text-[#F5F3EF] block mb-1">
                Medium-Risk Materiality Amount (₹)
              </label>
              <input
                type="number"
                value={mediumRiskThreshold}
                onChange={(e) => setMediumRiskThreshold(e.target.value)}
                className="w-full h-11 glass-input rounded-2xl px-3.5 text-xs text-[#F5F3EF] font-mono border border-white/10"
              />
              <p className="text-[11px] text-[#F5F3EF]/50 font-mono mt-1">Baseline threshold for vendor voucher variance inquiries.</p>
            </div>
          </div>
        </div>

        {/* Statistical Scoring Settings */}
        <div className="glass-card p-4 sm:p-6 space-y-4 border border-white/10 shadow-xl">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold font-display text-[#F5F3EF]">Statistical Outlier & Matching Tolerances</h3>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">Algorithmic parameter tuning for distribution surveillance and fuzzy deduplication</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="font-semibold text-[#F5F3EF] block mb-1">
                Outlier Sensitivity Coefficient
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="0.25"
                value={contaminationRatio}
                onChange={(e) => setContaminationRatio(e.target.value)}
                className="w-full h-11 glass-input rounded-2xl px-3.5 text-xs text-[#F5F3EF] font-mono border border-white/10"
              />
              <p className="text-[11px] text-[#F5F3EF]/50 font-mono mt-1">Expected proportion of statistical outliers in transaction distribution (default 0.08 = 8%).</p>
            </div>

            <div>
              <label className="font-semibold text-[#F5F3EF] block mb-1">
                Fuzzy Match Similarity Threshold
              </label>
              <input
                type="number"
                step="0.01"
                min="0.5"
                max="0.99"
                value={fuzzyThreshold}
                onChange={(e) => setFuzzyThreshold(e.target.value)}
                className="w-full h-11 glass-input rounded-2xl px-3.5 text-xs text-[#F5F3EF] font-mono border border-white/10"
              />
              <p className="text-[11px] text-[#F5F3EF]/50 font-mono mt-1">Minimum similarity for fuzzy matching vendor names and invoice references (default 0.82).</p>
            </div>
          </div>
        </div>

        {/* Entity & Auditor Profile */}
        <div className="glass-card p-4 sm:p-6 space-y-4 border border-white/10 shadow-xl">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold font-display text-[#F5F3EF]">Audited Entity & Practitioner Sign-off</h3>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">Certified institution details stamped on published audit workpapers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div className="p-3.5 rounded-2xl glass-soft border border-white/10">
              <span className="font-mono text-[10px] uppercase font-bold text-[#F5F3EF]/50 block">Audited Entity</span>
              <p className="text-sm font-bold text-[#F5F3EF] font-display mt-0.5">{user?.company_name || 'Acme Global Enterprise'}</p>
            </div>
            <div className="p-3.5 rounded-2xl glass-soft border border-white/10">
              <span className="font-mono text-[10px] uppercase font-bold text-[#F5F3EF]/50 block">Lead Auditor</span>
              <p className="text-sm font-bold text-[#F5F3EF] font-display mt-0.5">{user?.full_name || 'Sarah Jenkins'}</p>
            </div>
            <div className="p-3.5 rounded-2xl glass-soft border border-white/10">
              <span className="font-mono text-[10px] uppercase font-bold text-[#F5F3EF]/50 block">Assurance Level</span>
              <p className="text-sm font-bold font-mono text-[#FFC900] mt-0.5">{user?.role?.toUpperCase() || 'LEAD PARTNER'}</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="h-12 px-6 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold text-xs shadow-md shadow-[#FFC900]/20 transition-all flex items-center justify-center space-x-2 w-full sm:w-auto active:scale-95 touch-manipulation"
          >
            <span>Save Control Configuration</span>
            <span className="font-mono text-xs">✓</span>
          </button>
        </div>
      </form>
    </div>
  );
};
