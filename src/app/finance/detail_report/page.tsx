"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import { useCrudPermissions } from "../../hooks/useUserRole";

interface FinanceCategory {
  id: number;
  name: string;
  parent_id: number | null;
  is_header: boolean;
  sort_order: number;
  is_active: boolean;
  is_tittle: boolean;
  is_summary: boolean;
}

interface MonthlyData {
  id: number;
  category_id: number;
  year: number;
  month: number;
  amount: number;
}

interface FinanceSummary {
  id: number;
  item_name: string;
  amount: number;
  year: number;
  month: number | null;
}

interface FinanceSummaryView {
  year: number;
  month: number;
  biaya_produksi: number;
  hpp: number;
  laba_kotor: number;
  biaya_usaha: number;
  laba_usaha: number;
  beban_pendapatan_lain: number;
  laba_sebelum_pajak: number;
  eat: number;
  ebitda: number;
}



export default function DetailReportPage() {
  const { canCreate, canEdit, canDelete } = useCrudPermissions('finance');
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary[]>([]);
  const [summaryView, setSummaryView] = useState<FinanceSummaryView | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [formPage, setFormPage] = useState(1);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    cat1: '', cat6: '', cat9: '', cat10: '', cat11: '', cat18: '', cat19: '', cat20: '', cat21: '', cat22: '', cat23: '',
    cat24: '', cat8: '', cat12: '', cat13: '', cat25: '', cat14: '', cat26: '', cat29: ''
  });

  const formatCurrency = (amount: number) => {
    return `Rp ${Math.floor(amount).toLocaleString('id-ID').replace(/,/g, '.')}`;
  };

  const getSummaryAmount = (itemName: string) => {
    const data = financeSummary.find(item => item.item_name === itemName);
    return data ? data.amount : 0;
  };

  useEffect(() => {
    fetchCategories();
  }, [selectedMonth, selectedYear]);



  const getAmountForCategory = (categoryId: number) => {
    const data = monthlyData.find(item => item.category_id === categoryId);
    return data ? data.amount : 0;
  };

  const fetchCategories = async () => {
    try {
      const [categoriesResponse, monthlyDataResponse, summaryViewResponse] = await Promise.all([
        fetch('/api/finance-categories'),
        fetch(`/api/finance-monthly-data?year=${selectedYear}${selectedMonth === 0 ? '' : `&month=${selectedMonth}`}`),
        fetch(`/api/finance-summary-view?year=${selectedYear}${selectedMonth === 0 ? '' : `&month=${selectedMonth}`}`)
      ]);
      
      const categoriesData = await categoriesResponse.json();
      const monthlyDataResult = await monthlyDataResponse.json();
      
      setCategories(categoriesData);
      setMonthlyData(monthlyDataResult);
      
      if (summaryViewResponse.ok) {
        const summaryViewData = await summaryViewResponse.json();
        setSummaryView(summaryViewData[0] || null);
      }
      
      // Fetch summary data separately with error handling
      try {
        const summaryResponse = await fetch(`/api/finance-summary?year=${selectedYear}${selectedMonth === 0 ? '' : `&month=${selectedMonth}`}`);
        if (summaryResponse.ok && summaryResponse.headers.get('content-type')?.includes('application/json')) {
          const summaryData = await summaryResponse.json();
          setFinanceSummary(summaryData);
        } else {
          console.log('Finance summary API not available');
          setFinanceSummary([]);
        }
      } catch (summaryError) {
        console.log('Finance summary API error:', summaryError);
        setFinanceSummary([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getChildCategories = (parentId: number) => {
    return categories.filter(cat => cat.parent_id === parentId && cat.is_active === true).sort((a, b) => a.sort_order - b.sort_order);
  };

  const getHeaderCategories = () => {
    return categories.filter(cat => cat.is_header === true && cat.parent_id === null && cat.is_active === true).sort((a, b) => a.sort_order - b.sort_order);
  };

  const renderCategory = (category: FinanceCategory, level: number = 0) => {
    const children = getChildCategories(category.id);
    const isExpanded = expandedRows.has(category.id);
    const paddingLeft = level * 24 + (level > 0 ? 8 : 0);

    return (
      <React.Fragment key={category.id}>
        <tr className={`hover:bg-gray-50 ${level > 0 ? 'bg-gray-25' : ''}`}>
          <td className="border border-gray-200 px-4 py-3">
            <div className="flex items-center" style={{ paddingLeft: `${paddingLeft}px` }}>
              {children.length > 0 && (
                <button
                  onClick={() => toggleRow(category.id)}
                  className="mr-2 p-1 hover:bg-gray-200 rounded cursor-pointer"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <span className={`${
                category.is_header ? 'font-bold text-gray-900' : 
                level === 0 ? 'font-semibold text-gray-800' : 'text-gray-600'
              }`}>
                {category.name}
              </span>
            </div>
          </td>
          <td className="border border-gray-200 px-4 py-3 text-right">
            {!category.is_tittle && (
              <span className={category.is_header ? 'font-bold' : level === 0 ? 'font-semibold' : ''}>
                {getAmountForCategory(category.id).toLocaleString('id-ID')}
              </span>
            )}
          </td>
        </tr>
        
        {isExpanded && children.map((child) => renderCategory(child, level + 1))}
      </React.Fragment>
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/finance-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setAlertType('success');
        setAlertMessage('Data berhasil disimpan!');
        setShowAlert(true);
        setShowModal(false);
        setFormPage(1);
        fetchCategories();
        setTimeout(() => {
          setIsClosing(true);
          setTimeout(() => {
            setShowAlert(false);
            setIsClosing(false);
          }, 300);
        }, 2700);
      } else {
        const errorData = await response.json();
        setAlertType('error');
        setAlertMessage(`Gagal menyimpan data: ${errorData.error || 'Unknown error'}`);
        setShowAlert(true);
        setTimeout(() => {
          setIsClosing(true);
          setTimeout(() => {
            setShowAlert(false);
            setIsClosing(false);
          }, 300);
        }, 2700);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setAlertType('error');
      setAlertMessage('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
      setShowAlert(true);
      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          setShowAlert(false);
          setIsClosing(false);
        }, 300);
      }, 2700);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f1f2f7" }}>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-center">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#273240]">Detail Laporan Keuangan</h1>
            <div className="flex gap-3">
              {canCreate && (
                <button
                  onClick={() => {
                    setFormPage(1);
                    setFormData({
                      month: new Date().getMonth() + 1,
                      year: new Date().getFullYear(),
                      cat1: '', cat6: '', cat9: '', cat10: '', cat11: '', cat18: '', cat19: '', cat20: '', cat21: '', cat22: '', cat23: '',
                      cat24: '', cat8: '', cat12: '', cat13: '', cat25: '', cat14: '', cat26: '', cat29: ''
                    });
                    setShowModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  + Add Financial Data
                </button>
              )}
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Sepanjang Tahun</option>
                <option value={1}>Januari</option>
                <option value={2}>Februari</option>
                <option value={3}>Maret</option>
                <option value={4}>April</option>
                <option value={5}>Mei</option>
                <option value={6}>Juni</option>
                <option value={7}>Juli</option>
                <option value={8}>Agustus</option>
                <option value={9}>September</option>
                <option value={10}>Oktober</option>
                <option value={11}>November</option>
                <option value={12}>Desember</option>
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Top Layer - Visual Scorecards */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Total Penjualan */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Penjualan</p>
                  <p className="text-2xl font-bold mt-2">Rp 3.330.418.111.467</p>
                </div>
                <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Gross Profit % */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Gross Profit %</p>
                  <p className="text-2xl font-bold mt-2">98%</p>
                </div>
                <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Net Profit</p>
                  <p className="text-2xl font-bold mt-2">Rp 2.143.156.160.962</p>
                </div>
                <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Middle Layer - Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Trend Laba Rugi</h2>
            <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 800 200">
                <defs>
                  <pattern id="grid" width="80" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 80 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  points="40,160 120,140 200,120 280,100 360,90 440,85 520,95 600,80 680,70 760,60"
                />
                
                {[40,120,200,280,360,440,520,600,680,760].map((x, i) => {
                  const y = [160,140,120,100,90,85,95,80,70,60][i];
                  return (
                    <circle key={i} cx={x} cy={y} r="4" fill="#3b82f6" />
                  );
                })}
                
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((month, i) => (
                  <text key={i} x={40 + i * 80} y="190" textAnchor="middle" className="text-xs fill-gray-600">
                    {month}
                  </text>
                ))}
              </svg>
            </div>
            <div className="flex items-center justify-center mt-2">
              {/* <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Laba Rugi</span>
              </div> */}
            </div>
          </div>
          
          {/* Bottom Layer - Data Tables */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Summary Tables */}
            <div className="flex gap-6 mb-6">
              {/* First Summary Table */}
              <div className="bg-gray-50 rounded-lg p-4">
                <table className="border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 bg-gray-100">Deskripsi</th>
                      <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700 bg-gray-100">Nilai (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryView && [
                      { label: 'Biaya Produksi', value: summaryView.biaya_produksi },
                      { label: 'Harga Pokok Penjualan', value: summaryView.hpp },
                      { label: 'Laba Kotor', value: summaryView.laba_kotor },
                      { label: 'Biaya Usaha', value: summaryView.biaya_usaha },
                      { label: 'Laba Usaha', value: summaryView.laba_usaha },
                      { label: 'Beban & Pendapatan Lain', value: summaryView.beban_pendapatan_lain }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.label}</td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(item.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Second Summary Table */}
              <div className="bg-gray-50 rounded-lg p-4">
                <table className="border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 bg-gray-100">Deskripsi</th>
                      <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700 bg-gray-100">Nilai (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryView && [
                      { label: 'Laba Sebelum Pajak', value: summaryView.laba_sebelum_pajak },
                      { label: 'EAT', value: summaryView.eat },
                      { label: 'EBITDA', value: summaryView.ebitda }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{item.label}</td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(item.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">URAIAN</th>
                    <th className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-700">Jumlah (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {getHeaderCategories().map((header) => renderCategory(header))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {showAlert && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${isClosing ? 'animate-slide-down' : 'animate-fade-in'}`}>
          <div className={`px-6 py-4 rounded-lg shadow-lg ${
            alertType === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white flex items-center gap-3`}>
            {alertType === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{alertMessage}</span>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Add Financial Data</h2>
              <p className="text-blue-100 text-sm mt-1">Page {formPage} of 2</p>
            </div>
            
            <div className="p-8 overflow-y-auto" id="modal-scroll-container" style={{maxHeight: 'calc(90vh - 180px)'}}>
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bulan</label>
                  <select value={formData.month} onChange={(e) => setFormData({...formData, month: Number(e.target.value)})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors">
                    <option value={1}>Januari</option>
                    <option value={2}>Februari</option>
                    <option value={3}>Maret</option>
                    <option value={4}>April</option>
                    <option value={5}>Mei</option>
                    <option value={6}>Juni</option>
                    <option value={7}>Juli</option>
                    <option value={8}>Agustus</option>
                    <option value={9}>September</option>
                    <option value={10}>Oktober</option>
                    <option value={11}>November</option>
                    <option value={12}>Desember</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tahun</label>
                  <input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: Number(e.target.value)})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                </div>
              </div>

              {formPage === 1 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah Hasil Penjualan</label>
                    <input type="text" value={formData.cat1} onChange={(e) => setFormData({...formData, cat1: e.target.value})} className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-bold text-gray-800 mb-4">Harga Pokok Penjualan</p>
                    <div className="space-y-3">
                      <div className="pl-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Persediaan Awal</label>
                        <input type="text" value={formData.cat6} onChange={(e) => setFormData({...formData, cat6: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                      </div>
                      <div className="pl-4 mt-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Biaya Produksi</label>
                      </div>
                      <div className="pl-8 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Biaya Bahan</label>
                          <input type="text" value={formData.cat9} onChange={(e) => setFormData({...formData, cat9: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Biaya Pegawai</label>
                          <input type="text" value={formData.cat10} onChange={(e) => setFormData({...formData, cat10: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Biaya Jasa</label>
                          <input type="text" value={formData.cat11} onChange={(e) => setFormData({...formData, cat11: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Biaya Lain</label>
                          <input type="text" value={formData.cat18} onChange={(e) => setFormData({...formData, cat18: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Biaya Depresiasi</label>
                          <input type="text" value={formData.cat19} onChange={(e) => setFormData({...formData, cat19: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Biaya Amortisasi</label>
                          <input type="text" value={formData.cat20} onChange={(e) => setFormData({...formData, cat20: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Biaya Pajak dan Retribusi</label>
                          <input type="text" value={formData.cat21} onChange={(e) => setFormData({...formData, cat21: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Biaya Royalti</label>
                          <input type="text" value={formData.cat22} onChange={(e) => setFormData({...formData, cat22: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Biaya Litbang</label>
                          <input type="text" value={formData.cat23} onChange={(e) => setFormData({...formData, cat23: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formPage === 2 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Biaya Ore di Transfer ke Pomalaa</label>
                      <input type="text" value={formData.cat24} onChange={(e) => setFormData({...formData, cat24: e.target.value})} className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Persediaan Akhir</label>
                      <input type="text" value={formData.cat8} onChange={(e) => setFormData({...formData, cat8: e.target.value})} className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-bold text-gray-800 mb-4">Biaya Usaha</p>
                    <div className="pl-4 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Beban Admin & Umum</label>
                        <input type="text" value={formData.cat12} onChange={(e) => setFormData({...formData, cat12: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Beban Pemasaran</label>
                        <input type="text" value={formData.cat13} onChange={(e) => setFormData({...formData, cat13: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-2">Biaya Overhead Kirim Pomalaa</label>
                        <input type="text" value={formData.cat25} onChange={(e) => setFormData({...formData, cat25: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-bold text-gray-800 mb-4">Beban & Pendapatan Lain</p>
                    <div className="pl-4 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Pendapatan dan Beban Keuangan</label>
                        <input type="text" value={formData.cat14} onChange={(e) => setFormData({...formData, cat14: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Pendapatan dan Beban Lain-lain</label>
                        <input type="text" value={formData.cat26} onChange={(e) => setFormData({...formData, cat26: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-2">Pajak</label>
                        <input type="text" value={formData.cat29} onChange={(e) => setFormData({...formData, cat29: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-8 py-5 flex justify-between items-center border-t">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
              <div className="flex gap-3">
                {formPage === 2 && <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {isSubmitting && (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting ? 'Menyimpan...' : 'Submit'}
                </button>}
                {formPage === 2 && <button onClick={() => { setFormPage(1); document.getElementById('modal-scroll-container')?.scrollTo(0, 0); }} className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">Back</button>}
                {formPage === 1 && <button onClick={() => { setFormPage(2); document.getElementById('modal-scroll-container')?.scrollTo(0, 0); }} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg cursor-pointer">Next</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
