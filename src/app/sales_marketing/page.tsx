"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { useUserRole } from "../hooks/useUserRole";

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const CATEGORIES = ['HMA','PREMIUM','HPM','HARGA JUAL'];

type PriceData = { [kategori: string]: { [key: string]: string } };

export default function SalesMarketingPage() {
  const { isAdmin, bureau } = useUserRole();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [priceData, setPriceData] = useState<PriceData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chartView, setChartView] = useState<'grid' | 'vertical'>('grid');
  const [formData, setFormData] = useState({ 
    year: new Date().getFullYear(), 
    month: 1, 
    periode1: { hma: '', premium: '', hpm: '', harga_jual: '' },
    periode2: { hma: '', premium: '', hpm: '', harga_jual: '' }
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);

  // Fetch data from database
  useEffect(() => {
    fetchPriceData();
  }, [selectedYear]);

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/price-monthly?year=${selectedYear}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
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

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onDown = (e: MouseEvent) => {
      isDragging.current = true;
      startX.current = e.clientX;
      scrollLeftRef.current = el.scrollLeft;
    };
    const onUp = () => { isDragging.current = false; };
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      el.scrollLeft = scrollLeftRef.current - (e.clientX - startX.current);
    };
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  const getValue = (kategori: string, month: number, periode: number) => {
    const value = priceData[kategori]?.[`${month}_${periode}`];
    if (!value || value === '-') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getChartData = (kategori: string) => {
    const values: number[] = [];
    for (let m = 1; m <= 12; m++) {
      const val1 = priceData[kategori]?.[`${m}_1`];
      const val2 = priceData[kategori]?.[`${m}_2`];
      const num1 = val1 && val1 !== '-' ? parseFloat(val1) : null;
      const num2 = val2 && val2 !== '-' ? parseFloat(val2) : null;
      const avg = num1 !== null && num2 !== null ? (num1 + num2) / 2 : num1 || num2 || 0;
      values.push(avg);
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

  const normalizeChartValues = (values: number[]) => {
    const max = Math.max(...values.filter(v => v > 0));
    const min = Math.min(...values.filter(v => v > 0));
    const range = max - min || 1;
    return values.map(v => v > 0 ? 140 - ((v - min) / range) * 60 : 140);
  };

  const handleInputChange = (periode: 'periode1' | 'periode2', key: string, value: string) => {
    // Allow only numbers and one decimal point
    const regex = /^\d*\.?\d{0,2}$/;
    if (value === '' || regex.test(value)) {
      setFormData({
        ...formData,
        [periode]: { ...formData[periode], [key]: value }
      });
    }
  };

  const handleSave = async () => {
    const periode1Exists = priceData.HMA?.[`${formData.month}_1`] && priceData.HMA[`${formData.month}_1`] !== '-';
    const periode2Exists = priceData.HMA?.[`${formData.month}_2`] && priceData.HMA[`${formData.month}_2`] !== '-';
    
    if (periode1Exists || periode2Exists) {
      setShowConfirmModal(true);
      return;
    }
    
    await saveData();
  };

  const saveData = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/price-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      await fetchPriceData();
      setShowModal(false);
      setShowConfirmModal(false);
      setModalPage(1);
      setFormData({ 
        year: new Date().getFullYear(), 
        month: 1, 
        periode1: { hma: '', premium: '', hpm: '', harga_jual: '' },
        periode2: { hma: '', premium: '', hpm: '', harga_jual: '' }
      });
    } catch (error) {
      console.error('Error saving price data:', error);
      alert('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Wrapper: Fixed height, no scroll on wrapper itself */}
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f1f2f7" }}>
        {/* Sidebar: Fixed width, full height, only vertical scroll if needed */}
        <Sidebar />
        
        {/* Main Content Area: Flexible width, scrollable vertically */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Inner Content: All your content goes here */}
          <div className="p-8 w-full">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-[#273240]">Sales & Marketing</h1>
            <div className="flex gap-3">
              {isAdmin && (
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  + Add / Edit Data
                </button>
              )}
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart View Toggle */}
          <div className="flex justify-end mb-6">
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                onClick={() => setChartView('grid')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  chartView === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Grid
              </button>
              <button
                onClick={() => setChartView('vertical')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  chartView === 'vertical'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Vertical
              </button>
            </div>
          </div>

          {/* Top Layer - Charts */}
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
          <div className={chartView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6' : 'space-y-6 mb-6'}>
            {/* HMA Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 w-full overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">HMA</h2>
              <div className="bg-gray-50 rounded-lg p-3 h-56 w-full overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 500 180" preserveAspectRatio="xMidYMid meet" style={{maxWidth:'100%', display:'block'}}>
                  {(() => {
                    const rawValues = getChartData('HMA');
                    const filledMonths = getFilledMonths('HMA');
                    if (filledMonths.length === 0) {
                      return (
                        <text x="250" y="90" textAnchor="middle" fontSize="14" fill="#9ca3af">
                          Tidak ada data
                        </text>
                      );
                    }
                    // If less than 3 months, show first 3 months (Jan-Mar)
                    const displayMonths = filledMonths.length < 3 ? [0, 1, 2] : filledMonths;
                    const xs = displayMonths.map((_, i) => 30 + i * (440 / Math.max(displayMonths.length - 1, 1)));
                    const filledValues = displayMonths.map(m => rawValues[m]);
                    const ys = normalizeChartValues(filledValues);
                    const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
                    return (
                      <>
                        <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" points={points}/>
                        {xs.map((x, i) => {
                          if (filledValues[i] > 0) {
                            return <circle key={i} cx={x} cy={ys[i]} r="4" fill="#3b82f6" />;
                          }
                          return null;
                        })}
                        {displayMonths.map((monthIdx, i) => (
                          <text key={i} x={xs[i]} y="170" textAnchor="middle" fontSize="11" fill="#6b7280">{MONTHS_SHORT[monthIdx]}</text>
                        ))}
                        {xs.map((x, i) => {
                          if (filledValues[i] > 0) {
                            return (
                              <text 
                                key={`label-${i}`} 
                                x={x} 
                                y={ys[i] - 12} 
                                textAnchor="middle" 
                                fontSize="10" 
                                fontWeight="600"
                                fill="#1e40af"
                              >
                                {filledValues[i].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </text>
                            );
                          }
                          return null;
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* PREMIUM Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 w-full overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">PREMIUM</h2>
              <div className="bg-gray-50 rounded-lg p-3 h-56 w-full overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 500 180" preserveAspectRatio="xMidYMid meet" style={{maxWidth:'100%', display:'block'}}>
                  {(() => {
                    const rawValues = getChartData('PREMIUM');
                    const filledMonths = getFilledMonths('PREMIUM');
                    if (filledMonths.length === 0) {
                      return (
                        <text x="250" y="90" textAnchor="middle" fontSize="14" fill="#9ca3af">
                          Tidak ada data
                        </text>
                      );
                    }
                    // If less than 3 months, show first 3 months (Jan-Mar)
                    const displayMonths = filledMonths.length < 3 ? [0, 1, 2] : filledMonths;
                    const xs = displayMonths.map((_, i) => 30 + i * (440 / Math.max(displayMonths.length - 1, 1)));
                    const filledValues = displayMonths.map(m => rawValues[m]);
                    const ys = normalizeChartValues(filledValues);
                    const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
                    return (
                      <>
                        <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={points}/>
                        {xs.map((x, i) => {
                          if (filledValues[i] > 0) {
                            return <circle key={i} cx={x} cy={ys[i]} r="4" fill="#10b981" />;
                          }
                          return null;
                        })}
                        {displayMonths.map((monthIdx, i) => (
                          <text key={i} x={xs[i]} y="170" textAnchor="middle" fontSize="11" fill="#6b7280">{MONTHS_SHORT[monthIdx]}</text>
                        ))}
                        {xs.map((x, i) => {
                          if (filledValues[i] > 0) {
                            return (
                              <text 
                                key={`label-${i}`} 
                                x={x} 
                                y={ys[i] - 12} 
                                textAnchor="middle" 
                                fontSize="10" 
                                fontWeight="600"
                                fill="#047857"
                              >
                                {filledValues[i].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </text>
                            );
                          }
                          return null;
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* HPM Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 w-full overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">HPM</h2>
              <div className="bg-gray-50 rounded-lg p-3 h-56 w-full overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 500 180" preserveAspectRatio="xMidYMid meet" style={{maxWidth:'100%', display:'block'}}>
                  {(() => {
                    const rawValues = getChartData('HPM');
                    const filledMonths = getFilledMonths('HPM');
                    if (filledMonths.length === 0) {
                      return (
                        <text x="250" y="90" textAnchor="middle" fontSize="14" fill="#9ca3af">
                          Tidak ada data
                        </text>
                      );
                    }
                    // If less than 3 months, show first 3 months (Jan-Mar)
                    const displayMonths = filledMonths.length < 3 ? [0, 1, 2] : filledMonths;
                    const xs = displayMonths.map((_, i) => 30 + i * (440 / Math.max(displayMonths.length - 1, 1)));
                    const filledValues = displayMonths.map(m => rawValues[m]);
                    const ys = normalizeChartValues(filledValues);
                    const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
                    return (
                      <>
                        <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" points={points}/>
                        {xs.map((x, i) => {
                          if (filledValues[i] > 0) {
                            return <circle key={i} cx={x} cy={ys[i]} r="4" fill="#f59e0b" />;
                          }
                          return null;
                        })}
                        {displayMonths.map((monthIdx, i) => (
                          <text key={i} x={xs[i]} y="170" textAnchor="middle" fontSize="11" fill="#6b7280">{MONTHS_SHORT[monthIdx]}</text>
                        ))}
                        {xs.map((x, i) => {
                          if (filledValues[i] > 0) {
                            return (
                              <text 
                                key={`label-${i}`} 
                                x={x} 
                                y={ys[i] - 12} 
                                textAnchor="middle" 
                                fontSize="10" 
                                fontWeight="600"
                                fill="#b45309"
                              >
                                {filledValues[i].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </text>
                            );
                          }
                          return null;
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* HARGA JUAL Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 w-full overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">HARGA JUAL</h2>
              <div className="bg-gray-50 rounded-lg p-3 h-56 w-full overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 500 180" preserveAspectRatio="xMidYMid meet" style={{maxWidth:'100%', display:'block'}}>
                  {(() => {
                    const rawValues = getChartData('HARGA JUAL');
                    const filledMonths = getFilledMonths('HARGA JUAL');
                    if (filledMonths.length === 0) {
                      return (
                        <text x="250" y="90" textAnchor="middle" fontSize="14" fill="#9ca3af">
                          Tidak ada data
                        </text>
                      );
                    }
                    // If less than 3 months, show first 3 months (Jan-Mar)
                    const displayMonths = filledMonths.length < 3 ? [0, 1, 2] : filledMonths;
                    const xs = displayMonths.map((_, i) => 30 + i * (440 / Math.max(displayMonths.length - 1, 1)));
                    const filledValues = displayMonths.map(m => rawValues[m]);
                    const ys = normalizeChartValues(filledValues);
                    const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
                    return (
                      <>
                        <polyline fill="none" stroke="#ef4444" strokeWidth="2.5" points={points}/>
                        {xs.map((x, i) => {
                          if (filledValues[i] > 0) {
                            return <circle key={i} cx={x} cy={ys[i]} r="4" fill="#ef4444" />;
                          }
                          return null;
                        })}
                        {displayMonths.map((monthIdx, i) => (
                          <text key={i} x={xs[i]} y="170" textAnchor="middle" fontSize="11" fill="#6b7280">{MONTHS_SHORT[monthIdx]}</text>
                        ))}
                        {xs.map((x, i) => {
                          if (filledValues[i] > 0) {
                            return (
                              <text 
                                key={`label-${i}`} 
                                x={x} 
                                y={ys[i] - 12} 
                                textAnchor="middle" 
                                fontSize="10" 
                                fontWeight="600"
                                fill="#b91c1c"
                              >
                                {filledValues[i].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </text>
                            );
                          }
                          return null;
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
          )}

          {/* Bottom Layer - Price Table - Show if: (admin AND bureau is marketing) OR superadmin */}
          {(isAdmin && (!bureau || bureau?.toLowerCase() === 'marketing')) && (
          <div className="bg-white rounded-lg shadow-sm p-8 w-full overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Laporan Harga Bulanan {selectedYear}</h2>
            <div ref={scrollRef} className="overflow-x-auto">
              <table style={{borderCollapse:'separate', borderSpacing:0}}>
                <thead>
                  <tr style={{backgroundColor:'#f9fafb'}}>
                    <th rowSpan={2} style={{border:'1px solid #ddd', padding:'12px 16px', textAlign:'center', width:'130px', position:'sticky', left:0, zIndex:2, backgroundColor:'#f9fafb', borderRight:'2px solid #aaa', boxShadow:'4px 0 6px -2px rgba(0,0,0,0.15)'}}>Kategori</th>
                    {MONTHS.map(m => (
                      <th key={m} colSpan={2} style={{border:'1px solid #ddd', padding:'12px 16px', textAlign:'center'}}>{m}</th>
                    ))}
                  </tr>
                  <tr style={{backgroundColor:'#f9fafb'}}>
                    {MONTHS.map((_, i) => {
                      return (
                        <React.Fragment key={i}>
                          <th style={{border:'1px solid #ddd', padding:'10px 16px', textAlign:'center', fontSize:'12px', whiteSpace:'nowrap'}}>Periode I</th>
                          <th style={{border:'1px solid #ddd', padding:'10px 16px', textAlign:'center', fontSize:'12px', whiteSpace:'nowrap'}}>Periode II</th>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((kat) => (
                    <tr key={kat} className="hover:bg-gray-50">
                      <td style={{border:'1px solid #ddd', padding:'12px 16px', fontWeight:'600', position:'sticky', left:0, zIndex:1, backgroundColor:'#fff', borderRight:'2px solid #aaa', boxShadow:'4px 0 6px -2px rgba(0,0,0,0.15)'}}>{kat}</td>
                      {MONTHS.map((_, mIdx) => {
                        return (
                          <React.Fragment key={mIdx}>
                            <td style={{border:'1px solid #ddd', padding:'12px 16px', textAlign:'center'}}>{getValue(kat, mIdx+1, 1)}</td>
                            <td style={{border:'1px solid #ddd', padding:'12px 16px', textAlign:'center'}}>{getValue(kat, mIdx+1, 2)}</td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      </div>
      </div>

      {/* Add Data Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">{modalPage === 1 ? 'Periode I' : 'Periode II'}</h2>
              <div className="flex gap-2 mt-3">
                <div className={`h-1 flex-1 rounded ${modalPage === 1 ? 'bg-white' : 'bg-blue-400'}`}></div>
                <div className={`h-1 flex-1 rounded ${modalPage === 2 ? 'bg-white' : 'bg-blue-400'}`}></div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {modalPage === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                      <input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                      <select value={formData.month} onChange={(e) => setFormData({...formData, month: Number(e.target.value)})}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none">
                        {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  {([['HMA','hma'],['PREMIUM','premium'],['HPM','hpm'],['HARGA JUAL','harga_jual']] as [string,string][]).map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input 
                        type="text" 
                        value={formData.periode1[key as keyof typeof formData.periode1]}
                        onChange={(e) => handleInputChange('periode1', key, e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" 
                      />
                    </div>
                  ))}
                </>
              )}
              {modalPage === 2 && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-2">
                    <p className="text-sm text-blue-800"><span className="font-semibold">Tahun:</span> {formData.year} | <span className="font-semibold">Bulan:</span> {MONTHS[formData.month - 1]}</p>
                  </div>
                  {([['HMA','hma'],['PREMIUM','premium'],['HPM','hpm'],['HARGA JUAL','harga_jual']] as [string,string][]).map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input 
                        type="text" 
                        value={formData.periode2[key as keyof typeof formData.periode2]}
                        onChange={(e) => handleInputChange('periode2', key, e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" 
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-between">
              <button 
                onClick={() => { setShowModal(false); setModalPage(1); }} 
                disabled={saving}
                className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <div className="flex gap-3">
                {modalPage === 2 && (
                  <button 
                    onClick={() => setModalPage(1)} 
                    disabled={saving}
                    className="px-5 py-2 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                )}
                {modalPage === 1 ? (
                  <button 
                    onClick={() => setModalPage(2)} 
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-xl font-bold text-white">Peringatan</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-base leading-relaxed">
                Data untuk <span className="font-semibold text-gray-900">{MONTHS[formData.month - 1]} {formData.year}</span> sudah ada.
              </p>
              <p className="text-gray-700 text-base leading-relaxed mt-2">
                Apakah Anda yakin ingin <span className="font-semibold text-orange-600">mengubah data yang sudah ada</span>?
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)} 
                disabled={saving}
                className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button 
                onClick={saveData} 
                disabled={saving}
                className="px-5 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  'Ya, Ubah Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
