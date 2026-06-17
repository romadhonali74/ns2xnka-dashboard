"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import "../components/stylish-crud-table.css";

import Sidebar from "../components/sidebar";
import { Plus, Edit, Trash2, Search, Download } from "lucide-react";
import { useAuth } from "../providers/auth_provider";
import { useMiningPermission } from "../hooks/useMiningPermission";

interface NiProductionData {
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
  created_at: string;
}

export default function MiningReportsTable() {
  const { canAddData, loading: permissionLoading } = useMiningPermission();
  const [productionData, setProductionData] = useState<NiProductionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmData, setConfirmData] = useState<any[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [form1, setForm1] = useState<{
    plan_wmt: string;
    actual_wmt: string;
    log_date: string;
  }>({
    plan_wmt: '',
    actual_wmt: '',
    log_date: new Date().toISOString().split('T')[0],
  });
  
  const [form2, setForm2] = useState<{
    plan_wmt: string;
    actual_wmt: string;
    log_date: string;
  }>({
    plan_wmt: '',
    actual_wmt: '',
    log_date: new Date().toISOString().split('T')[0],
  });
  
  const [form3, setForm3] = useState<{
    plan_wmt: string;
    actual_wmt: string;
    log_date: string;
  }>({
    plan_wmt: '',
    actual_wmt: '',
    log_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchProductionData();
  }, [selectedDate]);

  const fetchProductionData = async () => {
    setLoading(true);
    // Reset data first
    setProductionData([]);
    try {
      await createDefaultRows();
    } catch (error) {
      console.error('Network Error:', error);
      await createDefaultRows();
    }
    setLoading(false);
  };

  const createDefaultRows = async () => {
    // Reset all data variables
    let todayData = { mka_plan: 0, mka_actual: 0, stn_plan: 0, stn_actual: 0, moronopo_plan: 0, moronopo_actual: 0 };
    let monthToDateData = { mka_plan: 0, mka_actual: 0, stn_plan: 0, stn_actual: 0, moronopo_plan: 0, moronopo_actual: 0 };
    let yearToDateData = { mka_plan: 0, mka_actual: 0, stn_plan: 0, stn_actual: 0, moronopo_plan: 0, moronopo_actual: 0 };
    let thisMonthProgressData = { mka_plan: 0, mka_actual: 0, stn_plan: 0, stn_actual: 0, moronopo_plan: 0, moronopo_actual: 0 };
    let thisYearProgressData = { mka_plan: 0, mka_actual: 0, stn_plan: 0, stn_actual: 0, moronopo_plan: 0, moronopo_actual: 0 };
    
    const currentDate = new Date(selectedDate);
    const selectedYear = currentDate.getFullYear();
    const selectedMonth = currentDate.getMonth() + 1;
    
    try {
      // Fetch Today data from original API
      const response = await fetch(`/api/mining_reports?date=${selectedDate}`);
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          data.forEach((item: any) => {
            if (item.company_id === 1) {
              todayData.mka_plan = item.plan_wmt || 0;
              todayData.mka_actual = item.actual_wmt || 0;
            } else if (item.company_id === 2) {
              todayData.stn_plan = item.plan_wmt || 0;
              todayData.stn_actual = item.actual_wmt || 0;
            } else if (item.company_id === 3) {
              todayData.moronopo_plan = item.plan_wmt || 0;
              todayData.moronopo_actual = item.actual_wmt || 0;
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching mining reports:', error);
    }

    try {
      // Fetch Month-to-Date from summary view
      const mtdResponse = await fetch(`/api/mining_summary?year=${selectedYear}&month=${selectedMonth}`);
      if (mtdResponse.ok) {
        const mtdData = await mtdResponse.json();
        mtdData.forEach((item: any) => {
          if (item.company_id === 1) {
            monthToDateData.mka_plan = item.total_plan || 0;
            monthToDateData.mka_actual = item.total_actual || 0;
          } else if (item.company_id === 2) {
            monthToDateData.stn_plan = item.total_plan || 0;
            monthToDateData.stn_actual = item.total_actual || 0;
          } else if (item.company_id === 3) {
            monthToDateData.moronopo_plan = item.total_plan || 0;
            monthToDateData.moronopo_actual = item.total_actual || 0;
          }
        });
      }
      
      // This Month Progress = same as Month-to-Date for current month
      thisMonthProgressData = { ...monthToDateData };
      
      // Fetch Year-to-Date from summary view (sum all months up to current month)
      const ytdResponse = await fetch(`/api/mining_summary?year=${selectedYear}`);
      if (ytdResponse.ok) {
        const ytdData = await ytdResponse.json();
        ytdData.forEach((item: any) => {
          if (item.bulan <= selectedMonth) {
            if (item.company_id === 1) {
              yearToDateData.mka_plan += item.total_plan || 0;
              yearToDateData.mka_actual += item.total_actual || 0;
            } else if (item.company_id === 2) {
              yearToDateData.stn_plan += item.total_plan || 0;
              yearToDateData.stn_actual += item.total_actual || 0;
            } else if (item.company_id === 3) {
              yearToDateData.moronopo_plan += item.total_plan || 0;
              yearToDateData.moronopo_actual += item.total_actual || 0;
            }
          }
        });
      }
      
      // Fetch This Year Progress from summary view (all months)
      const thisYearResponse = await fetch(`/api/mining_summary?year=${selectedYear}`);
      if (thisYearResponse.ok) {
        const thisYearData = await thisYearResponse.json();
        thisYearData.forEach((item: any) => {
          if (item.company_id === 1) {
            thisYearProgressData.mka_plan += item.total_plan || 0;
            thisYearProgressData.mka_actual += item.total_actual || 0;
          } else if (item.company_id === 2) {
            thisYearProgressData.stn_plan += item.total_plan || 0;
            thisYearProgressData.stn_actual += item.total_actual || 0;
          } else if (item.company_id === 3) {
            thisYearProgressData.moronopo_plan += item.total_plan || 0;
            thisYearProgressData.moronopo_actual += item.total_actual || 0;
          }
        });
      }
    } catch (error) {
      console.error('Error fetching mining summary:', error);
    }

    const defaultRows = [
      { period_type: 'Today', ...todayData },
      { period_type: 'Month-to-Date', ...monthToDateData },
      { period_type: 'Year-to-Date', ...yearToDateData },
      { period_type: 'This Month (Progress)', ...thisMonthProgressData },
      { period_type: 'This Year (Progress)', ...thisYearProgressData }
    ];

    const processedRows = defaultRows.map(row => ({
      ...row,
      mka_percentage: row.mka_plan > 0 ? (row.mka_actual / row.mka_plan) * 100 : 0,
      stn_percentage: row.stn_plan > 0 ? (row.stn_actual / row.stn_plan) * 100 : 0,
      moronopo_percentage: row.moronopo_plan > 0 ? (row.moronopo_actual / row.moronopo_plan) * 100 : 0
    }));

    setProductionData(processedRows.map((row, index) => ({ ...row, id: index + 1, created_at: new Date().toISOString() })));
  };

  const checkExistingData = async (submissions: any[]) => {
    const existingRecords = [];
    
    for (const data of submissions) {
      try {
        const response = await fetch(`/api/mining_reports?date=${data.log_date}`);
        if (response.ok) {
          const existingData = await response.json();
          const existingRecord = existingData.find((item: any) => item.company_id === data.company_id);
          if (existingRecord) {
            const companyName = data.company_id === 1 ? 'PT Manado Karya Anugrah' : 
                              data.company_id === 2 ? 'PT Semarak Tambang Nusantara' : 'Site Moronopo';
            existingRecords.push({
              company: companyName,
              date: data.log_date,
              existing: { plan: existingRecord.plan_wmt, actual: existingRecord.actual_wmt },
              new: { plan: data.plan_wmt, actual: data.actual_wmt }
            });
          }
        }
      } catch (error) {
        console.error('Error checking existing data:', error);
      }
    }
    
    return existingRecords;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissions = [];
      
      // Submit form1 (MKA) if has data
      if (form1.plan_wmt || form1.actual_wmt) {
        submissions.push({
          company_id: 1,
          plan_wmt: parseFloat(form1.plan_wmt) || 0,
          actual_wmt: parseFloat(form1.actual_wmt) || 0,
          log_date: form1.log_date
        });
      }
      
      // Submit form2 (STN) if has data
      if (form2.plan_wmt || form2.actual_wmt) {
        submissions.push({
          company_id: 2,
          plan_wmt: parseFloat(form2.plan_wmt) || 0,
          actual_wmt: parseFloat(form2.actual_wmt) || 0,
          log_date: form2.log_date
        });
      }
      
      // Submit form3 (Moronopo) - calculated from form1 + form2 (tetap otomatis)
      if (form1.plan_wmt || form1.actual_wmt || form2.plan_wmt || form2.actual_wmt) {
        submissions.push({
          company_id: 3,
          plan_wmt: (parseFloat(form1.plan_wmt || '0') + parseFloat(form2.plan_wmt || '0')),
          actual_wmt: (parseFloat(form1.actual_wmt || '0') + parseFloat(form2.actual_wmt || '0')),
          log_date: form1.log_date
        });
      }
      
      // Check for existing data
      const existingRecords = await checkExistingData(submissions);
      
      if (existingRecords.length > 0 && !editing) {
        // Show custom confirmation modal
        setConfirmData(existingRecords);
        setPendingSubmissions(submissions);
        setShowConfirmModal(true);
        setLoading(false);
        return;
      }
      
      // Proceed with submission
      await submitData(submissions);
    } catch (error) {
      console.error('Network Error:', error);
      alert('Network error occurred while saving data.');
      setLoading(false);
    }
  };

  const submitData = async (submissions: any[]) => {
    try {
      // Submit all data with UPSERT logic
      for (const data of submissions) {
        const method = editing ? 'PUT' : 'POST';
        const response = await fetch('/api/mining_reports', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, upsert: true })
        });
        
        if (!response.ok) {
          const result = await response.json();
          const safeError = typeof result.error === 'string' ? result.error.replace(/[\r\n]/g, ' ') : 'Unknown error';
          console.error('Submit Error for company', data.company_id);
          alert(`Error saving data for company ${data.company_id}: ${safeError}`);
        }
      }
      
      setSuccessMessage('Data Sudah Tersimpan!');
      setShowSuccessModal(true);
      resetForm();
      fetchProductionData();
    } catch (error) {
      console.error('Network Error:', error);
      alert('Network error occurred while saving data.');
    }
    setLoading(false);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    await submitData(pendingSubmissions);
  };

  const handleCancelSave = () => {
    setShowConfirmModal(false);
    setConfirmData([]);
    setPendingSubmissions([]);
    setLoading(false);
  };

  const handleEdit = (data: NiProductionData) => {
    // Set form data based on period type
    if (data.period_type === 'Today') {
      // For Today data, we can edit the actual database records
      // This is a simplified approach - in real scenario you'd need to fetch actual records
      setForm1({ plan_wmt: data.mka_plan.toString(), actual_wmt: data.mka_actual.toString(), log_date: selectedDate });
      setForm2({ plan_wmt: data.stn_plan.toString(), actual_wmt: data.stn_actual.toString(), log_date: selectedDate });
      setForm3({ plan_wmt: data.moronopo_plan.toString(), actual_wmt: data.moronopo_actual.toString(), log_date: selectedDate });
      setEditing(true);
      setShowModal(true);
    } else {
      alert('Only "Today" data can be edited. Other rows are calculated values.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/mining_reports?id=${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          fetchProductionData();
        }
      } catch (error) {
        console.error('Network Error:', error);
      }
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm1({
      plan_wmt: '',
      actual_wmt: '',
      log_date: new Date().toISOString().split('T')[0],
    });
    setForm2({
      plan_wmt: '',
      actual_wmt: '',
      log_date: new Date().toISOString().split('T')[0],
    });
    setForm3({
      plan_wmt: '',
      actual_wmt: '',
      log_date: new Date().toISOString().split('T')[0],
    });
    setEditing(false);
    setShowModal(false);
  };

  const formatNumber = (num: number) => {
    return Math.round(num).toLocaleString('en-US');
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 100) return '#28a745'; // Green
    if (percentage >= 80) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  const exportToExcel = () => {
    const data = productionData.map(item => [
      item.period_type,
      formatNumber(item.mka_plan), formatNumber(item.mka_actual), `${item.mka_percentage.toFixed(2)}%`,
      formatNumber(item.stn_plan), formatNumber(item.stn_actual), `${item.stn_percentage.toFixed(2)}%`,
      formatNumber(item.mka_plan + item.stn_plan), formatNumber(item.mka_actual + item.stn_actual), 
      `${(item.mka_plan + item.stn_plan) > 0 ? (((item.mka_actual + item.stn_actual) / (item.mka_plan + item.stn_plan)) * 100).toFixed(2) : '0.00'}%`
    ]);
    
    let htmlContent = `
      <table border="1" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px;">
        <thead>
          <tr style="background-color: #ffffff; font-weight: bold;">
            <th rowspan="2" style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">Ni Production</th>
            <th colspan="3" style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">PT Manado Karya Anugrah</th>
            <th colspan="3" style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">PT Semarak Tambang Nusantara</th>
            <th colspan="3" style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">Site Moronopo</th>
          </tr>
          <tr style="background-color: #ffffff; font-weight: bold;">
            <th style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">Plan (wmt)</th>
            <th style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">Actual (wmt)</th>
            <th style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">%</th>
            <th style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">Plan (wmt)</th>
            <th style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">Actual (wmt)</th>
            <th style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">%</th>
            <th style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">Plan (wmt)</th>
            <th style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">Actual (wmt)</th>
            <th style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">%</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((row, index) => {
            const item = productionData[index];
            const mkaPct = getPercentageColor(item.mka_percentage);
            const stnPct = getPercentageColor(item.stn_percentage);
            const morPct = getPercentageColor((item.mka_plan + item.stn_plan) > 0 ? ((item.mka_actual + item.stn_actual) / (item.mka_plan + item.stn_plan)) * 100 : 0);
            
            return `<tr style="font-weight: bold;">
              <td style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">${row[0]}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">${row[1]}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">${row[2]}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center; color: ${mkaPct};">${row[3]}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">${row[4]}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">${row[5]}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center; color: ${stnPct};">${row[6]}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">${row[7]}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">${row[8]}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center; color: ${morPct};">${row[9]}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mining_Reports_${selectedDate}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f1f2f7" }}>
      <Sidebar />
        <div className="flex-1 overflow-auto">
        <div className="crud-container">
            <div className="crud-header">
                    <h2>Daily Nickel Production & Barging Report</h2>
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
                      {!permissionLoading && canAddData && (
                        <button 
                          className="btn-primary" 
                          onClick={() => setShowModal(true)} 
                          style={{display: 'flex', alignItems: 'center', gap: '6px'}}
                        >
                          <Plus size={16} />
                          Add Data
                        </button>
                      )}
                    </div>
                </div>
                
                <div style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <label style={{fontSize: '14px', fontWeight: 'bold'}}>Tanggal :</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={async (e) => {
                      const newDate = e.target.value;
                      setSelectedDate(newDate);
                    }}
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
                            <th rowSpan={2} style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>Ni Production</th>
                            <th colSpan={3} style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>PT Manado Karya Anugrah</th>
                            <th colSpan={3} style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>PT Semarak Tambang Nusantara</th>
                            <th colSpan={3} style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>Site Moronopo</th>
                            {/* <th rowSpan={2} style={{border: '1px solid black', padding: '8px', fontWeight: 'bold'}}>Actions</th> */}
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
                              <td colSpan={10} className="loading">Memuat Data...</td>
                              {/* <td colSpan={11} className="loading">Loading...</td> */}
                          </tr>
                          ) : productionData.length === 0 ? (
                          <tr>
                              <td colSpan={10} className="no-data">No data found</td>
                              {/* <td colSpan={11} className="no-data">No data found</td> */}
                          </tr>
                          ) : (
                          productionData.map((item) => (
                              <tr key={item.id} style={{fontWeight: 'bold'}}>
                                <td style={{border: '1px solid black', padding: '8px', fontWeight: 'bold', textAlign: 'center'}}>{item.period_type}</td>
                                <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.mka_plan)}</td>
                                <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.mka_actual)}</td>
                                <td style={{border: '1px solid black', padding: '8px', color: getPercentageColor(item.mka_percentage)}}>{item.mka_percentage.toFixed(2)}%</td>
                                <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.stn_plan)}</td>
                                <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.stn_actual)}</td>
                                <td style={{border: '1px solid black', padding: '8px', color: getPercentageColor(item.stn_percentage)}}>{item.stn_percentage.toFixed(2)}%</td>
                                <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.mka_plan + item.stn_plan)}</td>
                                <td style={{border: '1px solid black', padding: '8px'}}>{formatNumber(item.mka_actual + item.stn_actual)}</td>
                                <td style={{border: '1px solid black', padding: '8px', color: getPercentageColor((item.mka_plan + item.stn_plan) > 0 ? ((item.mka_actual + item.stn_actual) / (item.mka_plan + item.stn_plan)) * 100 : 0)}}>{(item.mka_plan + item.stn_plan) > 0 ? (((item.mka_actual + item.stn_actual) / (item.mka_plan + item.stn_plan)) * 100).toFixed(2) : '0.00'}%</td>
                                {/* <td style={{border: '1px solid black', padding: '8px'}}>
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
                                    </div>
                                </td> */}
                              </tr>
                          ))
                          )}
                      </tbody>
                    </table>
                </div>

                {showSuccessModal && (
                    <div className="modal-overlay" style={{zIndex: 10000}}>
                        <div className="modal" style={{maxWidth: '400px', width: '90vw', zIndex: 10001}}>
                            <div className="modal-header">
                                <h3>Success</h3>
                            </div>
                            <div style={{padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px'}}>
                                <p style={{margin: '0', fontSize: '16px', color: '#28a745'}}>{successMessage}</p>
                            </div>
                            <div className="form-actions" style={{justifyContent: 'center', padding: '20px'}}>
                                <button type="button" className="btn-primary" onClick={() => setShowSuccessModal(false)} style={{minWidth: '120px'}}>
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showConfirmModal && (
                    <div className="modal-overlay" style={{zIndex: 10000}}>
                        <div className="modal" style={{maxWidth: '600px', width: '90vw', zIndex: 10001}}>
                            <div className="modal-header">
                                <h3>Konfirmasi Penggantian Data</h3>
                            </div>
                            <div style={{padding: '20px'}}>
                                <p style={{marginBottom: '15px', fontWeight: 'bold', color: '#dc3545'}}>Data berikut sudah ada dan akan diganti:</p>
                                {confirmData.map((record, index) => (
                                    <div key={index} style={{marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f8f9fa'}}>
                                        <h4 style={{margin: '0 0 10px 0', color: '#007bff'}}>{record.company} ({record.date})</h4>
                                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px'}}>
                                            <div>
                                                <strong>Plan:</strong> {record.existing.plan} → <span style={{color: '#28a745', fontWeight: 'bold'}}>{record.new.plan}</span>
                                            </div>
                                            <div>
                                                <strong>Actual:</strong> {record.existing.actual} → <span style={{color: '#28a745', fontWeight: 'bold'}}>{record.new.actual}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <p style={{marginTop: '15px', fontWeight: 'bold'}}>Apakah Anda yakin ingin melanjutkan?</p>
                            </div>
                            <div className="form-actions" style={{justifyContent: 'center', gap: '15px', padding: '20px'}}>
                                <button type="button" className="btn-secondary" onClick={handleCancelSave} style={{minWidth: '120px'}}>
                                    Batal
                                </button>
                                <button type="button" className="btn-primary" onClick={handleConfirmSave} style={{backgroundColor: '#dc3545', minWidth: '120px'}}>
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal" style={{maxHeight: '90vh', overflowY: 'auto', width: '90vw', maxWidth: '1000px'}}>
                            <div className="modal-header">
                            <h3>{editing ? 'Edit Mining Report Data' : 'Add Mining Report Data'}</h3>
                            <button className="close-btn" onClick={resetForm}>×</button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-form">
                              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                                
                                {/* Frame 1: PT Manado Karya Anugrah */}
                                <div style={{border: '2px solid #007bff', borderRadius: '8px', padding: '15px', backgroundColor: '#f8f9fa'}}>
                                  <h4 style={{margin: '0 0 15px 0', color: '#007bff', textAlign: 'center'}}>PT Manado Karya Anugrah</h4>
                                  <div className="form-group">
                                    <label>Plan (wmt)</label>
                                    <input
                                      type="number"
                                      step="0.001"
                                      value={form1.plan_wmt}
                                      onChange={(e) => setForm1({ ...form1, plan_wmt: e.target.value })}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Actual (wmt)</label>
                                    <input
                                      type="number"
                                      step="0.001"
                                      value={form1.actual_wmt}
                                      onChange={(e) => setForm1({ ...form1, actual_wmt: e.target.value })}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Tanggal</label>
                                    <input
                                      type="date"
                                      value={form1.log_date}
                                      onChange={(e) => setForm1({ ...form1, log_date: e.target.value })}
                                    />
                                  </div>
                                </div>

                                {/* Frame 2: PT Semarak Tambang Nusantara */}
                                <div style={{border: '2px solid #28a745', borderRadius: '8px', padding: '15px', backgroundColor: '#f8f9fa'}}>
                                  <h4 style={{margin: '0 0 15px 0', color: '#28a745', textAlign: 'center'}}>PT Semarak Tambang Nusantara</h4>
                                  <div className="form-group">
                                    <label>Plan (wmt)</label>
                                    <input
                                      type="number"
                                      step="0.001"
                                      value={form2.plan_wmt}
                                      onChange={(e) => setForm2({ ...form2, plan_wmt: e.target.value })}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Actual (wmt)</label>
                                    <input
                                      type="number"
                                      step="0.001"
                                      value={form2.actual_wmt}
                                      onChange={(e) => setForm2({ ...form2, actual_wmt: e.target.value })}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Tanggal</label>
                                    <input
                                      type="date"
                                      value={form2.log_date}
                                      onChange={(e) => setForm2({ ...form2, log_date: e.target.value })}
                                    />
                                  </div>
                                </div>
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