"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import { useCrudPermissions, useUserRole } from "../../hooks/useUserRole";

interface FinanceCategoryMaster {
  id: number;
  nama_kategori: string;
  sort_order: number;
}

interface CashCostData {
  id?: number;
  kategori_biaya: string;
  januari: number;
  februari: number;
  maret: number;
  april: number;
  mei: number;
  juni: number;
  juli: number;
  agustus: number;
  september: number;
  oktober: number;
  november: number;
  desember: number;
}

export default function CashCostReportPage() {
  const { canCreate, canEdit, canDelete } = useCrudPermissions('finance');
  const { isLoading: permissionsLoading } = useUserRole();
  const [categories, setCategories] = useState<FinanceCategoryMaster[]>([]);
  const [cashCostData, setCashCostData] = useState<CashCostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/finance-categories-master');
      const data = await response.json();
      if (Array.isArray(data)) {
        const sortedCategories = data.sort((a: FinanceCategoryMaster, b: FinanceCategoryMaster) => a.sort_order - b.sort_order);
        setCategories(sortedCategories);
        
        // Fetch cash cost data from finance_cash_cost table
        const cashResponse = await fetch('/api/finance-cash-cost?tahun=2025');
        const cashData = await cashResponse.json();
        const existingData = Array.isArray(cashData) ? cashData : [];
        
        // Create cash cost data for each category
        const mergedData = sortedCategories.map(category => {
          const monthlyData = { januari: 0, februari: 0, maret: 0, april: 0, mei: 0, juni: 0, juli: 0, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0 };
          
          // Fill monthly data from database
          for (let month = 1; month <= 12; month++) {
            const monthData = existingData.find(item => item.category_id === category.id && item.bulan === month);
            if (monthData) {
              const monthNames = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
              monthlyData[monthNames[month - 1] as keyof typeof monthlyData] = monthData.nominal || 0;
            }
          }
          
          return {
            id: category.id,
            kategori_biaya: category.nama_kategori,
            ...monthlyData
          };
        });
        
        setCashCostData(mergedData);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      setCashCostData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (id: number, field: keyof CashCostData, value: string) => {
    setCashCostData(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: field === 'kategori_biaya' ? value : parseFloat(value) || 0 } : item
    ));
  };

  const handleSave = async (id: number) => {
    const item = cashCostData.find(data => data.id === id);
    if (!item) return;

    try {
      const monthNames = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
      
      // Save each month's data to finance_cash_cost table
      for (let month = 1; month <= 12; month++) {
        const monthName = monthNames[month - 1] as keyof CashCostData;
        const nominal = item[monthName] as number;
        
        const response = await fetch('/api/finance-cash-cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_id: item.id,
            nominal: nominal,
            bulan: month,
            tahun: 2025
          })
        });
      }
      
      setEditingId(null);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/finance-cash-cost?category_id=${id}&tahun=2025`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Reset data to 0 for all months instead of removing the row
        setCashCostData(prev => prev.map(item => 
          item.id === id ? {
            ...item,
            januari: 0, februari: 0, maret: 0, april: 0, mei: 0, juni: 0,
            juli: 0, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0
          } : item
        ));
      }
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };

if (loading || permissionsLoading) {
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
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#273240]">Cash Cost Report</h1>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                      Kategori Biaya
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Januari</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Februari</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Maret</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">April</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Mei</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Juni</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Juli</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Agustus</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">September</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Oktober</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">November</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Desember</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(cashCostData) && cashCostData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">
                        {item.kategori_biaya}
                      </td>
                      {['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'].map(month => (
                        <td key={month} className="border border-gray-200 px-4 py-3 text-center">
                          {editingId === item.id ? (
                            <input
                              type="number"
                              value={item[month as keyof CashCostData] as number}
                              onChange={(e) => handleInputChange(item.id!, month as keyof CashCostData, e.target.value)}
                              className="w-20 px-2 py-1 border rounded text-center"
                            />
                          ) : (
                            (item[month as keyof CashCostData] as number).toLocaleString()
                          )}
                        </td>
                      ))}
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        {editingId === item.id ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleSave(item.id!)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            {canEdit && (
                              <button
                                onClick={() => setEditingId(item.id!)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Edit
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(item.id!)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(cashCostData) || cashCostData.length === 0) && (
                    <tr>
                      <td colSpan={14} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                        Tidak ada data
                      </td>
                    </tr>
                  )}
                </tbody>
                </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}