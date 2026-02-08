"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";

interface FinanceCategory {
  id: number;
  name: string;
  parent_id: number | null;
  is_header: boolean;
  sort_order: number;
  is_active: boolean;
  is_tittle: boolean;
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

export default function DetailReportPage() {
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID').replace(/,/g, '.')}`;
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
      const [categoriesResponse, monthlyDataResponse] = await Promise.all([
        fetch('/api/finance-categories'),
        fetch(`/api/finance-monthly-data?year=${selectedYear}${selectedMonth === 0 ? '' : `&month=${selectedMonth}`}`)
      ]);
      
      const categoriesData = await categoriesResponse.json();
      const monthlyDataResult = await monthlyDataResponse.json();
      
      setCategories(categoriesData);
      setMonthlyData(monthlyDataResult);
      
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
                  className="mr-2 p-1 hover:bg-gray-200 rounded"
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
    <div className="min-h-screen" style={{ backgroundColor: "#f1f2f7" }}>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#273240]">Detail Laporan Keuangan</h1>
            <div className="flex gap-3">
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
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm">Jumlah Hasil Penjualan</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(3330418111467)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm">Jumlah Biaya Produksi</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(909477221981)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm">Harga Pokok Penjualan</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(905260159286)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm">Laba (RUGI) Kotor</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(2425157952180)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm">Jumlah Biaya Usaha</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(315376838232)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm">Laba (RUGI) Usaha</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(2109781113948)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm">Jumlah Beban dan Pendapatan Lain</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(33375047014)}</td>
                    </tr>
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
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm">Laba Sebelum Pajak</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(2143156160962)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm">Pajak</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(470961379304)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm">EAT</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(1672194781658)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm">EBITDA</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm">{formatCurrency(2189227154289)}</td>
                    </tr>
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
  );
}
