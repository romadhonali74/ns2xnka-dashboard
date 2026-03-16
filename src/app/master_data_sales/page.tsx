"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { useUserRole } from "../hooks/useUserRole";
import { useRouter } from "next/navigation";

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const CATEGORIES = ['HMA','PREMIUM','HPM','HARGA JUAL'];

type PriceData = { [kategori: string]: { [key: string]: string } };

export default function MasterDataSalesPage() {
  const { isAdmin, bureau, isSuperAdmin, isLoading } = useUserRole();
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [priceData, setPriceData] = useState<PriceData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<PriceData>({});
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalPage, setModalPage] = useState(1);
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

  const isAuthorized = isSuperAdmin || (isAdmin && bureau?.toLowerCase() === 'marketing');

  // Redirect unauthorized users
  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.replace('/');
    }
  }, [isLoading, isAuthorized]);

  useEffect(() => {
    if (!isLoading && isAuthorized) fetchPriceData();
  }, [selectedYear, isLoading, isAuthorized]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onDown = (e: MouseEvent) => { isDragging.current = true; startX.current = e.clientX; scrollLeftRef.current = el.scrollLeft; };
    const onUp = () => { isDragging.current = false; };
    const onMove = (e: MouseEvent) => { if (!isDragging.current) return; el.scrollLeft = scrollLeftRef.current - (e.clientX - startX.current); };
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => { el.removeEventListener('mousedown', onDown); window.removeEventListener('mouseup', onUp); window.removeEventListener('mousemove', onMove); };
  }, []);

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

  const getValue = (kategori: string, month: number, periode: number) => {
    const value = priceData[kategori]?.[`${month}_${periode}`];
    if (!value || value === '-') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const hasTableData = () => {
    for (const kategori of CATEGORIES)
      for (let month = 1; month <= 12; month++)
        for (let periode = 1; periode <= 2; periode++) {
          const value = priceData[kategori]?.[`${month}_${periode}`];
          if (value && value !== '-' && parseFloat(value) > 0) return true;
        }
    return false;
  };

  const canEditCell = (kategori: string, month: number, periode: number) => {
    const value = priceData[kategori]?.[`${month}_${periode}`];
    return value && value !== '-' && parseFloat(value) > 0;
  };

  const handleEditChange = (kategori: string, month: number, periode: number, value: string) => {
    const regex = /^\d*\.?\d{0,2}$/;
    if (value === '' || regex.test(value)) {
      setEditData({ ...editData, [kategori]: { ...editData[kategori], [`${month}_${periode}`]: value } });
    }
  };

  const handleInputChange = (periode: 'periode1' | 'periode2', key: string, value: string) => {
    const regex = /^\d*\.?\d{0,2}$/;
    if (value === '' || regex.test(value))
      setFormData({ ...formData, [periode]: { ...formData[periode], [key]: value } });
  };

  const handleSave = async () => {
    const periode1Exists = priceData.HMA?.[`${formData.month}_1`] && priceData.HMA[`${formData.month}_1`] !== '-';
    const periode2Exists = priceData.HMA?.[`${formData.month}_2`] && priceData.HMA[`${formData.month}_2`] !== '-';
    if (periode1Exists || periode2Exists) { setShowConfirmModal(true); return; }
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
      setFormData({ year: new Date().getFullYear(), month: 1, periode1: { hma: '', premium: '', hpm: '', harga_jual: '' }, periode2: { hma: '', premium: '', hpm: '', harga_jual: '' } });
    } catch (error) {
      alert('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTable = async () => {
    try {
      setSaving(true);
      for (let month = 1; month <= 12; month++) {
        for (let periode = 1; periode <= 2; periode++) {
          const key = `${month}_${periode}`;
          const hma = editData.HMA?.[key] || '';
          const premium = editData.PREMIUM?.[key] || '';
          const hpm = editData.HPM?.[key] || '';
          const harga_jual = editData['HARGA JUAL']?.[key] || '';
          if (hma || premium || hpm || harga_jual) {
            await fetch('/api/price-monthly', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ year: selectedYear, month, [`periode${periode}`]: { hma: hma || '0', premium: premium || '0', hpm: hpm || '0', harga_jual: harga_jual || '0' } }),
            });
          }
        }
      }
      await fetchPriceData();
      setEditMode(false);
      setEditData({});
    } catch (error) {
      alert('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-[#f1f2f7]">Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f1f2f7" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="p-8 w-full">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-[#273240]">Master Data Sales</h1>
              <div className="flex gap-3 items-center">
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

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm p-6 w-full overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Laporan Harga Bulanan {selectedYear}</h2>
                {!editMode ? (
                  hasTableData() && (
                    <button onClick={() => { setEditMode(true); setEditData(JSON.parse(JSON.stringify(priceData))); }}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 cursor-pointer flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Data
                    </button>
                  )
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleSaveTable} disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => { setEditMode(false); setEditData({}); }} disabled={saving}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
              ) : (
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
                      {MONTHS.map((_, i) => (
                        <React.Fragment key={i}>
                          <th style={{border:'1px solid #ddd', padding:'10px 16px', textAlign:'center', fontSize:'12px', whiteSpace:'nowrap'}}>Periode I</th>
                          <th style={{border:'1px solid #ddd', padding:'10px 16px', textAlign:'center', fontSize:'12px', whiteSpace:'nowrap'}}>Periode II</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORIES.map((kat) => (
                      <tr key={kat} className="hover:bg-gray-50">
                        <td style={{border:'1px solid #ddd', padding:'12px 16px', fontWeight:'600', position:'sticky', left:0, zIndex:1, backgroundColor:'#fff', borderRight:'2px solid #aaa', boxShadow:'4px 0 6px -2px rgba(0,0,0,0.15)'}}>{kat}</td>
                        {MONTHS.map((_, mIdx) => (
                          <React.Fragment key={mIdx}>
                            <td style={{border:'1px solid #ddd', padding:'12px 16px', textAlign:'center'}}>
                              {editMode && canEditCell(kat, mIdx+1, 1) ? (
                                <input type="text" value={editData[kat]?.[`${mIdx+1}_1`] || ''} onChange={(e) => handleEditChange(kat, mIdx+1, 1, e.target.value)}
                                  placeholder="0.00" className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              ) : getValue(kat, mIdx+1, 1)}
                            </td>
                            <td style={{border:'1px solid #ddd', padding:'12px 16px', textAlign:'center'}}>
                              {editMode && canEditCell(kat, mIdx+1, 2) ? (
                                <input type="text" value={editData[kat]?.[`${mIdx+1}_2`] || ''} onChange={(e) => handleEditChange(kat, mIdx+1, 2, e.target.value)}
                                  placeholder="0.00" className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              ) : getValue(kat, mIdx+1, 2)}
                            </td>
                          </React.Fragment>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
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
                      <input type="text" value={formData.periode1[key as keyof typeof formData.periode1]}
                        onChange={(e) => handleInputChange('periode1', key, e.target.value)}
                        placeholder="0.00" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
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
                      <input type="text" value={formData.periode2[key as keyof typeof formData.periode2]}
                        onChange={(e) => handleInputChange('periode2', key, e.target.value)}
                        placeholder="0.00" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-between">
              <button onClick={() => { setShowModal(false); setModalPage(1); }} disabled={saving}
                className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>
              <div className="flex gap-3">
                {modalPage === 2 && (
                  <button onClick={() => setModalPage(1)} disabled={saving}
                    className="px-5 py-2 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    Back
                  </button>
                )}
                {modalPage === 1 ? (
                  <button onClick={() => setModalPage(2)} disabled={saving}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    Next
                  </button>
                ) : (
                  <button onClick={handleSave} disabled={saving}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : 'Save'}
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
              <p className="text-gray-700">Data untuk <span className="font-semibold">{MONTHS[formData.month - 1]} {formData.year}</span> sudah ada.</p>
              <p className="text-gray-700 mt-2">Apakah Anda yakin ingin <span className="font-semibold text-orange-600">mengubah data yang sudah ada</span>?</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setShowConfirmModal(false)} disabled={saving}
                className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                Batal
              </button>
              <button onClick={saveData} disabled={saving}
                className="px-5 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : 'Ya, Ubah Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
