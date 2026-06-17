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
  const [showModal, setShowModal] = useState(false);
  const [editingData, setEditingData] = useState<CashCostData | null>(null);

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

  const handleEdit = (item: CashCostData) => {
    setEditingData({...item});
    setShowModal(true);
  };

  const handleModalInputChange = (field: keyof CashCostData, value: string) => {
    if (editingData) {
      setEditingData({
        ...editingData,
        [field]: field === 'kategori_biaya' ? value : parseFloat(value) || 0
      });
    }
  };

  const handleSave = async () => {
    if (!editingData) return;

    try {
      const monthNames = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
      
      for (let month = 1; month <= 12; month++) {
        const monthName = monthNames[month - 1] as keyof CashCostData;
        const nominal = editingData[monthName] as number;
        
        await fetch('/api/finance-cash-cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_id: editingData.id,
            nominal: nominal,
            bulan: month,
            tahun: 2025
          })
        });
      }
      
      setShowModal(false);
      setEditingData(null);
      fetchCategories();
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
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f1f2f7" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="p-8 w-full">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-center">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f1f2f7" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-8 w-full">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#273240]">Cash Cost Report</h1>
            </div>
            
            <div className="overflow-x-auto">
              <table style={{border: '1px solid #ddd', borderCollapse: 'collapse', width: '100%'}}>
                <thead>
                  <tr className="bg-gray-50">
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>
                      Kategori Biaya
                    </th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Jan</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Feb</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Mar</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Apr</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Mei</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Jun</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Jul</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Agu</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Sep</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Okt</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Nov</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Des</th>
                    <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(cashCostData) && cashCostData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td style={{border: '1px solid #ddd', padding: '8px'}}>
                        {item.kategori_biaya}
                      </td>
                      {['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'].map(month => (
                        <td key={month} style={{border: '1px solid #ddd', padding: '8px'}}>
                          {(item[month as keyof CashCostData] as number).toLocaleString('id-ID')}
                        </td>
                      ))}
                      <td style={{border: '1px solid #ddd', padding: '8px'}}>
                        <div className="flex gap-1 justify-center">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id!)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
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

      {/* Modal Edit */}
      {showModal && editingData && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Edit Data - {editingData.kategori_biaya}</h3>
              <button onClick={() => { setShowModal(false); setEditingData(null); }} className="text-white hover:text-gray-200 text-2xl cursor-pointer">×</button>
            </div>
            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 140px)'}}>
              <div className="grid grid-cols-3 gap-4">
                {['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'].map(month => (
                  <div key={month}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{month}</label>
                    <input
                      type="number"
                      value={editingData[month as keyof CashCostData] as number}
                      onChange={(e) => handleModalInputChange(month as keyof CashCostData, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowModal(false); setEditingData(null); }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}