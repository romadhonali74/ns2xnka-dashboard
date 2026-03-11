"use client";

import React, { useState, useRef } from "react";
import Sidebar from "../components/sidebar";

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const CATEGORIES = ['HMA','PREMIUM','HPM','HARGA JUAL'];

type PriceData = { [kategori: string]: { [key: string]: string } };

export default function SalesMarketingPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [priceData, setPriceData] = useState<PriceData>({});
  const [formData, setFormData] = useState({ year: new Date().getFullYear(), month: 1, periode: 1, hma: '', premium: '', hpm: '', harga_jual: '' });

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);

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

  const getValue = (kategori: string, month: number, periode: number) =>
    priceData[kategori]?.[`${month}_${periode}`] || '-';

  const handleSave = () => {
    const { month, periode, hma, premium, hpm, harga_jual } = formData;
    const key = `${month}_${periode}`;
    setPriceData(prev => ({
      ...prev,
      HMA: { ...prev.HMA, [key]: hma || '-' },
      PREMIUM: { ...prev.PREMIUM, [key]: premium || '-' },
      HPM: { ...prev.HPM, [key]: hpm || '-' },
      'HARGA JUAL': { ...prev['HARGA JUAL'], [key]: harga_jual || '-' },
    }));
    setShowModal(false);
    setFormData({ year: new Date().getFullYear(), month: 1, periode: 1, hma: '', premium: '', hpm: '', harga_jual: '' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f1f2f7" }}>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#273240]">Sales & Marketing</h1>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                + Add Data
              </button>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Top Layer - Chart */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Trend Penjualan</h2>
            <div className="bg-gray-50 rounded-lg p-4 h-72 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 900 220">
                <defs>
                  <pattern id="grid" width="75" height="44" patternUnits="userSpaceOnUse">
                    <path d="M 75 0 L 0 0 0 44" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <polyline fill="none" stroke="#10b981" strokeWidth="3"
                  points="40,180 115,160 190,145 265,130 340,115 415,100 490,120 565,90 640,75 715,65 790,55 865,45"/>
                {[40,115,190,265,340,415,490,565,640,715,790,865].map((x, i) => (
                  <circle key={i} cx={x} cy={[180,160,145,130,115,100,120,90,75,65,55,45][i]} r="4" fill="#10b981" />
                ))}
                {MONTHS_SHORT.map((m, i) => (
                  <text key={i} x={40 + i * 75} y="210" textAnchor="middle" fontSize="12" fill="#6b7280">{m}</text>
                ))}
              </svg>
            </div>
          </div>

          {/* Bottom Layer - Price Table */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Laporan Harga Bulanan {selectedYear}</h2>
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setTablePage(1)} className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${tablePage === 1 ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>Jan - Jun</button>
              <button onClick={() => setTablePage(2)} className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${tablePage === 2 ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>Jul - Des</button>
            </div>
            <div ref={scrollRef} className="overflow-x-auto">
              <table style={{borderCollapse:'separate', borderSpacing:0, width:'100%'}}>
                <thead>
                  <tr style={{backgroundColor:'#f9fafb'}}>
                    <th rowSpan={2} style={{border:'1px solid #ddd', padding:'12px 16px', textAlign:'center', minWidth:'130px', position:'sticky', left:0, zIndex:2, backgroundColor:'#f9fafb', borderRight:'2px solid #aaa', boxShadow:'4px 0 6px -2px rgba(0,0,0,0.15)'}}>Kategori</th>
                    {MONTHS.slice(tablePage === 1 ? 0 : 6, tablePage === 1 ? 6 : 12).map(m => (
                      <th key={m} colSpan={2} style={{border:'1px solid #ddd', padding:'12px 16px', textAlign:'center', minWidth:'160px'}}>{m}</th>
                    ))}
                  </tr>
                  <tr style={{backgroundColor:'#f9fafb'}}>
                    {MONTHS.slice(tablePage === 1 ? 0 : 6, tablePage === 1 ? 6 : 12).map((_, i) => {
                      return (
                        <React.Fragment key={i}>
                          <th style={{border:'1px solid #ddd', padding:'10px 16px', textAlign:'center', fontSize:'12px'}}>Periode I</th>
                          <th style={{border:'1px solid #ddd', padding:'10px 16px', textAlign:'center', fontSize:'12px'}}>Periode II</th>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((kat) => (
                    <tr key={kat} className="hover:bg-gray-50">
                      <td style={{border:'1px solid #ddd', padding:'12px 16px', fontWeight:'600', position:'sticky', left:0, zIndex:1, backgroundColor:'#fff', borderRight:'2px solid #aaa', boxShadow:'4px 0 6px -2px rgba(0,0,0,0.15)'}}>{kat}</td>
                      {MONTHS.slice(tablePage === 1 ? 0 : 6, tablePage === 1 ? 6 : 12).map((_, mIdx) => {
                        const realIdx = tablePage === 1 ? mIdx : mIdx + 6;
                        return (
                          <React.Fragment key={mIdx}>
                            <td style={{border:'1px solid #ddd', padding:'12px 16px', textAlign:'center'}}>{getValue(kat, realIdx+1, 1)}</td>
                            <td style={{border:'1px solid #ddd', padding:'12px 16px', textAlign:'center'}}>{getValue(kat, realIdx+1, 2)}</td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Data Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Add Price Data</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
                  <select value={formData.periode} onChange={(e) => setFormData({...formData, periode: Number(e.target.value)})}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none">
                    <option value={1}>Periode I</option>
                    <option value={2}>Periode II</option>
                  </select>
                </div>
              </div>
              {([['HMA','hma'],['PREMIUM','premium'],['HPM','hpm'],['HARGA JUAL','harga_jual']] as [string,string][]).map(([label, key]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type="text" value={(formData as any)[key]}
                    onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
