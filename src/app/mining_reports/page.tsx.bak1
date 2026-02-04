"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import "../components/stylish-crud-table.css";

import Sidebar from "../components/sidebar";
import { Plus, Edit, Trash2, Search, Download } from "lucide-react";
import { useAuth } from "../providers/auth_provider";

interface ManualReportData {
  id: number;
  period_type: string;
  mka_plan: number;
  mka_actual: number;
  mka_percentage: number;
  stn_plan: number;
  stn_actual: number;
  stn_percentage: number;
  moronopo_plan: number;
  moronopo_actual: number;
  moronopo_percentage: number;
  date: string;
  created_at: string;
}

type PeriodType = 'Today' | 'Month-to-Date' | 'Year-to-Date' | 'This Month (Progress)' | 'This Year (Progress)';

type FormDataType = Record<PeriodType, {
  mka_plan: string;
  mka_actual: string;
  stn_plan: string;
  stn_actual: string;
}>;

export default function MiningReportsTable() {
  const [reportData, setReportData] = useState<ManualReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPeriodType, setCurrentPeriodType] = useState<PeriodType>('Today');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<FormDataType>({
    'Today': { mka_plan: '', mka_actual: '', stn_plan: '', stn_actual: '' },
    'Month-to-Date': { mka_plan: '', mka_actual: '', stn_plan: '', stn_actual: '' },
    'Year-to-Date': { mka_plan: '', mka_actual: '', stn_plan: '', stn_actual: '' },
    'This Month (Progress)': { mka_plan: '', mka_actual: '', stn_plan: '', stn_actual: '' },
    'This Year (Progress)': { mka_plan: '', mka_actual: '', stn_plan: '', stn_actual: '' }
  });
  const [form, setForm] = useState({
    period_type: '',
    mka_plan: '',
    mka_actual: '',
    stn_plan: '',
    stn_actual: '',
    moronopo_plan: '',
    moronopo_actual: ''
  });

  useEffect(() => {
    fetchReportData();
  }, [selectedDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mining_manual_reports?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching manual reports:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const periods: PeriodType[] = ['Today', 'Month-to-Date', 'Year-to-Date', 'This Month (Progress)', 'This Year (Progress)'];
      const filledPeriods = periods.filter(period => {
        const data = formData[period];
        return data && (data.mka_plan || data.mka_actual || data.stn_plan || data.stn_actual);
      });

      if (filledPeriods.length === 0) {
        alert('Please fill at least one period data');
        setLoading(false);
        return;
      }

      for (const period of filledPeriods) {
        const currentData = formData[period];
        const formDataToSubmit = {
          period_type: period,
          mka_plan: parseFloat(currentData.mka_plan) || 0,
          mka_actual: parseFloat(currentData.mka_actual) || 0,
          mka_percentage: currentData.mka_plan ? Math.round((parseFloat(currentData.mka_actual) / parseFloat(currentData.mka_plan)) * 100) : 0,
          stn_plan: parseFloat(currentData.stn_plan) || 0,
          stn_actual: parseFloat(currentData.stn_actual) || 0,
          stn_percentage: currentData.stn_plan ? Math.round((parseFloat(currentData.stn_actual) / parseFloat(currentData.stn_plan)) * 100) : 0,
          moronopo_plan: 0,
          moronopo_actual: 0,
          moronopo_percentage: 0,
          report_date: formDate
        };

        const method = editing ? 'PUT' : 'POST';
        const url = editing ? `/api/mining_manual_reports?id=${editingId}` : '/api/mining_manual_reports';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formDataToSubmit)
        });

        if (!response.ok) {
          alert(`Error saving data for ${period}`);
          setLoading(false);
          return;
        }
      }

      alert(`Successfully saved ${filledPeriods.length} period(s) data!`);
      resetForm();
      fetchReportData();
    } catch (error) {
      console.error('Error:', error);
      alert('Network error occurred');
    }
    setLoading(false);
  };

  const handleEdit = (data: ManualReportData) => {
    setForm({
      period_type: data.period_type,
      mka_plan: data.mka_plan.toString(),
      mka_actual: data.mka_actual.toString(),
      stn_plan: data.stn_plan.toString(),
      stn_actual: data.stn_actual.toString(),
      moronopo_plan: data.moronopo_plan.toString(),
      moronopo_actual: data.moronopo_actual.toString()
    });
    setEditingId(data.id);
    setEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/mining_manual_reports?id=${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          fetchReportData();
        }
      } catch (error) {
        console.error('Error:', error);
      }
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      period_type: '',
      mka_plan: '',
      mka_actual: '',
      stn_plan: '',
      stn_actual: '',
      moronopo_plan: '',
      moronopo_actual: ''
    });
    setFormData({
      'Today': { mka_plan: '', mka_actual: '', stn_plan: '', stn_actual: '' },
      'Month-to-Date': { mka_plan: '', mka_actual: '', stn_plan: '', stn_actual: '' },
      'Year-to-Date': { mka_plan: '', mka_actual: '', stn_plan: '', stn_actual: '' },
      'This Month (Progress)': { mka_plan: '', mka_actual: '', stn_plan: '', stn_actual: '' },
      'This Year (Progress)': { mka_plan: '', mka_actual: '', stn_plan: '', stn_actual: '' }
    });
    setEditing(false);
    setEditingId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setCurrentPage(0);
    setCurrentPeriodType('Today');
    setShowModal(false);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const exportToExcel = () => {
    const headers = [
      'Period',
      'MKA Plan (wmt)', 'MKA Actual (wmt)', 'MKA %',
      'STN Plan (wmt)', 'STN Actual (wmt)', 'STN %',
      'Moronopo Plan (wmt)', 'Moronopo Actual (wmt)', 'Moronopo %'
    ];
    const data = reportData.map(item => [
      item.period_type,
      formatNumber(item.mka_plan), formatNumber(item.mka_actual), `${item.mka_percentage}%`,
      formatNumber(item.stn_plan), formatNumber(item.stn_actual), `${item.stn_percentage}%`,
      formatNumber(item.moronopo_plan), formatNumber(item.moronopo_actual), `${item.moronopo_percentage}%`
    ]);
    
    let htmlContent = `
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f2f2f2; font-weight: bold;">
            ${headers.map(header => `<th style="padding: 8px; text-align: center;">${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => 
            `<tr>${row.map(cell => `<td style="padding: 8px; text-align: center;">${cell}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ManualReports.xls';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f1f2f7" }}>
      <div className="flex">
        <Sidebar />
        <div className="crud-container">
          <div className="crud-header">
            <h2>Mining Manual Reports</h2>
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                onClick={exportToExcel}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Download size={14} />
                Export Data
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setCurrentPage(0);
                  setCurrentPeriodType('Today');
                  setShowModal(true);
                }} 
                style={{display: 'flex', alignItems: 'center', gap: '6px'}}
              >
                <Plus size={16} />
                Add Data
              </button>
            </div>
          </div>
          
          <div style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <label style={{fontSize: '14px', fontWeight: 'bold'}}>Tanggal :</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
          
          <div className="table-container">
            <table style={{
              borderCollapse: 'collapse',
              width: '100%',
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid black'
            }}>
              <thead>
                <tr style={{backgroundColor: '#ffffff'}}>
                  <th rowSpan={2} style={{border: '1px solid black', padding: '8px', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 10}}>Ni Production</th>
                  <th colSpan={3} style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>PT Manado Karya Anugrah</th>
                  <th colSpan={3} style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>PT Semarak Tambang Nusantara</th>
                  <th colSpan={3} style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>Site Moronopo</th>
                  <th rowSpan={2} style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>Actions</th>
                </tr>
                <tr>
                  <th style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>Plan (wmt)</th>
                  <th style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>Actual (wmt)</th>
                  <th style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>%</th>
                  <th style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>Plan (wmt)</th>
                  <th style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>Actual (wmt)</th>
                  <th style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>%</th>
                  <th style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>Plan (wmt)</th>
                  <th style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>Actual (wmt)</th>
                  <th style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>%</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                <tr>
                  <td colSpan={11} className="loading">Loading...</td>
                </tr>
                ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="no-data">No data found</td>
                </tr>
                ) : (
                reportData.map((item) => (
                  <tr key={item.id} style={{fontWeight: 'bold'}}>
                    <td style={{border: '1px solid black', padding: '8px', fontWeight: 'bold', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 5}}>{item.period_type}</td>
                    <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.mka_plan)}</td>
                    <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.mka_actual)}</td>
                    <td style={{border: '1px solid black', padding: '8px'}}>{item.mka_plan > 0 ? Math.round((item.mka_actual / item.mka_plan) * 100) : 0}%</td>
                    <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.stn_plan)}</td>
                    <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.stn_actual)}</td>
                    <td style={{border: '1px solid black', padding: '8px'}}>{item.stn_plan > 0 ? Math.round((item.stn_actual / item.stn_plan) * 100) : 0}%</td>
                    <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.mka_plan + item.stn_plan)}</td>
                    <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.mka_actual + item.stn_actual)}</td>
                    <td style={{border: '1px solid black', padding: '8px'}}>{(item.mka_plan + item.stn_plan) > 0 ? Math.round(((item.mka_actual + item.stn_actual) / (item.mka_plan + item.stn_plan)) * 100) : 0}%</td>
                    <td style={{border: '1px solid black', padding: '8px'}}>
                      <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                        <button 
                          onClick={() => handleEdit(item)}
                          style={{
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <Edit size={12} />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          {showModal && (
            <div className="modal-overlay">
              <div className="modal" style={{maxHeight: '90vh', overflowY: 'auto', width: '90vw', maxWidth: '800px'}}>
                <div className="modal-header">
                  <h3>Report Data</h3>
                  <button className="close-btn" onClick={resetForm}>×</button>
                </div>
                
                <h4 style={{textAlign: 'center', marginBottom: '15px', color: '#333'}}>Periode</h4>
                <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px'}}>
                  {(['Today', 'Month-to-Date', 'Year-to-Date', 'This Month (Progress)', 'This Year (Progress)'] as const).map((period, index) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => {
                        setCurrentPage(index);
                        setCurrentPeriodType(period);
                      }}
                      style={{
                        padding: '8px 12px',
                        margin: '0 5px',
                        border: currentPage === index ? '2px solid #007bff' : '1px solid #ddd',
                        backgroundColor: currentPage === index ? '#007bff' : '#fff',
                        color: currentPage === index ? '#fff' : '#333',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {period === 'This Month (Progress)' ? 'This Month' : period === 'This Year (Progress)' ? 'This Year' : period}
                    </button>
                  ))}
                </div>
                
                <form onSubmit={handleSubmit} className="modal-form">
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px'}}>
                    <label style={{fontWeight: 'bold', minWidth: '60px'}}>Tanggal :</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '150px'
                      }}
                    />
                  </div>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px'}}>
                    <div style={{border: '2px solid #007bff', borderRadius: '8px', padding: '15px', backgroundColor: '#f8f9fa'}}>
                      <h4 style={{margin: '0 0 15px 0', color: '#007bff', textAlign: 'center'}}>PT Manado Karya Anugrah</h4>
                      <div className="form-group">
                        <label>Plan (wmt)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={formData[currentPeriodType]?.mka_plan || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            [currentPeriodType]: {
                              ...(formData[currentPeriodType] || {}),
                              mka_plan: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Actual (wmt)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={formData[currentPeriodType]?.mka_actual || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            [currentPeriodType]: {
                              ...(formData[currentPeriodType] || {}),
                              mka_actual: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>

                    <div style={{border: '2px solid #28a745', borderRadius: '8px', padding: '15px', backgroundColor: '#f8f9fa'}}>
                      <h4 style={{margin: '0 0 15px 0', color: '#28a745', textAlign: 'center'}}>PT Semarak Tambang Nusantara</h4>
                      <div className="form-group">
                        <label>Plan (wmt)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={formData[currentPeriodType]?.stn_plan || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            [currentPeriodType]: {
                              ...(formData[currentPeriodType] || {}),
                              stn_plan: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Actual (wmt)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={formData[currentPeriodType]?.stn_actual || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            [currentPeriodType]: {
                              ...(formData[currentPeriodType] || {}),
                              stn_actual: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>

                    {/* <div style={{border: '2px solid #dc3545', borderRadius: '8px', padding: '15px', backgroundColor: '#f8f9fa'}}>
                      <h4 style={{margin: '0 0 15px 0', color: '#dc3545', textAlign: 'center'}}>Site Moronopo</h4>
                      <div className="form-group">
                        <label>Plan (wmt)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={form.moronopo_plan}
                          onChange={(e) => setForm({ ...form, moronopo_plan: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Actual (wmt)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={form.moronopo_actual}
                          onChange={(e) => setForm({ ...form, moronopo_actual: e.target.value })}
                        />
                      </div>
                    </div> */}
                  </div>
                  
                  <div className="form-actions" style={{marginTop: '20px'}}>
                    <button type="button" className="btn-secondary" onClick={resetForm}>
                      Batal
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}