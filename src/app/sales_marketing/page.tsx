"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { useUserRole } from "../hooks/useUserRole";

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const CATEGORIES = ['HMA','PREMIUM','HPM','HARGA JUAL'];

type PriceData = { [kategori: string]: { [key: string]: string } };

export default function SalesMarketingPage() {
  const { isSuperAdmin, isLoading } = useUserRole();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [priceData, setPriceData] = useState<PriceData>({});
  const [loading, setLoading] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: string } | null>(null);
  const [completedVessels, setCompletedVessels] = useState<number>(0);
  const [carryOverVessels, setCarryOverVessels] = useState<number>(0);
  const [kapalLoading, setKapalLoading] = useState<boolean>(false);

  const fetchVesselSummary = async (year: number) => {
    setKapalLoading(true);
    try {
      const res = await fetch(`/api/vessel_status_summary?year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setCompletedVessels(data.completed ?? 0);
        setCarryOverVessels(data.carry_over_to_next_month ?? 0);
      }
    } catch { }
    setKapalLoading(false);
  };

  // Fetch data from database
  useEffect(() => {
    if (!isLoading) {
      fetchPriceData();
      fetchVesselSummary(selectedYear);
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

  const fmtLabel = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v % 1 === 0 ? String(v) : v.toFixed(1);
  };

  const renderBarChart = (kategori: string, color1: string, color2: string, yMax: number, yMin: number = 0) => {
    const rawValues1 = getChartDataPeriode(kategori, 1);
    const rawValues2 = getChartDataPeriode(kategori, 2);
    const filledMonths = getFilledMonths(kategori);
    if (filledMonths.length === 0)
      return <text x="250" y="90" textAnchor="middle" fontSize="14" fill="#9ca3af">Tidak ada data</text>;
    const displayMonths = filledMonths.length < 3 ? [0, 1, 2] : filledMonths;
    const n = displayMonths.length;
    const chartW = 460; const startX = 20; const baseY = 165;
    const groupW = chartW / n;
    const barW = Math.min(groupW * 0.28, 15);
    const gap = 6;
    return (
      <>
        {displayMonths.map((monthIdx, i) => {
          const cx = startX + i * groupW + groupW / 2;
          const v1 = rawValues1[monthIdx]; const v2 = rawValues2[monthIdx];
          const y1 = toY(v1, yMax, yMin); const y2 = toY(v2, yMax, yMin);
          return (
            <g key={i}>
              {v1 > 0 && (
                <>
                  <rect x={cx - barW - gap} y={y1} width={barW} height={baseY - y1} fill={color1} rx="2" style={{cursor:'pointer'}}
                    onMouseEnter={e => {
                      const rect = (e.target as SVGRectElement).closest('svg')!.getBoundingClientRect();
                      setTooltip({ x: rect.left + (cx - barW/2 - gap) * (rect.width/500), y: rect.top + y1 * (rect.height/195), label: `Periode I - ${MONTHS_SHORT[monthIdx]}`, value: v1.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  <text x={cx - barW/2 - gap} y={y1 - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill={color1}>{fmtLabel(v1)}</text>
                </>
              )}
              {v2 > 0 && (
                <>
                  <rect x={cx + gap} y={y2} width={barW} height={baseY - y2} fill={color2} rx="2" style={{cursor:'pointer'}}
                    onMouseEnter={e => {
                      const rect = (e.target as SVGRectElement).closest('svg')!.getBoundingClientRect();
                      setTooltip({ x: rect.left + (cx + barW/2 + gap) * (rect.width/500), y: rect.top + y2 * (rect.height/195), label: `Periode II - ${MONTHS_SHORT[monthIdx]}`, value: v2.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  <text x={cx + barW/2 + gap} y={y2 - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill={color2}>{fmtLabel(v2)}</text>
                </>
              )}
              <text x={cx} y="185" textAnchor="middle" fontSize="11" fill="#6b7280">{MONTHS_SHORT[monthIdx]}</text>
            </g>
          );
        })}
        <text x="20" y="12" fontSize="10" fill={color1} fontWeight="600">● Periode I</text>
        <text x="110" y="12" fontSize="10" fill={color2} fontWeight="600">● Periode II</text>
      </>
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
            <text x={x} y={ys1[i] + 20} textAnchor="middle" fontSize="11" fontWeight="700" fill={color1}>{fmtLabel(fv1[i])}</text>
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
            <text x={x} y={ys2[i] - 12} textAnchor="middle" fontSize="11" fontWeight="700" fill={color2}>{fmtLabel(fv2[i])}</text>
          </g>
        ))}
        {displayMonths.map((monthIdx,i) => <text key={i} x={xs[i]} y="185" textAnchor="middle" fontSize="11" fill="#6b7280">{MONTHS_SHORT[monthIdx]}</text>)}
        <text x="20" y="12" fontSize="10" fill={color1} fontWeight="600">● Periode I</text>
        <text x="110" y="12" fontSize="10" fill={color2} fontWeight="600">● Periode II</text>
      </>
    );
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f1f2f7" }}>
        {/* Sidebar: hidden in presentation mode */}
        {!presentationMode && <Sidebar />}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Presentation Mode Toggle */}
              <button
                onClick={() => setPresentationMode(p => !p)}
                title={presentationMode ? 'Exit Presentation Mode' : 'Presentation Mode'}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  presentationMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-[#273240]">Sales & Marketing</h1>
            </div>
            <div className="flex gap-2 items-center">

              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 5-Chart Presentation Grid */}
          {isLoading || loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">Loading...</div>
          ) : (
          <div className="flex-1 p-3 overflow-hidden" style={{
            display: 'grid',
            gridTemplateRows: '1fr 1fr',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
          }}>
            {/* Row 1: HMA (col 1) + HARGA JUAL (col 2) */}
            {([{k:'HMA',yMax:25000,yMin:10000},{k:'HARGA JUAL',yMax:100,yMin:0}] as {k:string,yMax:number,yMin:number}[]).map(({k,yMax,yMin}) => (
              <div key={k} className="bg-white rounded-xl shadow-sm p-3 flex flex-col overflow-hidden">
                <h2 className="text-base font-semibold text-gray-700 mb-1 flex-shrink-0">{k}</h2>
                <div className="flex-1 min-h-0">
                  <svg width="100%" height="100%" viewBox="0 0 500 195" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
                    {renderChart(k, '#3b82f6', '#ef4444', yMax, yMin)}
                  </svg>
                </div>
              </div>
            ))}

            {/* Row 2: PREMIUM + HPM + Donut (3 cols inside row 2, spanning both columns) */}
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {/* PREMIUM */}
              <div className="bg-white rounded-xl shadow-sm p-3 flex flex-col overflow-hidden">
                <h2 className="text-base font-semibold text-gray-700 mb-1 flex-shrink-0">PREMIUM</h2>
                <div className="flex-1 min-h-0">
                  <svg width="100%" height="100%" viewBox="0 0 500 195" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
                    {renderBarChart('PREMIUM', '#3b82f6', '#ef4444', 100, 0)}
                  </svg>
                </div>
              </div>
              {/* HPM */}
              <div className="bg-white rounded-xl shadow-sm p-3 flex flex-col overflow-hidden">
                <h2 className="text-base font-semibold text-gray-700 mb-1 flex-shrink-0">HPM</h2>
                <div className="flex-1 min-h-0">
                  <svg width="100%" height="100%" viewBox="0 0 500 195" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
                    {renderBarChart('HPM', '#3b82f6', '#ef4444', 100, 0)}
                  </svg>
                </div>
              </div>
              {/* Donut - Vessel Status Summary */}
              <div className="bg-white rounded-xl shadow-sm p-3 flex flex-col overflow-hidden">
                <h2 className="text-base font-semibold text-gray-700 mb-1 flex-shrink-0">Status Kapal {selectedYear}</h2>
                <div className="flex-1 flex items-center justify-center">
                  {kapalLoading ? (
                    <div className="w-32 h-32 bg-gray-100 animate-pulse rounded-full" />
                  ) : (() => {
                    const total = completedVessels + carryOverVessels;
                    const r = 38; const circ = 2 * Math.PI * r;
                    const completedDash = total > 0 ? (completedVessels / total) * circ : 0;
                    const carryDash = total > 0 ? (carryOverVessels / total) * circ : 0;
                    return (
                      <div className="flex flex-col items-center w-full">
                        <div className="relative" style={{width:'min(130px,11vw)',height:'min(130px,11vw)'}}>
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <defs>
                              <filter id="donut-shadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000022" />
                              </filter>
                            </defs>
                            <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
                            <circle cx="50" cy="50" r={r} fill="none" stroke="#f59e0b" strokeWidth="14"
                              strokeDasharray={`${carryDash} ${circ}`}
                              strokeDashoffset={circ * 0.25}
                              strokeLinecap="butt"
                              filter="url(#donut-shadow)"
                              style={{transform:'rotate(-90deg)',transformOrigin:'50% 50%',cursor:'pointer'}}
                              onMouseEnter={e => {
                                const rect = (e.target as SVGCircleElement).closest('svg')!.getBoundingClientRect();
                                setTooltip({ x: rect.left + rect.width / 2, y: rect.top, label: 'Carry Over', value: String(carryOverVessels) });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            />
                            <circle cx="50" cy="50" r={r} fill="none" stroke="#10b981" strokeWidth="14"
                              strokeDasharray={`${completedDash} ${circ}`}
                              strokeDashoffset={circ * 0.25 - carryDash}
                              strokeLinecap="butt"
                              filter="url(#donut-shadow)"
                              style={{transform:'rotate(-90deg)',transformOrigin:'50% 50%',cursor:'pointer'}}
                              onMouseEnter={e => {
                                const rect = (e.target as SVGCircleElement).closest('svg')!.getBoundingClientRect();
                                setTooltip({ x: rect.left + rect.width / 2, y: rect.top, label: 'Selesai', value: String(completedVessels) });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            />
                            <circle cx="50" cy="50" r={r} fill="none" stroke="#00000010" strokeWidth="2" />
                            <text x="50" y="46" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1e293b"
                              style={{cursor:'pointer'}}
                              onMouseEnter={e => {
                                const rect = (e.target as SVGTextElement).closest('svg')!.getBoundingClientRect();
                                setTooltip({ x: rect.left + rect.width / 2, y: rect.top, label: 'Total Kapal', value: String(total) });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            >{total}</text>
                            <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#9ca3af">Total</text>
                          </svg>
                        </div>
                        <div className="flex gap-4 mt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full inline-block" style={{backgroundColor:'#10b981'}} />
                            <span className="text-xs font-semibold text-gray-600">Selesai</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full inline-block" style={{backgroundColor:'#f59e0b'}} />
                            <span className="text-xs font-semibold text-gray-600">Carry Over</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
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
