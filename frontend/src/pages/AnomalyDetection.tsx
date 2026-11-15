import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ZAxis
} from 'recharts';
import { AnomalyItem } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const AnomalyDetection: React.FC = () => {
  const { addToast } = useToast();
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');
  const [reviewedFilter, setReviewedFilter] = useState<string>('all');

  // Review Modal
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);
  const [disposition, setDisposition] = useState<'legitimate' | 'suspicious' | 'confirmed_fraud'>('legitimate');
  const [auditorComments, setAuditorComments] = useState('');

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (riskFilter !== 'all') params.risk_level = riskFilter;
      if (reviewedFilter === 'unreviewed') params.is_reviewed = false;
      if (reviewedFilter === 'reviewed') params.is_reviewed = true;
      const data = await api.listAnomalies(params);
      setAnomalies(data);
    } catch (err: any) {
      addToast('error', 'Failed to fetch anomalies', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [riskFilter, reviewedFilter]);

  const handleRunModel = async () => {
    setIsRunning(true);
    try {
      const res = await api.runAnomalies();
      addToast('success', 'Isolation Forest Retrained', `Model evaluated transactions: detected ${res.anomalies_detected} behavioral outliers.`);
      fetchAnomalies();
    } catch (err: any) {
      addToast('error', 'Model Run Failed', err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleConfirmReview = async () => {
    if (!selectedAnomaly) return;
    try {
      await api.reviewAnomaly(selectedAnomaly.id, {
        auditor_disposition: disposition,
        auditor_comments: auditorComments || 'Auditor completed forensic anomaly review.',
      });
      addToast('success', 'Disposition Recorded', `Anomaly #${selectedAnomaly.id} marked as ${disposition.replace('_', ' ')}.`);
      setSelectedAnomaly(null);
      setAuditorComments('');
      fetchAnomalies();
    } catch (err: any) {
      addToast('error', 'Review Failed', err.message);
    }
  };

  // Prepare scatter chart data: X = Amount, Y = Anomaly Score
  const scatterData = anomalies.map((a) => ({
    id: a.id,
    amount: a.transaction?.amount || 0,
    score: a.anomaly_score,
    vendor: a.transaction?.vendor_name || 'Vendor',
    risk: a.risk_level,
  }));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Unsupervised Scikit-Learn Isolation Forest (n=100)</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Machine Learning Anomaly Detection</h2>
          <p className="text-xs text-slate-500">
            Multivariate statistical isolation on expenditure volume, vendor z-scores, velocity spikes, and off-cycle timing.
          </p>
        </div>

        <button
          onClick={handleRunModel}
          disabled={isRunning}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Fitting Isolation Forest...' : 'Retrain & Score Outliers'}</span>
        </button>
      </div>

      {/* Scatter Plot: Amount vs Anomaly Score */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Anomaly Score vs Expenditure Magnitude</h3>
            <p className="text-xs text-slate-500">Visual mapping of statistical outlier intensity across transaction values</p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Contamination Ratio: 8%
          </span>
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <XAxis
                type="number"
                dataKey="amount"
                name="Amount"
                unit="$"
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <YAxis
                type="number"
                dataKey="score"
                name="Anomaly Score"
                stroke="#94a3b8"
                fontSize={11}
                domain={[50, 100]}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                        <p className="font-bold">{data.vendor}</p>
                        <p className="text-slate-300">Amount: ${data.amount.toLocaleString()}</p>
                        <p className="text-purple-400 font-semibold">Anomaly Score: {data.score.toFixed(1)}/100</p>
                        <p className="text-slate-400 capitalize">Risk: {data.risk}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Anomalies" data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.risk === 'high' ? '#ef4444' : entry.risk === 'medium' ? '#f59e0b' : '#3b82f6'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Risk Severity:</span>
          {['all', 'high', 'medium', 'low'].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                riskFilter === r
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Auditor Status:</span>
          {['all', 'unreviewed', 'reviewed'].map((s) => (
            <button
              key={s}
              onClick={() => setReviewedFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                reviewedFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Anomaly Outliers Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Statistical Outlier Investigation Queue</h3>
            <p className="text-xs text-slate-500">Requires auditor review to confirm business rationale or investigate</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {anomalies.length} Flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tx ID</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Algorithmic Explainability Factors</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Auditor Disposition</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading ML anomaly results...</td>
                </tr>
              ) : anomalies.length > 0 ? (
                anomalies.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500">#{a.transaction_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {a.transaction?.vendor_name || 'Vendor N/A'}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      ${a.transaction?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-purple-700">
                        <span>{a.anomaly_score.toFixed(1)}</span>
                        <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${a.anomaly_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">
                      <p className="line-clamp-2">{a.anomaly_factors}</p>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={a.risk_level} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      {a.is_reviewed ? (
                        <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {a.auditor_disposition?.replace('_', ' ') || 'Reviewed'}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedAnomaly(a);
                          setDisposition((a.auditor_disposition as any) || 'legitimate');
                          setAuditorComments(a.auditor_comments || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition-colors"
                      >
                        {a.is_reviewed ? 'Edit' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No anomalies found for the active criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        title={`Forensic Review: Anomaly #${selectedAnomaly?.id}`}
        subtitle="Record your supervisory audit conclusion regarding this machine learning outlier"
        maxWidth="lg"
      >
        {selectedAnomaly && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  Transaction: ${selectedAnomaly.transaction?.amount.toFixed(2)} to {selectedAnomaly.transaction?.vendor_name}
                </span>
                <span className="font-bold text-purple-700">Score: {selectedAnomaly.anomaly_score.toFixed(1)}/100</span>
              </div>
              <p className="text-slate-600"><strong>Why flagged:</strong> {selectedAnomaly.anomaly_factors}</p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Auditor Disposition Classification</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'legitimate', label: 'Legitimate', desc: 'Valid approved business expense', icon: CheckCircle2, color: 'text-emerald-600' },
                  { id: 'suspicious', label: 'Suspicious', desc: 'Escalated to internal audit', icon: AlertTriangle, color: 'text-amber-600' },
                  { id: 'confirmed_fraud', label: 'Confirmed Fraud', desc: 'Critical compliance breach', icon: ShieldAlert, color: 'text-rose-600' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = disposition === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDisposition(item.id as any)}
                      className={`p-3 rounded-xl border text-left font-semibold transition-colors ${
                        isSel ? 'bg-purple-50 border-purple-300 text-purple-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${item.color}`} />
                      <span>{item.label}</span>
                      <p className="text-[10px] font-normal opacity-80 mt-0.5">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Auditor Review Comments</label>
              <textarea
                rows={3}
                value={auditorComments}
                onChange={(e) => setAuditorComments(e.target.value)}
                placeholder="Document your findings, verified contracts, or escalation details..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
              >
                Save Disposition
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
