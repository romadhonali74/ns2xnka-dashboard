"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { useUserRole } from "../hooks/useUserRole";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const CATEGORIES = ['HMA','PREMIUM','HPM','HARGA JUAL'];

type PriceData = { [kategori: string]: { [key: string]: string } };

export default function SalesMarketingPage() {
  const { isSuperAdmin, isLoading } = useUserRole();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [priceData, setPriceData] = useState<PriceData>({});
  const [loading, setLoading] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Dark mode token helper — defined first so tooltips can use it
  const dk = (light: string, dark: string) => darkMode ? dark : light;
  const tooltipBg = darkMode ? '#0f172a' : '#1e293b';

  const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="px-3 py-2 rounded-lg shadow-lg text-xs font-semibold text-white" style={{ backgroundColor: tooltipBg, whiteSpace: 'nowrap', border: darkMode ? '1px solid #334155' : 'none' }}>
        <div className="text-gray-300 font-normal mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color: p.fill }}>
            {p.dataKey === 'p1' ? 'Periode I' : 'Periode II'}: {p.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        ))}
      </div>
    );
  };
  const KapalTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="px-3 py-2 rounded-lg shadow-lg text-xs font-semibold text-white" style={{ backgroundColor: tooltipBg, whiteSpace: 'nowrap', border: darkMode ? '1px solid #334155' : 'none' }}>
        <div className="text-gray-300 font-normal mb-0.5">{d.name}</div>
        <div>{d.value} kapal</div>
      </div>
    );
  };
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: string } | null>(null);
  type SummaryRow = { month_year: string; status: string; buyer: string | null; jumlah_kapal: number };
  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([]);
  const [kapalLoading, setKapalLoading] = useState<boolean>(false);
  const [donutTab, setDonutTab] = useState<'status' | 'buyer'>('status');

  type YTDRow = { remarks: string; plan_value: number; realisasi_progress: number; percentage: number };
  type YTDTableData = { remarks: string; plan2025: string; realisasiProgress: string; percentage: string };
  const [ytdData, setYtdData] = useState<YTDRow[]>([]);
  const [ytdYearTotals, setYtdYearTotals] = useState<{ plan: number; real: number }>({ plan: 0, real: 0 });
  const [ytdLoading, setYtdLoading] = useState(false);

  const format3 = (n: number) => n.toLocaleString('en-US', { useGrouping: true, minimumFractionDigits: 3, maximumFractionDigits: 3 });

  const fetchYtd = async (year: number) => {
    setYtdLoading(true);
    try {
      const [ytdRes, totalRes] = await Promise.all([
        fetch('/api/realisasi-pengapalan/ytd-realisasi-pengapalan'),
        fetch(`/api/vessel-status-total?year=${year}`),
      ]);
      if (ytdRes.ok) setYtdData(await ytdRes.json());
      let plan = 0, real = 0;
      if (totalRes.ok) { const r = await totalRes.json(); real = r.data?.total || 0; }
      for (let m = 1; m <= 12; m++) {
        try {
          const res = await fetch(`/api/daily-operations?month=${year}-${String(m).padStart(2,'0')}`);
          if (res.ok) {
            const days = await res.json();
            const tgt = days.find((d: any) => typeof d.target === 'number')?.target ?? 0;
            plan += tgt;
          }
        } catch { }
      }
      setYtdYearTotals({ plan, real });
    } catch { }
    setYtdLoading(false);
  };

  const fetchVesselDonut = async (year: number) => {
    setKapalLoading(true);
    try {
      const res = await fetch(`/api/vessel-summary-status?year=${year}`);
      if (res.ok) setSummaryRows(await res.json());
    } catch { }
    setKapalLoading(false);
  };

  // Fetch data from database
  useEffect(() => {
    if (!isLoading) {
      fetchPriceData();
      fetchVesselDonut(selectedYear);
      fetchYtd(selectedYear);
    }
  }, [selectedYear, isLoading]);

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/price-monthly?year=${selectedYear}`);
      const data = await res.json();
      if (!res.ok) {
        console.error('price-monthly API error:', data);
        setPriceData({});
        return;
      }
      
      const formatted: PriceData = {};
      data.forEach((row: any) => {
        const key = `${row.month}_${row.periode}`;
        if (!formatted.HMA) formatted.HMA = {};
        if (!formatted.PREMIUM) formatted.PREMIUM = {};
        if (!formatted.HPM) formatted.HPM = {};
        if (!formatted['HARGA JUAL']) formatted['HARGA JUAL'] = {};
        
        formatted.HMA[key] = row.hma ? String(row.hma) : '-';
        formatted.PREMIUM[key] = row.premium ? String(row.premium) : '-';
        formatted.HPM[key] = row.hpm ? String(row.hpm) : '-';
        formatted['HARGA JUAL'][key] = row.harga_jual ? String(row.harga_jual) : '-';
      });
      
      setPriceData(formatted);
    } catch (error) {
      console.error('Error fetching price data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartDataPeriode = (kategori: string, periode: number) => {
    const values: number[] = [];
    for (let m = 1; m <= 12; m++) {
      const val = priceData[kategori]?.[`${m}_${periode}`];
      const num = val && val !== '-' ? parseFloat(val) : 0;
      values.push(num);
    }
    return values;
  };

  const getFilledMonths = (kategori: string) => {
    const filledMonths: number[] = [];
    for (let m = 1; m <= 12; m++) {
      const val1 = priceData[kategori]?.[`${m}_1`];
      const val2 = priceData[kategori]?.[`${m}_2`];
      const hasData = (val1 && val1 !== '-') || (val2 && val2 !== '-');
      if (hasData) filledMonths.push(m - 1); // 0-indexed
    }
    return filledMonths;
  };

  // Fixed scale with yMin support: top=y20, bottom=y150, range=130px
  const toY = (v: number, yMax: number, yMin: number = 0) => 165 - ((v - yMin) / (yMax - yMin)) * 130;

  // Point 1: full number format (no abbreviation)
  const fmtLabel = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });

  const renderBarChart = (kategori: string, color1: string, color2: string, yMax: number, yMin: number = 0) => {
    const rawValues1 = getChartDataPeriode(kategori, 1);
    const rawValues2 = getChartDataPeriode(kategori, 2);
    const filledMonths = getFilledMonths(kategori);
    if (filledMonths.length === 0)
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Tidak ada data</div>
      );
    const displayMonths = filledMonths.length < 3 ? [0, 1, 2] : filledMonths;
    const chartData = displayMonths.map(m => ({
      name: MONTHS_SHORT[m],
      p1: rawValues1[m] || 0,
      p2: rawValues2[m] || 0,
    }));
    // dynamic bar size: wider when fewer months, narrower when more
    const axisColor = darkMode ? '#94a3b8' : '#6b7280';
    const barSize = Math.max(6, Math.min(22, Math.floor(200 / displayMonths.length)));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 22, right: 8, left: 8, bottom: 4 }} barCategoryGap="20%" barGap={3}>
          <XAxis dataKey="name" tick={{ fontSize: 13, fill: axisColor }} axisLine={false} tickLine={false} />
          <YAxis domain={[yMin, yMax]} hide />
          <ReTooltip content={<BarTooltip />} cursor={{ fill: darkMode ? '#1e293b' : '#f1f5f9' }} />
          <Bar dataKey="p1" fill={color1} radius={[3, 3, 0, 0]} maxBarSize={barSize}
            label={{ position: 'top', fontSize: 12, fontWeight: 700, fill: color1, formatter: (v: any) => fmtLabel(Number(v)) }} />
          <Bar dataKey="p2" fill={color2} radius={[3, 3, 0, 0]} maxBarSize={barSize}
            label={{ position: 'top', fontSize: 12, fontWeight: 700, fill: color2, formatter: (v: any) => fmtLabel(Number(v)) }} />
          <text x="6" y="12" fontSize="12" fill={color1} fontWeight="600">● Periode I</text>
          <text x="86" y="12" fontSize="12" fill={color2} fontWeight="600">● Periode II</text>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = (kategori: string, color1: string, color2: string, yMax: number, yMin: number = 0) => {
    const rawValues1 = getChartDataPeriode(kategori, 1);
    const rawValues2 = getChartDataPeriode(kategori, 2);
    const filledMonths = getFilledMonths(kategori);
    if (filledMonths.length === 0)
      return <text x="250" y="90" textAnchor="middle" fontSize="14" fill="#9ca3af">Tidak ada data</text>;
    const displayMonths = filledMonths.length < 3 ? [0, 1, 2] : filledMonths;
    const xs = displayMonths.map((_, i) => 20 + i * (460 / Math.max(displayMonths.length - 1, 1)));
    const fv1 = displayMonths.map(m => rawValues1[m]);
    const fv2 = displayMonths.map(m => rawValues2[m]);
    const ys1 = fv1.map(v => toY(v, yMax, yMin));
    const ys2 = fv2.map(v => toY(v, yMax, yMin));
    const id1 = `grad1-${kategori.replace(' ','-')}`;
    const id2 = `grad2-${kategori.replace(' ','-')}`;
    const baseY = 165;
    const area1 = xs.map((x,i)=>`${x},${ys1[i]}`).join(' ');
    const area2 = xs.map((x,i)=>`${x},${ys2[i]}`).join(' ');
    const poly1 = `${xs[0]},${baseY} ${area1} ${xs[xs.length-1]},${baseY}`;
    const poly2 = `${xs[0]},${baseY} ${area2} ${xs[xs.length-1]},${baseY}`;
    return (
      <>
        <defs>
          <linearGradient id={id1} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color1} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color1} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id2} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color2} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color2} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#${id1})`} points={poly1} />
        <polygon fill={`url(#${id2})`} points={poly2} />
        <polyline fill="none" stroke={color1} strokeWidth="2.5" points={xs.map((x,i)=>`${x},${ys1[i]}`).join(' ')}/>
        <polyline fill="none" stroke={color2} strokeWidth="2.5" points={xs.map((x,i)=>`${x},${ys2[i]}`).join(' ')}/>
        {xs.map((x,i) => fv1[i] > 0 && (
          <g key={`p1-${i}`}>
            <circle cx={x} cy={ys1[i]} r="5" fill={color1} style={{cursor:'pointer'}}
              onMouseEnter={e => {
                const rect = (e.target as SVGCircleElement).closest('svg')!.getBoundingClientRect();
                setTooltip({ x: rect.left + x * (rect.width/500), y: rect.top + ys1[i] * (rect.height/195), label: `Periode I - ${MONTHS_SHORT[displayMonths[i]]}`, value: fv1[i].toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
            <text x={x} y={ys1[i] + 22} textAnchor="middle" fontSize="13" fontWeight="700" fill={color1}>{fmtLabel(fv1[i])}</text>
          </g>
        ))}
        {xs.map((x,i) => fv2[i] > 0 && (
          <g key={`p2-${i}`}>
            <circle cx={x} cy={ys2[i]} r="5" fill={color2} style={{cursor:'pointer'}}
              onMouseEnter={e => {
                const rect = (e.target as SVGCircleElement).closest('svg')!.getBoundingClientRect();
                setTooltip({ x: rect.left + x * (rect.width/500), y: rect.top + ys2[i] * (rect.height/195), label: `Periode II - ${MONTHS_SHORT[displayMonths[i]]}`, value: fv2[i].toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
            <text x={x} y={ys2[i] - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill={color2}>{fmtLabel(fv2[i])}</text>
          </g>
        ))}
        {displayMonths.map((monthIdx,i) => <text key={i} x={xs[i]} y="185" textAnchor="middle" fontSize="13" fill={darkMode ? '#94a3b8' : '#6b7280'}>{MONTHS_SHORT[monthIdx]}</text>)}
        <text x="20" y="13" fontSize="12" fill={color1} fontWeight="600">● Periode I</text>
        <text x="120" y="13" fontSize="12" fill={color2} fontWeight="600">● Periode II</text>
      </>
    );
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: darkMode ? '#0f172a' : '#f1f2f7' }}>
        {!presentationMode && <Sidebar />}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-2 shadow-sm flex-shrink-0 ${dk('bg-white', 'bg-[#1e293b]')}`}>
            <div className="flex items-center gap-3">
              {/* Presentation Mode Toggle */}
              <button
                onClick={() => setPresentationMode(p => !p)}
                title={presentationMode ? 'Exit Presentation Mode' : 'Presentation Mode'}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  presentationMode
                    ? 'bg-blue-600 text-white border-blue-600'
                    : dk('bg-white text-gray-600 border-gray-300 hover:bg-gray-50', 'bg-[#0f172a] text-gray-300 border-gray-600 hover:bg-[#1e293b]')
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <h1 className={`text-xl font-bold ${dk('text-[#273240]', 'text-white')}`}>Sales &amp; Marketing</h1>
            </div>
            <div className="flex gap-2 items-center">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(d => !d)}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  darkMode
                    ? 'bg-yellow-400 text-gray-900 border-yellow-400'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 15a5 5 0 100-10 5 5 0 000 10zm7-5a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4 12a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zm13.657-6.343a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM7.05 16.95a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM5.636 6.364a1 1 0 011.414 0l.707.707A1 1 0 116.343 8.485l-.707-.707a1 1 0 010-1.414zM12 20a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                  </svg>
                )}
              </button>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={`px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  dk('border-gray-300 bg-white text-gray-700', 'border-gray-600 bg-[#0f172a] text-gray-200')
                }`}>
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart Grid + Table */}
          {isLoading || loading ? (
            <div className={`flex-1 flex items-center justify-center text-lg ${dk('text-gray-400', 'text-gray-500')}`}>Loading...</div>
          ) : (
          <div className="flex-1 p-3 overflow-auto flex flex-col gap-3">
            {/* Row 1: HMA + HARGA JUAL */}
            <div className="grid grid-cols-2 gap-3" style={{ minHeight: '220px' }}>
              {([{k:'HMA',yMax:25000,yMin:10000,c1:'#3b82f6',c2:'#f59e0b'},{k:'HARGA JUAL',yMax:100,yMin:0,c1:'#10b981',c2:'#a855f7'}] as {k:string,yMax:number,yMin:number,c1:string,c2:string}[]).map(({k,yMax,yMin,c1,c2}) => (
                <div key={k} className={`rounded-xl shadow-sm p-3 flex flex-col overflow-hidden ${dk('bg-white', 'bg-[#1e293b]')}`}>
                  <h2 className={`text-base font-semibold mb-1 flex-shrink-0 ${dk('text-gray-700', 'text-gray-200')}`}>{k}</h2>
                  <div className="flex-1 min-h-0">
                    <svg width="100%" height="100%" viewBox="0 0 500 195" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
                      {renderChart(k, c1, c2, yMax, yMin)}
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2: PREMIUM + HPM + Donut gabungan (3 cols) */}
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 1fr', minHeight: '240px' }}>
              {/* PREMIUM */}
              <div className={`rounded-xl shadow-sm p-3 flex flex-col overflow-hidden ${dk('bg-white', 'bg-[#1e293b]')}`}>
                <h2 className={`text-base font-semibold mb-1 flex-shrink-0 ${dk('text-gray-700', 'text-gray-200')}`}>PREMIUM</h2>
                <div className="flex-1 min-h-0">
                  {renderBarChart('PREMIUM', '#f43f5e', '#fb923c', 100, 0)}
                </div>
              </div>
              {/* HPM */}
              <div className={`rounded-xl shadow-sm p-3 flex flex-col overflow-hidden ${dk('bg-white', 'bg-[#1e293b]')}`}>
                <h2 className={`text-base font-semibold mb-1 flex-shrink-0 ${dk('text-gray-700', 'text-gray-200')}`}>HPM</h2>
                <div className="flex-1 min-h-0">
                  {renderBarChart('HPM', '#06b6d4', '#6366f1', 100, 0)}
                </div>
              </div>

              {/* Donut gabungan — tab Status | Buyer */}
              {(() => {
                const STATUS_3 = [
                  { key: 'completed',   label: 'Completed',   color: '#0ea5e9' },
                  { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
                  { key: 'carry_over',  label: 'Carry Over',  color: '#a855f7' },
                ];
                const IN_PROGRESS_KEYS = new Set(['loading', 'waiting', 'in_progress']);
                const CARRY_OVER_KEYS  = new Set(['carry_over_to_next_month', 'carry_over']);

                // --- Status data ---
                const grouped = { completed: 0, in_progress: 0, carry_over: 0 };
                summaryRows.forEach(r => {
                  const s = r.status?.toLowerCase() ?? '';
                  if (s === 'completed') grouped.completed += r.jumlah_kapal;
                  else if (IN_PROGRESS_KEYS.has(s)) grouped.in_progress += r.jumlah_kapal;
                  else if (CARRY_OVER_KEYS.has(s))  grouped.carry_over  += r.jumlah_kapal;
                });
                const statusData = STATUS_3
                  .map(s => ({ name: s.label, value: grouped[s.key as keyof typeof grouped], color: s.color }))
                  .filter(d => d.value > 0);
                const statusTotal = statusData.reduce((s, d) => s + d.value, 0);

                // --- Buyer data ---
                const BUYER_COLORS = ['#f43f5e','#10b981','#6366f1','#f97316','#14b8a6','#eab308','#ec4899','#84cc16','#0ea5e9','#a855f7'];
                const buyerMap = new Map<string, number>();
                summaryRows.forEach(r => {
                  const b = r.buyer || 'Buyer Not Assigned';
                  buyerMap.set(b, (buyerMap.get(b) ?? 0) + r.jumlah_kapal);
                });
                const buyerData = Array.from(buyerMap.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, value], i) => ({
                    name, value,
                    color: name === 'Buyer Not Assigned' ? '#9ca3af' : BUYER_COLORS[i % BUYER_COLORS.length],
                  }));
                const buyerTotal = buyerData.reduce((s, d) => s + d.value, 0);

                const activeData  = donutTab === 'status' ? statusData  : buyerData;
                const activeTotal = donutTab === 'status' ? statusTotal : buyerTotal;
                const animKey = `${donutTab}-${selectedYear}`;

                return (
                  <div className={`rounded-xl shadow-sm p-3 flex flex-col overflow-hidden ${dk('bg-white', 'bg-[#1e293b]')}`}>
                    {/* Header + tab */}
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                      <h2 className={`text-base font-semibold ${dk('text-gray-700', 'text-gray-200')}`}>Kapal {selectedYear}</h2>
                      <div className={`flex rounded-md overflow-hidden border text-xs font-semibold ${dk('border-gray-200', 'border-gray-600')}`}>
                        {(['status', 'buyer'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setDonutTab(tab)}
                            className={`px-3 py-0.5 transition-colors cursor-pointer ${
                              donutTab === tab
                                ? 'bg-blue-600 text-white'
                                : dk('bg-white text-gray-500 hover:bg-gray-50', 'bg-[#0f172a] text-gray-400 hover:bg-[#1e293b]')
                            }`}
                          >
                            {tab === 'status' ? 'Status' : 'Buyer'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chart (kiri) + Legend (kanan) */}
                    <div className="flex-1 min-h-0 flex flex-row gap-3">
                      {/* Donut chart — mengambil sisa ruang */}
                      <div className="flex-1 min-w-0 relative">
                        {kapalLoading ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className={`w-20 h-20 animate-pulse rounded-full ${dk('bg-gray-100', 'bg-gray-700')}`} />
                          </div>
                        ) : activeTotal === 0 ? (
                          <div className={`w-full h-full flex items-center justify-center text-xs ${dk('text-gray-400', 'text-gray-500')}`}>Tidak ada data</div>
                        ) : (
                          <>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  key={animKey}
                                  data={activeData}
                                  cx="50%" cy="50%"
                                  innerRadius="48%" outerRadius="72%"
                                  dataKey="value"
                                  paddingAngle={2}
                                  labelLine={false}
                                  label={false}
                                  isAnimationActive
                                  animationBegin={0}
                                  animationDuration={600}
                                  animationEasing="ease-out"
                                >
                                  {activeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                </Pie>
                                <ReTooltip content={<KapalTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className={`text-xl font-extrabold leading-tight ${dk('text-gray-700', 'text-gray-100')}`}>{activeTotal}</span>
                              <span className={`text-[10px] ${dk('text-gray-400', 'text-gray-500')}`}>Total Kapal</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Legend — lebar tetap di kanan */}
                      <div className={`w-28 flex-shrink-0 flex flex-col justify-center gap-2 ${
                        donutTab === 'buyer' ? 'overflow-y-auto' : ''
                      }`}>
                        {donutTab === 'status'
                          ? STATUS_3.map(s => (
                              <div key={s.key} className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                  <span className={`text-xs font-medium ${dk('text-gray-600', 'text-gray-300')}`}>{s.label}</span>
                                </div>
                                <span className={`text-sm font-bold pl-[18px] ${dk('text-gray-800', 'text-gray-100')}`}>
                                  {grouped[s.key as keyof typeof grouped]}
                                </span>
                              </div>
                            ))
                          : buyerData.map(d => (
                              <div key={d.name} className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                                  <span className={`text-xs break-words min-w-0 ${dk('text-gray-600', 'text-gray-300')}`}>{d.name}</span>
                                </div>
                                <span className={`text-xs font-bold flex-shrink-0 ${dk('text-gray-800', 'text-gray-100')}`}>{d.value}</span>
                              </div>
                            ))
                        }
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* YTD Remarks Table — sama struktur dengan Home page */}
            {(() => {
              const tableData: YTDTableData[] = ytdData
                .filter(row => row.remarks !== 'YTD Loaded Into Barge/Vessel')
                .map(row => {
                  if (row.remarks === 'YTD Completed Into Barge/Vessel') {
                    const pct = ytdYearTotals.plan > 0 ? (ytdYearTotals.real / ytdYearTotals.plan) * 100 : 0;
                    return { remarks: row.remarks, plan2025: `${format3(ytdYearTotals.plan)} WMT`, realisasiProgress: `${format3(ytdYearTotals.real)} WMT`, percentage: `${pct.toFixed(2)}%` };
                  }
                  return { remarks: row.remarks, plan2025: `${format3(row.plan_value)} WMT`, realisasiProgress: `${format3(row.realisasi_progress)} WMT`, percentage: `${row.percentage.toFixed(2)}%` };
                });
              return (
                <div className={`rounded-xl shadow-sm overflow-hidden flex-shrink-0 ${dk('bg-white', 'bg-[#1e293b]')}`}>
                  <div className="bg-[#92d050] px-4 py-3">
                    <div className="grid grid-cols-4 text-sm font-medium text-[#273240]">
                      <div>Remarks</div>
                      <div>Plan {selectedYear}</div>
                      <div>Realisasi Progress</div>
                      <div>%</div>
                    </div>
                  </div>
                  <div>
                    {ytdLoading ? (
                      <div className={`px-4 py-3 text-sm ${dk('text-gray-400', 'text-gray-500')}`}>Loading...</div>
                    ) : tableData.map((row, i) => (
                      <div key={i} className={`grid grid-cols-4 px-4 py-3 border-b last:border-b-0 ${dk('border-[#dedede]', 'border-gray-700')}`}>
                        <div className={`text-sm ${dk('text-[#273240]', 'text-gray-200')}`}>{row.remarks}</div>
                        <div className={`text-sm ${dk('text-[#273240]', 'text-gray-200')}`}>{row.plan2025}</div>
                        <div className={`text-sm ${dk('text-[#273240]', 'text-gray-200')}`}>{row.realisasiProgress}</div>
                        <div className={`text-sm ${dk('text-[#273240]', 'text-gray-200')}`}>{row.percentage}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg shadow-lg text-xs font-semibold text-white"
          style={{ left: tooltip.x + 12, top: tooltip.y - 44, backgroundColor: '#1e293b', whiteSpace: 'nowrap' }}
        >
          <div className="text-gray-300 font-normal mb-0.5">{tooltip.label}</div>
          <div>{tooltip.value}</div>
        </div>
      )}

    </>
  );
}
