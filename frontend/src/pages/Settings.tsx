import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  ShieldCheck,
  Building,
  Key,
  Save,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [highRiskThreshold, setHighRiskThreshold] = useState('25000');
  const [mediumRiskThreshold, setMediumRiskThreshold] = useState('5000');
  const [contaminationRatio, setContaminationRatio] = useState('0.08');
  const [fuzzyThreshold, setFuzzyThreshold] = useState('0.82');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Settings Saved', 'Audit risk thresholds and model configuration updated.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-slate-600" />
          <span>Audit Controls & Algorithmic Parameters</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Fine-tune materiality thresholds, Isolation Forest contamination factors, and AI explanation providers.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Risk Thresholds */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Financial Materiality Thresholds</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                High-Risk Materiality Amount ($)
              </label>
              <input
                type="number"
                value={highRiskThreshold}
                onChange={(e) => setHighRiskThreshold(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Discrepancies above this amount receive mandatory high-risk classification.</p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Medium-Risk Materiality Amount ($)
              </label>
              <input
                type="number"
                value={mediumRiskThreshold}
                onChange={(e) => setMediumRiskThreshold(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Baseline threshold for voucher variance investigations.</p>
            </div>
          </div>
        </div>

        {/* Machine Learning Model Settings */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Machine Learning & Anomaly Tuning</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Isolation Forest Contamination Ratio
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="0.25"
                value={contaminationRatio}
                onChange={(e) => setContaminationRatio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Expected proportion of outliers in transaction distribution (default 0.08 = 8%).</p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Fuzzy Match Similarity Threshold
              </label>
              <input
                type="number"
                step="0.01"
                min="0.5"
                max="0.99"
                value={fuzzyThreshold}
                onChange={(e) => setFuzzyThreshold(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Minimum similarity for fuzzy matching vendor names and invoice references (default 0.82).</p>
            </div>
          </div>
        </div>

        {/* Entity & Auditor Profile */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Audited Entity & Practitioner Sign-off</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-500 block">Company Name</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{user?.company_name || 'Acme Global Enterprise'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Lead Auditor</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{user?.full_name || 'Sarah Jenkins'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Practitioner Role</span>
              <p className="text-sm font-bold text-teal-600 capitalize mt-0.5">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
