import React, { useState, useEffect } from 'react';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowUpRight,
  ShieldAlert,
  BarChart2,
  DollarSign,
  TrendingUp,
  FileText
} from 'lucide-react';
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
  const [vendorDetailLoading, setVendorDetailLoading] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await api.listVendors();
      setVendors(data);
    } catch (err: any) {
      addToast('error', 'Failed to fetch vendor analytics', err.message);
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
      addToast('error', 'Error loading vendor detail', err.message);
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
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Counterparty Spend Surveillance & Risk Profiling</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Vendor Risk & Expenditure Analysis</h2>
          <p className="text-xs text-slate-500">
            Multi-factor supplier risk indicators computed from duplicate payment frequency, ledger variances, and spend concentration.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vendor or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:border-teal-500"
          />
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200/90">
            Loading vendor risk matrix...
          </div>
        ) : filteredVendors.length > 0 ? (
          filteredVendors.map((vendor) => {
            const riskBg =
              vendor.risk_rating === 'high'
                ? 'border-rose-200/80 hover:border-rose-300'
                : vendor.risk_rating === 'medium'
                ? 'border-amber-200/80 hover:border-amber-300'
                : 'border-slate-200/90 hover:border-slate-300';

            return (
              <div
                key={vendor.id}
                onClick={() => openVendorDetail(vendor)}
                className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between ${riskBg}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{vendor.name}</h4>
                      <span className="text-[11px] text-slate-500">{vendor.category}</span>
                    </div>
                    <StatusBadge status={vendor.risk_rating} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Spend</span>
                      <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                        ${vendor.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Transactions</span>
                      <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                        {vendor.transaction_count}
                      </span>
                    </div>
                  </div>

                  {vendor.duplicate_count > 0 && (
                    <div className="mt-3 p-2 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>{vendor.duplicate_count} duplicate payment incident(s) flagged</span>
                    </div>
                  )}

                  <div className="mt-3 text-[11px] text-slate-500">
                    <strong className="text-slate-700">Risk Factors:</strong> {vendor.risk_reasons || 'Clean historical compliance'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Terms: {vendor.payment_terms}</span>
                  <span className="text-blue-600 font-semibold flex items-center gap-1">
                    Drilldown <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            No vendors found matching search term.
          </div>
        )}
      </div>

      {/* Vendor Drilldown Modal */}
      <Modal
        isOpen={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
        title={`Vendor Profile: ${selectedVendor?.name || ''}`}
        subtitle="Cumulative expenditure history, monthly trends, and audit risk factors"
        maxWidth="2xl"
      >
        {selectedVendor && (
          <div className="space-y-4 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Spend</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  ${selectedVendor.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Vouchers</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">{selectedVendor.transaction_count}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Risk Assessment</span>
                <div className="mt-1">
                  <StatusBadge status={selectedVendor.risk_rating} size="sm" />
                </div>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            {selectedVendor.monthly_trend && selectedVendor.monthly_trend.length > 0 && (
              <div className="p-4 bg-white rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 mb-2">Monthly Expenditure Velocity</h4>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedVendor.monthly_trend}>
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip
                        formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Spend']}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                      />
                      <Bar dataKey="amount" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Risk Reasoning */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Explainable Risk Factors</span>
              <p className="text-slate-600">{selectedVendor.risk_reasons || 'No active risk exceptions detected for this supplier.'}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
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
