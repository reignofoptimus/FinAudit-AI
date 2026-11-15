import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { VendorItem } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const VendorAnalysis: React.FC = () => {
  const { addToast } = useToast();
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);
  const [, setVendorDetailLoading] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await api.listVendors();
      setVendors(data);
    } catch (err: any) {
      addToast('error', 'Counterparty index retrieval notice', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openVendorDetail = async (v: VendorItem) => {
    setSelectedVendor(v);
    setVendorDetailLoading(true);
    try {
      const detailed = await api.getVendor(v.id);
      setSelectedVendor(detailed);
    } catch (err: any) {
      addToast('error', 'Error loading counterparty detail', err.message);
    } finally {
      setVendorDetailLoading(false);
    }
  };

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10 shadow-xl">
        <div>
          <h2 className="text-lg font-bold font-display text-[#F5F3EF] tracking-tight">
            Counterparty Spend & Risk Surveillance
          </h2>
          <p className="text-xs text-[#F5F3EF]/60 font-sans mt-0.5">
            Multi-factor supplier risk indicators computed from duplicate payment frequency, ledger variances, and spend concentration
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5F3EF]/40">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search vendor or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl glass-input text-xs font-sans text-[#F5F3EF] placeholder-[#F5F3EF]/40 border border-white/10"
          />
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs font-mono text-[#F5F3EF]/40 glass-card border border-white/10">
            Loading counterparty risk matrix...
          </div>
        ) : filteredVendors.length > 0 ? (
          filteredVendors.map((vendor) => {
            return (
              <div
                key={vendor.id}
                onClick={() => openVendorDetail(vendor)}
                className="glass-card p-6 cursor-pointer hover:border-[#FFC900]/50 transition-all flex flex-col justify-between border border-white/10 shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2 pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-bold font-display text-[#F5F3EF] line-clamp-1">{vendor.name}</h4>
                      <span className="text-[11px] font-mono text-[#F5F3EF]/60">{vendor.category}</span>
                    </div>
                    <StatusBadge status={vendor.risk_rating} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2 text-xs font-sans">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-[#F5F3EF]/50 block">Total Spend</span>
                      <span className="text-base font-bold font-mono text-[#F5F3EF] block mt-0.5">
                        ₹{vendor.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-[#F5F3EF]/50 block">Transactions</span>
                      <span className="text-base font-bold font-mono text-[#F5F3EF] block mt-0.5">
                        {vendor.transaction_count}
                      </span>
                    </div>
                  </div>

                  {vendor.duplicate_count > 0 && (
                    <div className="mt-3 p-2.5 bg-[#FFC900]/15 rounded-2xl border border-[#FFC900]/30 text-[11px] text-[#FFC900] flex items-center gap-1.5 font-mono font-semibold">
                      <span>⚠</span>
                      <span>{vendor.duplicate_count} duplicate incident(s) flagged</span>
                    </div>
                  )}

                  <div className="mt-3 text-[11px] text-[#F5F3EF]/70 font-sans">
                    <strong className="text-[#F5F3EF]">Compliance Profile:</strong> {vendor.risk_reasons || 'Clean historical compliance'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-[#F5F3EF]/50">Terms: {vendor.payment_terms}</span>
                  <span className="text-[#FFC900] font-semibold flex items-center gap-1 hover:text-[#FFD733]">
                    <span>Inspect</span>
                    <span className="font-mono text-xs">→</span>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 py-12 text-center text-xs font-mono text-[#F5F3EF]/40 glass-card border border-white/10">
            No vendors found matching search term.
          </div>
        )}
      </div>

      {/* Vendor Drilldown Modal */}
      <Modal
        isOpen={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
        title={`Counterparty Profile: ${selectedVendor?.name || ''}`}
        subtitle="Cumulative expenditure history, monthly trends, and audit risk factors"
        maxWidth="2xl"
      >
        {selectedVendor && (
          <div className="space-y-4 text-xs font-sans">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl glass-soft border border-white/10">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-[#F5F3EF]/50">Total Spend</span>
                <p className="text-base font-bold font-mono text-[#F5F3EF] mt-0.5">
                  ₹{selectedVendor.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-[#F5F3EF]/50">Total Vouchers</span>
                <p className="text-base font-bold font-mono text-[#F5F3EF] mt-0.5">{selectedVendor.transaction_count}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-[#F5F3EF]/50">Risk Assessment</span>
                <div className="mt-1">
                  <StatusBadge status={selectedVendor.risk_rating} size="sm" />
                </div>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            {selectedVendor.monthly_trend && selectedVendor.monthly_trend.length > 0 && (
              <div className="p-4 rounded-2xl glass-soft border border-white/10">
                <h4 className="text-xs font-bold font-display text-[#F5F3EF] mb-2">Monthly Expenditure Velocity</h4>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedVendor.monthly_trend}>
                      <XAxis dataKey="month" stroke="#F5F3EF" opacity={0.4} fontSize={10} tickLine={false} />
                      <YAxis stroke="#F5F3EF" opacity={0.4} fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Spend']}
                        contentStyle={{ backgroundColor: '#08090B', borderRadius: '12px', color: '#F5F3EF', fontSize: '11px', border: '1px solid rgba(255,255,255,0.2)' }}
                      />
                      <Bar dataKey="amount" fill="#FFC900" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Risk Reasoning */}
            <div className="p-4 rounded-2xl glass-soft border border-white/10">
              <span className="font-bold text-[#F5F3EF] block mb-1">Explainable Factors</span>
              <p className="text-[#F5F3EF]/80 font-mono text-[11px]">{selectedVendor.risk_reasons || 'No active risk exceptions detected for this supplier.'}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedVendor(null)}
                className="px-5 py-2 rounded-2xl bg-[#FFC900] text-[#08090B] font-bold text-xs hover:bg-[#FFD733] transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
