"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { useUserRole } from "../hooks/useUserRole";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type SummaryRow = { month_year: string; status: string; buyer: string | null; jumlah_kapal: number };

const STATUSES = ['completed', 'loading', 'waiting', 'carry_over_to_next_month'] as const;

const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}> = {
  completed: {
    label: 'Completed',
    color: '#10b981',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  loading: {
    label: 'Loading',
    color: '#3b82f6',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  waiting: {
    label: 'Waiting',
    color: '#f97316',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  carry_over_to_next_month: {
    label: 'Carry Over',
    color: '#8b5cf6',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
};

const DONUT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6'];
const NO_BUYER_COLOR = '#9ca3af';

// ─── Tooltip (module-level, stable reference) ─────────────────────────────────
const VesselDonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="px-3 py-2 rounded-lg shadow-lg text-xs font-semibold text-white" style={{ backgroundColor: '#1e293b', whiteSpace: 'nowrap' }}>
      <div className="text-gray-300 font-normal mb-0.5">{d.name}</div>
      <div>{d.value} kapal</div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ status, count, loading }: { status: string; count: number; loading: boolean }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className={`bg-white rounded-xl border ${cfg.border} shadow-sm p-4 flex items-center gap-4`}>
      <div className={`${cfg.bg} rounded-xl p-3 flex-shrink-0`} style={{ color: cfg.color }}>
        {cfg.icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{cfg.label}</p>
        {loading ? (
          <div className="h-7 w-12 bg-gray-100 animate-pulse rounded mt-1" />
        ) : (
          <p className="text-2xl font-extrabold mt-0.5" style={{ color: cfg.color }}>{count}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-0.5">kapal</p>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VesselStatusPage() {
  const { isLoading } = useUserRole();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof STATUSES[number]>('completed');

  useEffect(() => {
    if (!isLoading) fetchData(selectedYear);
  }, [selectedYear, isLoading]);

  const fetchData = async (year: number) => {
    setDataLoading(true);
    try {
      const res = await fetch(`/api/vessel-summary-status?year=${year}`);
      if (res.ok) setRows(await res.json());
    } catch { }
    setDataLoading(false);
  };

  // ── Status counts ────────────────────────────────────────────────────────
  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = rows.filter(r => r.status === s).reduce((sum, r) => sum + r.jumlah_kapal, 0);
    return acc;
  }, {} as Record<string, number>);

  // ── Donut: rows for activeTab, grouped by buyer, sorted desc ────────────
  const tabRows = rows.filter(r => r.status === activeTab);
  const buyerMap = new Map<string, number>();
  tabRows.forEach(r => {
    const b = r.buyer || 'No Buyer';
    buyerMap.set(b, (buyerMap.get(b) ?? 0) + r.jumlah_kapal);
  });
  const donutData = Array.from(buyerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      color: name === 'No Buyer' ? NO_BUYER_COLOR : DONUT_COLORS[i % DONUT_COLORS.length],
    }));
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);
  const activeCfg = STATUS_CONFIG[activeTab];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f1f2f7' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white shadow-sm flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-[#273240]">Vessel Status Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Ringkasan status kapal per tahun</p>
          </div>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── 4 Stat Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATUSES.map(s => (
              <StatCard key={s} status={s} count={statusCounts[s] ?? 0} loading={dataLoading} />
            ))}
          </div>

          {/* ── Donut Chart Card ──────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">

            {/* Tab pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {STATUSES.map(s => {
                const cfg = STATUS_CONFIG[s];
                const isActive = activeTab === s;
                return (
                  <button
                    key={s}
                    onClick={() => setActiveTab(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isActive ? 'text-white border-transparent shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                    }`}
                    style={isActive ? { backgroundColor: cfg.color } : {}}
                  >
                    <span style={{ color: isActive ? 'white' : cfg.color }}>{cfg.icon}</span>
                    {cfg.label}
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {statusCounts[s] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Title */}
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-800">{activeCfg.label} Vessels by Buyer</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Distribusi kapal <span className="font-medium" style={{ color: activeCfg.color }}>{activeCfg.label.toLowerCase()}</span> berdasarkan buyer — {selectedYear}
              </p>
            </div>

            {dataLoading ? (
              <div className="flex items-center justify-center h-56">
                <div className="w-36 h-36 bg-gray-100 animate-pulse rounded-full" />
              </div>
            ) : donutData.length === 0 || donutTotal === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 gap-2">
                <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-400">No data available for this status</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-6">

                {/* Donut — compact 250px */}
                <div className="relative flex-shrink-0" style={{ width: 250, height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        key={`${activeTab}-${selectedYear}`}
                        data={donutData}
                        cx="50%" cy="50%"
                        innerRadius="54%" outerRadius="76%"
                        dataKey="value"
                        paddingAngle={2}
                        labelLine={false}
                        label={false}
                        isAnimationActive
                        animationBegin={0}
                        animationDuration={600}
                        animationEasing="ease-out"
                      >
                        {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <ReTooltip content={<VesselDonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div
                    key={`${activeTab}-${selectedYear}-lbl`}
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    style={{ animation: 'fadeIn 0.5s ease-out' }}
                  >
                    <span className="text-3xl font-extrabold leading-none" style={{ color: activeCfg.color }}>{donutTotal}</span>
                    <span className="text-[11px] text-gray-400 mt-1 font-medium">Total {activeCfg.label}</span>
                  </div>
                </div>

                {/* Legend table */}
                <div className="flex-1 w-full min-w-0">
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {donutData.map(d => {
                      const pct = donutTotal > 0 ? ((d.value / donutTotal) * 100).toFixed(1) : '0';
                      return (
                        <div key={d.name} className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-sm text-gray-700 flex-1 truncate font-medium" title={d.name}>{d.name}</span>
                          <span className="text-sm font-bold text-gray-800 flex-shrink-0">{d.value}</span>
                          <div className="w-20 flex-shrink-0">
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 w-9 text-right flex-shrink-0">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
