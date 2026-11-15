import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
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
      addToast('error', 'Outlier index retrieval notice', err.message);
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
      addToast('success', 'Outlier Scoring Complete', `Evaluated ledger transactions: detected ${res.anomalies_detected} behavioral outliers.`);
      fetchAnomalies();
    } catch (err: any) {
      addToast('error', 'Analysis Notice', err.message);
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
      addToast('success', 'Disposition Recorded', `Outlier #${selectedAnomaly.id} marked as ${disposition.replace('_', ' ')}.`);
      setSelectedAnomaly(null);
      setAuditorComments('');
      fetchAnomalies();
    } catch (err: any) {
      addToast('error', 'Review Notice', err.message);
    }
  };

  // Prepare scatter chart data: X = Amount, Y = Outlier Score
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
      <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10 shadow-xl">
        <div>
          <h2 className="text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
            Statistical Outlier & Distribution Analysis
          </h2>
          <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
            Multi-variable statistical deviation scoring on expenditure volume, vendor velocity, and off-cycle timing
          </p>
        </div>

        <button
          onClick={handleRunModel}
          disabled={isRunning}
          className="h-11 px-5 rounded-2xl bg-[#FFC900] hover:bg-[#FFD733] text-[#08090B] font-bold text-xs transition-all shadow-md shadow-[#FFC900]/20 flex items-center space-x-2 disabled:opacity-50 shrink-0"
        >
          <span>{isRunning ? 'Scoring Deviations...' : 'Execute Outlier Analysis'}</span>
          <span className="font-mono text-xs">⚡</span>
        </button>
      </div>

      {/* Scatter Plot: Amount vs Outlier Score */}
      <div className="glass-card p-6 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold font-display text-[#F5F3EF]">
              Deviation Score vs Expenditure Volume
            </h3>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
              Visual mapping of statistical outlier intensity across transaction values
            </p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-[#FFC900] bg-[#FFC900]/15 border border-[#FFC900]/30 px-3 py-1 rounded-full">
            Outlier Ratio: 8%
          </span>
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <XAxis
                type="number"
                dataKey="amount"
                name="Amount"
                unit="₹"
                stroke="#F5F3EF"
                opacity={0.4}
                fontSize={10}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <YAxis
                type="number"
                dataKey="score"
                name="Deviation Score"
                stroke="#F5F3EF"
                opacity={0.4}
                fontSize={10}
                domain={[50, 100]}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-card p-3 shadow-2xl border border-white/20 text-xs space-y-1">
                        <p className="font-bold text-[#F5F3EF] font-display">{data.vendor}</p>
                        <p className="text-[#F5F3EF]/70 font-mono">Amount: ₹{data.amount.toLocaleString()}</p>
                        <p className="text-[#FFC900] font-mono font-bold">Deviation Score: {data.score.toFixed(1)}/100</p>
                        <p className="text-[#F5F3EF]/60 capitalize font-mono text-[10px]">Risk: {data.risk}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Outliers" data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.risk === 'high' ? '#FFC900' : entry.risk === 'medium' ? '#F5F3EF' : 'rgba(245, 243, 239, 0.4)'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3 border border-white/10 shadow-xl">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#F5F3EF]/60 font-sans">Risk Severity:</span>
          {['all', 'high', 'medium', 'low'].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold capitalize transition-all border ${
                riskFilter === r
                  ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900] shadow-sm shadow-[#FFC900]/20'
                  : 'glass-pill text-[#F5F3EF]/70 hover:text-[#F5F3EF] border-white/10'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#F5F3EF]/60 font-sans">Auditor Status:</span>
          {['all', 'unreviewed', 'reviewed'].map((s) => (
            <button
              key={s}
              onClick={() => setReviewedFilter(s)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold capitalize transition-all border ${
                reviewedFilter === s
                  ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900] shadow-sm shadow-[#FFC900]/20'
                  : 'glass-pill text-[#F5F3EF]/70 hover:text-[#F5F3EF] border-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Anomaly Outliers Table */}
      <div className="glass-card overflow-hidden border border-white/10 shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-[#F5F3EF] tracking-tight">
              Statistical Outlier Investigation Queue
            </h3>
            <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
              Requires auditor verification to confirm commercial rationale or investigate
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#F5F3EF] bg-white/10 border border-white/10 px-3 py-1 rounded-full">
            {anomalies.length} Flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5F3EF]/50 bg-white/[0.02]">
                <th className="py-3 px-5">Tx ID</th>
                <th className="py-3 px-5">Vendor</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Deviation Score</th>
                <th className="py-3 px-5">Statistical Factors</th>
                <th className="py-3 px-5">Risk</th>
                <th className="py-3 px-5">Auditor Disposition</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#F5F3EF]/40 font-mono">
                    Evaluating statistical distribution...
                  </td>
                </tr>
              ) : anomalies.length > 0 ? (
                anomalies.map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3.5 px-5 font-mono font-semibold text-[#F5F3EF]/60">#{a.transaction_id}</td>
                    <td className="py-3.5 px-5 font-bold text-[#F5F3EF]">
                      {a.transaction?.vendor_name || 'Vendor N/A'}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#F5F3EF]">
                      ₹{a.transaction?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2 font-mono font-bold text-[#F5F3EF]">
                        <span>{a.anomaly_score.toFixed(1)}</span>
                        <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#FFC900] rounded-full"
                            style={{ width: `${a.anomaly_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#F5F3EF]/80 max-w-md">
                      <p className="line-clamp-2">{a.anomaly_factors}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={a.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-5">
                      {a.is_reviewed ? (
                        <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#F5F3EF] text-[#08090B]">
                          {a.auditor_disposition?.replace('_', ' ') || 'Reviewed'}
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono font-semibold text-[#FFC900] bg-[#FFC900]/15 px-2 py-0.5 rounded-full border border-[#FFC900]/30">
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => {
                          setSelectedAnomaly(a);
                          setDisposition((a.auditor_disposition as any) || 'legitimate');
                          setAuditorComments(a.auditor_comments || '');
                        }}
                        className="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-[#F5F3EF] hover:bg-[#FFC900] hover:text-[#08090B] transition-colors border border-white/10"
                      >
                        {a.is_reviewed ? 'Edit' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#F5F3EF]/40 font-mono">
                    No outliers found for the active criteria.
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
        title={`Audit Review: Outlier #${selectedAnomaly?.id}`}
        subtitle="Record your supervisory conclusion regarding this transaction's statistical deviation"
        maxWidth="lg"
      >
        {selectedAnomaly && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-4 rounded-2xl glass-soft border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F5F3EF] font-display text-sm">
                  Transaction: ₹{selectedAnomaly.transaction?.amount.toFixed(2)} to {selectedAnomaly.transaction?.vendor_name}
                </span>
                <span className="font-mono font-bold text-[#FFC900]">Deviation Score: {selectedAnomaly.anomaly_score.toFixed(1)}/100</span>
              </div>
              <p className="text-[#F5F3EF]/80 font-mono"><strong>Deviation reason:</strong> {selectedAnomaly.anomaly_factors}</p>
            </div>

            <div>
              <label className="font-semibold text-[#F5F3EF] block mb-1">Auditor Disposition Classification</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'legitimate', label: 'Legitimate', desc: 'Authorized commercial expense' },
                  { id: 'suspicious', label: 'Flagged for Inquiry', desc: 'Escalated to internal control' },
                  { id: 'confirmed_fraud', label: 'Confirmed Variance', desc: 'Critical compliance non-conformance' },
                ].map((item) => {
                  const isSel = disposition === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDisposition(item.id as any)}
                      className={`p-3 rounded-2xl border text-left font-semibold transition-all ${
                        isSel
                          ? 'bg-[#FFC900] border-[#FFC900] text-[#08090B] font-bold shadow-sm'
                          : 'glass-pill text-[#F5F3EF] border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="text-xs block font-bold">{item.label}</span>
                      <p className="text-[10px] font-normal opacity-70 mt-0.5">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#F5F3EF] block mb-1">Auditor Review Comments</label>
              <textarea
                rows={3}
                value={auditorComments}
                onChange={(e) => setAuditorComments(e.target.value)}
                placeholder="Document your findings, verified contracts, or escalation details..."
                className="w-full glass-input rounded-xl p-3 text-xs text-[#F5F3EF] border border-white/10"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="px-4 py-2 rounded-2xl glass-pill text-xs font-semibold text-[#F5F3EF] border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                className="px-5 py-2 rounded-2xl bg-[#FFC900] text-[#08090B] font-bold text-xs hover:bg-[#FFD733] transition-colors"
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
