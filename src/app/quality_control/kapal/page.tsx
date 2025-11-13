"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import "../../components/stylish-crud-table.css";

import Sidebar from "../../components/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus, Edit, Trash2, Search, Filter, Download, FileText } from "lucide-react";
import { useAuth } from "../../providers/auth_provider";
import { useQCPermission } from "../../hooks/useQCPermission";
import { text } from "stream/consumers";

interface User {
  id: number;
  No: string;
  Tahun: string;
  Kode: string;
  Nama_Kapal: string;
  Lokasi: string;
  SB: string;
  Ni: string;
  Co: string;
  Fe: string;
  SiO2: string;
  CaO: string;
  MgO: string;
  Jam_Mulai: string;
  Jam_Selesai: string;
  Analis: string;
  Tgl_Analisa: string;
  Ni_C: string;
  MC: string;
  Tanggal_Conversi: string;
  W1_1: string;
  W1_2: string;
  W0_1: string;
  W02: string;
  Vp_1: string;
  Vp_2: string;
  Faktor1: string;
  Faktor2: string;
  X_Ni_C: string;
  Jam_Mulai2: string;
  Jam_Selesai3: string;
  Analis1: string;
  Analis2: string;
  W1: string;
  W2: string;
  Diff_Wet: string;
  Avg_Ni_Wet: string;
  X_Ni1A: string;
  Diff: string;
  X_Ni2: string;
  Diff2: string;
}

export default function StylishCRUDTable() {
  const { canAddData, showActions } = useQCPermission();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showSpinner, setShowSpinner] = useState<{[key: string]: boolean}>({});

  // Format decimal functions
  const formatDecimal = (value: string) => {
    if (!value) return '';
    return value.replace('.', ',');
  };

  const parseDecimal = (value: string) => {
    if (!value) return '';
    return value.replace(',', '.');
  };

  const DecimalInput = ({ label, field, value, onChange }: { label: string, field: string, value: string, onChange: (value: string) => void }) => (
    <div className="form-group">
      <label>{label}</label>
      <div 
        style={{position: 'relative'}}
        onMouseEnter={() => setShowSpinner({...showSpinner, [field]: true})}
        onMouseLeave={() => setShowSpinner({...showSpinner, [field]: false})}
      >
        <input
          type="text"
          value={formatDecimal(value)}
          onChange={(e) => {
            const val = e.target.value;
            if (/^[0-9]*[,]?[0-9]*$/.test(val)) {
              onChange(parseDecimal(val));
            }
          }}
          onFocus={() => setShowSpinner({...showSpinner, [field]: true})}
          onBlur={() => setShowSpinner({...showSpinner, [field]: false})}
          placeholder="0,00"
          style={{paddingRight: showSpinner[field] ? '16px' : '8px'}}
          required
        />
        {showSpinner[field] && (
          <div style={{position: 'absolute', right: '1px', top: '1px', bottom: '1px', width: '14px', display: 'flex', flexDirection: 'column'}}>
            <button
              type="button"
              onClick={() => {
                const currentValue = parseFloat(value || '0');
                onChange((currentValue + 0.01).toFixed(2));
              }}
              style={{flex: 1, border: 'none', background: '#e9ecef', cursor: 'pointer', fontSize: '8px', borderRadius: '0 2px 0 0'}}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => {
                const currentValue = parseFloat(value || '0');
                onChange(Math.max(0, currentValue - 0.01).toFixed(2));
              }}
              style={{flex: 1, border: 'none', background: '#e9ecef', cursor: 'pointer', fontSize: '8px', borderRadius: '0 0 2px 0'}}
            >
              ▼
            </button>
          </div>
        )}
      </div>
    </div>
  );
  // const [form, setForm] = useState<{ id: number; nama_kapal: string; kapasitas: number; jenis_kapal: string; status: string; pelabuhan_asal: string; pelabuhan_tujuan: string; tanggal_berangkat: string; tanggal_tiba: string }>({ id: 0, nama_kapal: "", kapasitas: 0, jenis_kapal: "", status: "", pelabuhan_asal: "", pelabuhan_tujuan: "", tanggal_berangkat: "", tanggal_tiba: "" });
  const [form, setForm] = useState
      <{
        id: number;
        No: string;
        Tahun: string;
        Kode: string;
        Nama_Kapal: string;
        Lokasi: string;
        SB: string;
        Ni: string;
        Co: string;
        Fe: string;
        SiO2: string;
        CaO: string;
        MgO: string;
        Jam_Mulai: string;
        Jam_Selesai: string;
        Analis: string;
        Tgl_Analisa: string;
        Ni_C: string;
        MC: string;
        Tanggal_Conversi: string;
        W1_1: string;
        W1_2: string;
        W0_1: string;
        W02: string;
        Vp_1: string;
        Vp_2: string;
        Faktor1: string;
        Faktor2: string;
        X_Ni_C: string;
        Jam_Mulai2: string;
        Jam_Selesai3: string;
        Analis1: string;
        Analis2: string;
        W1: string;
        W2: string;
        Diff_Wet: string;
        Avg_Ni_Wet: string;
        X_Ni1A: string;
        Diff: string;
        X_Ni2: string;
        Diff2: string;
      }>({
        id: 0,
        No: "",
        Tahun: "",
        Kode: "",
        Nama_Kapal: "",
        Lokasi: "",
        SB: "",
        Ni: "",
        Co: "",
        Fe: "",
        SiO2: "",
        CaO: "",
        MgO: "",
        Jam_Mulai: "",
        Jam_Selesai: "",
        Analis: "",
        Tgl_Analisa: "",
        Ni_C: "",
        MC: "",
        Tanggal_Conversi: "",
        W1_1: "",
        W1_2: "",
        W0_1: "",
        W02: "",
        Vp_1: "",
        Vp_2: "",
        Faktor1: "",
        Faktor2: "",
        X_Ni_C: "",
        Jam_Mulai2: "",
        Jam_Selesai3: "",
        Analis1: "",
        Analis2: "",
        W1: "",
        W2: "",
        Diff_Wet: "",
        Avg_Ni_Wet: "",
        X_Ni1A: "",
        Diff: "",
        X_Ni2: "",
        Diff2: "",
      });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  


  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        resetForm();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showModal]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/kapal');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Fetch Error:', data.error);
      } else {
        console.log('Fetched data:', data);
        setUsers(data || []);
        setFilteredUsers(data || []);
      }
    } catch (error) {
      console.error('Network Error:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? form : {
        No: form.No,
        Tahun: form.Tahun,
        Kode: form.Kode,
        Nama_Kapal: form.Nama_Kapal,
        Lokasi: form.Lokasi,
        SB: form.SB,
        Ni: form.Ni,
        Co: form.Co,
        Fe: form.Fe,
        SiO2: form.SiO2,
        CaO: form.CaO,
        MgO: form.MgO,
        Jam_Mulai: form.Jam_Mulai,
        Jam_Selesai: form.Jam_Selesai,
        Analis: form.Analis,
        Tgl_Analisa: form.Tgl_Analisa,
        Ni_C: form.Ni_C,
        MC: form.MC,
        Tanggal_Conversi: form.Tanggal_Conversi,
        W1_1: form.W1_1,
        W1_2: form.W1_2,
        W0_1: form.W0_1,
        W02: form.W02,
        Vp_1: form.Vp_1,
        Vp_2: form.Vp_2,
        Faktor1: form.Faktor1,
        Faktor2: form.Faktor2,
        X_Ni_C: form.X_Ni_C,
        Jam_Mulai2: form.Jam_Mulai2,
        Jam_Selesai3: form.Jam_Selesai3,
        Analis1: form.Analis1,
        Analis2: form.Analis2,
        W1: form.W1,
        W2: form.W2,
        Diff_Wet: form.Diff_Wet,
        Avg_Ni_Wet: form.Avg_Ni_Wet,
        X_Ni1A: form.X_Ni1A,
        Diff: form.Diff,
        X_Ni2: form.X_Ni2,
        Diff2: form.Diff2
      };

      const response = await fetch('/api/kapal', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Submit Error:', result.error);
      }
    } catch (error) {
      console.error('Network Error:', error);
    }

    setForm({ 
      id: 0,
      No: "",
      Tahun: "",
      Kode: "",
      Nama_Kapal: "",
      Lokasi: "",
      SB: "",
      Ni: "",
      Co: "",
      Fe: "",
      SiO2: "",
      CaO: "",
      MgO: "",
      Jam_Mulai: "",
      Jam_Selesai: "",
      Analis: "",
      Tgl_Analisa: "",
      Ni_C: "",
      MC: "",
      Tanggal_Conversi: "",
      W1_1: "",
      W1_2: "",
      W0_1: "",
      W02: "",
      Vp_1: "",
      Vp_2: "",
      Faktor1: "",
      Faktor2: "",
      X_Ni_C: "",
      Jam_Mulai2: "",
      Jam_Selesai3: "",
      Analis1: "",
      Analis2: "",
      W1: "",
      W2: "",
      Diff_Wet: "",
      Avg_Ni_Wet: "",
      X_Ni1A: "",
      Diff: "",
      X_Ni2: "",
      Diff2: "",
    });
    setEditing(false);
    setShowModal(false);
    fetchUsers();
    setLoading(false);
  };

  const handleEdit = (user: User) => {
    setForm(user);
    setEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/kapal?id=${id}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        if (!response.ok) {
          console.error('Delete Error:', result.error);
        } else {
          fetchUsers();
        }
      } catch (error) {
        console.error('Network Error:', error);
      }
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      id: 0,
      No: "",
      Tahun: "",
      Kode: "",
      Nama_Kapal: "",
      Lokasi: "",
      SB: "",
      Ni: "",
      Co: "",
      Fe: "",
      SiO2: "",
      CaO: "",
      MgO: "",
      Jam_Mulai: "",
      Jam_Selesai: "",
      Analis: "",
      Tgl_Analisa: "",
      Ni_C: "",
      MC: "",
      Tanggal_Conversi: "",
      W1_1: "",
      W1_2: "",
      W0_1: "",
      W02: "",
      Vp_1: "",
      Vp_2: "",
      Faktor1: "",
      Faktor2: "",
      X_Ni_C: "",
      Jam_Mulai2: "",
      Jam_Selesai3: "",
      Analis1: "",
      Analis2: "",
      W1: "",
      W2: "",
      Diff_Wet: "",
      Avg_Ni_Wet: "",
      X_Ni1A: "",
      Diff: "",
      X_Ni2: "",
      Diff2: "",
    });
    setEditing(false);
    setShowModal(false);
  };

  const handleTabChange = (tab: string) => {
    // Handle tab change logic here if needed
    console.log('Tab changed to:', tab);
  };

  const exportToExcel = () => {
    const headers = [
      'No',
      'Tahun',
      'Kode',
      'Nama Kapal',
      'Lokasi',
      'SB',
      'Ni',
      'Co',
      'Fe',
      'SiO2',
      'CaO',
      'MgO',
      'Jam Mulai',
      'Jam Selesai',
      'Analis',
      'Tamggal Analisa',
      'Ni C',
      'MC(%)',
      'Tanggal Conversi',
      'W1 1',
      'W1 2',
      'W0 1',
      'W02',
      'Vp 1',
      'Vp 2',
      'Faktor1',
      'Faktor2',
      'X Ni C',
      'Jam Mulai2',
      'Jam Selesai3',
      'Analis1',
      'Analis2',
      'W1',
      'W2',
      'Diff Wet',
      'Avg Ni Wet',
      'X Ni1(A)',
      'Diff',
      'X Ni2',
      'Diff2'
    ];
    const data = filteredUsers.map(user => [
      user.No,
      user.Tahun,
      user.Kode,
      user.Nama_Kapal,
      user.Lokasi,
      user.SB,
      user.Ni,
      user.Co,
      user.Fe,
      user.SiO2,
      user.CaO,
      user.MgO,
      user.Jam_Mulai,
      user.Jam_Selesai,
      user.Analis,
      user.Tgl_Analisa,
      user.Ni_C,
      user.MC,
      user.Tanggal_Conversi,
      user.W1_1,
      user.W1_2,
      user.W0_1,
      user.W02,
      user.Vp_1,
      user.Vp_2,
      user.Faktor1,
      user.Faktor2,
      user.X_Ni_C,
      user.Jam_Mulai2,
      user.Jam_Selesai3,
      user.Analis1,
      user.Analis2,
      user.W1,
      user.W2,
      user.Diff_Wet,
      user.Avg_Ni_Wet,
      user.X_Ni1A,
      user.Diff,
      user.X_Ni2,
      user.Diff2

    ]);
    
    // Create HTML table for Excel
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
    a.download = 'AnalisaKapal.xls';
    a.click();
    window.URL.revokeObjectURL(url);
  };



  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f1f2f7" }}>
      <div className="flex">
        {/* Sidebar Component */}
        <Sidebar onTabChange={handleTabChange} />
        <div className="crud-container">
            <div className="crud-header">
                    <h2>Kapal/Tkg</h2>
                    {canAddData && (
                      <button className="btn-primary" onClick={() => setShowModal(true)} style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <Plus size={16} />
                        Add Data
                      </button>
                    )}
                </div>
                <div style={{marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <div style={{position: 'relative', display: 'inline-block'}}>
                    <Search 
                      size={16} 
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#666',
                        pointerEvents: 'none'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setSearchTerm(e.target.value);
                        const filtered = users.filter(user => 
                          user.No?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.Nama_Kapal?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.Kode?.toLowerCase().includes(e.target.value.toLowerCase())
                        );
                        setFilteredUsers(filtered);
                      }}
                      style={{
                        width: '300px',
                        padding: '8px 12px 8px 36px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: '#ffffff'
                      }}
                    />
                    </div>
                    <div style={{position: 'relative'}}>
                      <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s ease',
                          transform: showSortMenu ? 'scale(1.05)' : 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.transform = showSortMenu ? 'scale(1.05)' : 'scale(1)';
                        }}
                      >
                        <Filter size={16} style={{transition: 'transform 0.2s ease', transform: showSortMenu ? 'rotate(180deg)' : 'rotate(0deg)'}} />
                      </button>
                      {showSortMenu && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          backgroundColor: '#ffffff',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          zIndex: 1000,
                          minWidth: '150px'
                        }}>
                          <div
                            onClick={() => {
                              setSortBy('No');
                              let sorted = [...filteredUsers];
                              sorted.sort((a, b) => a.No.localeCompare(b.No));
                              setFilteredUsers(sorted);
                              setShowSortMenu(false);
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f0f0';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            No
                          </div>
                          <div
                            onClick={() => {
                              setSortBy('Kode');
                              let sorted = [...filteredUsers];
                              sorted.sort((a, b) => a.Kode.localeCompare(b.Kode));
                              setFilteredUsers(sorted);
                              setShowSortMenu(false);
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f0f0';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            Kode
                          </div>
                          <div
                            onClick={() => {
                              setSortBy('Nama_Kapal');
                              let sorted = [...filteredUsers];
                              sorted.sort((a, b) => a.Nama_Kapal.localeCompare(b.Nama_Kapal));
                              setFilteredUsers(sorted);
                              setShowSortMenu(false);
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f0f0';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            Nama Kapal
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
                    Excel
                  </button>
                </div>
                <div className="table-container">
                    <table className="stylish-table" style={{border: '1px solid #ddd', borderCollapse: 'collapse'}}>
                      <thead>
                          <tr>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>No</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Kode</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Nama Kapal</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>SB</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Ni</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px', whiteSpace: 'nowrap'}}>Ni Wet</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Diff</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Co</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Fe</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>SiO2</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>CaO</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>MgO</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>MC(%)</th>
                            {showActions && <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Actions</th>}

                          </tr>
                      </thead>
                      <tbody>
                          {loading ? (
                          <tr>
                              <td colSpan={showActions ? 14 : 13} className="loading">Loading...</td>
                          </tr>
                          ) : filteredUsers.length === 0 ? (
                          <tr>
                              <td colSpan={showActions ? 14 : 13} className="no-data">No data found</td>
                          </tr>
                          ) : (
                          filteredUsers.map((user) => (
                              <tr key={user.id}>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.No}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Kode}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Nama_Kapal}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.SB}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Ni}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Ni_C}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Diff}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Co}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Fe}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.SiO2}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.CaO}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.MgO}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.MC}</td>
                                {showActions && <td style={{border: '1px solid #ddd', padding: '8px'}}>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                      <button 
                                        onClick={() => handleEdit(user)}
                                        style={{
                                          background: '#007bff',
                                          color: 'white',
                                          border: 'none',
                                          padding: '6px 12px',
                                          borderRadius: '4px',
                                          fontSize: '12px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Edit size={14} />
                                        Edit
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(user.id)}
                                        style={{
                                          background: '#dc3545',
                                          color: 'white',
                                          border: 'none',
                                          padding: '6px 12px',
                                          borderRadius: '4px',
                                          fontSize: '12px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Trash2 size={14} />
                                        Delete
                                      </button>
                                    </div>
                                </td>}
                              </tr>
                          ))
                          )}
                      </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal" style={{maxHeight: '90vh', overflowY: 'auto', width: '90vw', maxWidth: '1200px'}}>
                            <div className="modal-header">
                            <h3>{editing ? 'Edit Data' : 'Menambah Data'}</h3>
                            <button className="close-btn" onClick={resetForm}>×</button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-form">
                              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px'}}>
                                <div className="form-group">
                                    <label>Tahun</label>
                                    <input
                                    type="number"
                                    value={form.Tahun}
                                    onChange={(e) => setForm({ ...form, Tahun: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Kode</label>
                                    <input
                                    type="text"
                                    value={form.Kode}
                                    onChange={(e) => setForm({ ...form, Kode: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nama Kapal</label>
                                    <input
                                    type="text"
                                    value={form.Nama_Kapal}
                                    onChange={(e) => setForm({ ...form, Nama_Kapal: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Lokasi</label>
                                    <input
                                    type="text"
                                    value={form.Lokasi}
                                    onChange={(e) => setForm({ ...form, Lokasi: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SB</label>
                                    <input
                                    type="number"
                                    value={form.SB}
                                    onChange={(e) => setForm({ ...form, SB: e.target.value })}
                                    required
                                    />
                                </div>
                                <DecimalInput 
                                  label="Ni" 
                                  field="Ni" 
                                  value={form.Ni} 
                                  onChange={(value) => setForm({ ...form, Ni: value })} 
                                />
                                <DecimalInput 
                                  label="Co" 
                                  field="Co" 
                                  value={form.Co} 
                                  onChange={(value) => setForm({ ...form, Co: value })} 
                                />
                                <DecimalInput 
                                  label="Fe" 
                                  field="Fe" 
                                  value={form.Fe} 
                                  onChange={(value) => setForm({ ...form, Fe: value })} 
                                />
                                <DecimalInput 
                                  label="SiO2" 
                                  field="SiO2" 
                                  value={form.SiO2} 
                                  onChange={(value) => setForm({ ...form, SiO2: value })} 
                                />
                                <DecimalInput 
                                  label="CaO" 
                                  field="CaO" 
                                  value={form.CaO} 
                                  onChange={(value) => setForm({ ...form, CaO: value })} 
                                />
                                <DecimalInput 
                                  label="MgO" 
                                  field="MgO" 
                                  value={form.MgO} 
                                  onChange={(value) => setForm({ ...form, MgO: value })} 
                                />
                                <div className="form-group">
                                    <label>Jam Mulai</label>
                                    <input
                                    type="time"
                                    value={form.Jam_Mulai}
                                    onChange={(e) => setForm({ ...form, Jam_Mulai: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Jam Selesai</label>
                                    <input
                                    type="time"
                                    value={form.Jam_Selesai}
                                    onChange={(e) => setForm({ ...form, Jam_Selesai: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Analis</label>
                                    <input
                                    type="text"
                                    value={form.Analis}
                                    onChange={(e) => setForm({ ...form, Analis: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal Analisa</label>
                                    <input
                                    type="date"
                                    value={form.Tgl_Analisa}
                                    onChange={(e) => setForm({ ...form, Tgl_Analisa: e.target.value })}
                                    required
                                    />
                                </div>
                                <DecimalInput 
                                  label="Ni C" 
                                  field="Ni_C" 
                                  value={form.Ni_C} 
                                  onChange={(value) => setForm({ ...form, Ni_C: value })} 
                                />
                                <div className="form-group">
                                    <label>W1 1</label>
                                    <input
                                    type="number"
                                    value={form.W1_1}
                                    onChange={(e) => setForm({ ...form, W1_1: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>W1 2</label>
                                    <input
                                    type="number"
                                    value={form.W1_2}
                                    onChange={(e) => setForm({ ...form, W1_2: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>W0 1</label>
                                    <input
                                    type="number"
                                    value={form.W0_1}
                                    onChange={(e) => setForm({ ...form, W0_1: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>W0 2</label>
                                    <input
                                    type="number"
                                    value={form.W02}
                                    onChange={(e) => setForm({ ...form, W02: e.target.value })}
                                    required
                                    />
                                </div>
                                <DecimalInput 
                                  label="Vp 1" 
                                  field="Vp_1" 
                                  value={form.Vp_1} 
                                  onChange={(value) => setForm({ ...form, Vp_1: value })} 
                                />
                                <DecimalInput 
                                  label="Vp 2" 
                                  field="Vp_2" 
                                  value={form.Vp_2} 
                                  onChange={(value) => setForm({ ...form, Vp_2: value })} 
                                />
                                <div className="form-group">
                                    <label>Faktor 1</label>
                                    <input
                                    type="number"
                                    value={form.Faktor1}
                                    onChange={(e) => setForm({ ...form, Faktor1: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Faktor 2</label>
                                    <input
                                    type="number"
                                    value={form.Faktor2}
                                    onChange={(e) => setForm({ ...form, Faktor2: e.target.value })}
                                    required
                                    />
                                </div>
                                <DecimalInput 
                                  label="X Ni C" 
                                  field="X_Ni_C" 
                                  value={form.X_Ni_C} 
                                  onChange={(value) => setForm({ ...form, X_Ni_C: value })} 
                                />
                                <div className="form-group">
                                    <label>Jam Mulai2</label>
                                    <input
                                    type="time"
                                    value={form.Jam_Mulai2}
                                    onChange={(e) => setForm({ ...form, Jam_Mulai2: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Jam Selesai3</label>
                                    <input
                                    type="time"
                                    value={form.Jam_Selesai3}
                                    onChange={(e) => setForm({ ...form, Jam_Selesai3: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Analis 1</label>
                                    <input
                                    type="text"
                                    value={form.Analis1}
                                    onChange={(e) => setForm({ ...form, Analis1: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Analis 2</label>
                                    <input
                                    type="text"
                                    value={form.Analis2}
                                    onChange={(e) => setForm({ ...form, Analis2: e.target.value })}
                                    required
                                    />
                                </div>
                                <DecimalInput 
                                  label="X Ni1(A)" 
                                  field="X_Ni1A" 
                                  value={form.X_Ni1A} 
                                  onChange={(value) => setForm({ ...form, X_Ni1A: value })} 
                                />
                                <DecimalInput 
                                  label="MC(%)" 
                                  field="MC" 
                                  value={form.MC} 
                                  onChange={(value) => setForm({ ...form, MC: value })} 
                                />
                                <DecimalInput 
                                  label="Diff Wet" 
                                  field="Diff_Wet" 
                                  value={form.Diff_Wet} 
                                  onChange={(value) => setForm({ ...form, Diff_Wet: value })} 
                                />
                                <DecimalInput 
                                  label="Avg Ni Wet" 
                                  field="Avg_Ni_Wet" 
                                  value={form.Avg_Ni_Wet} 
                                  onChange={(value) => setForm({ ...form, Avg_Ni_Wet: value })} 
                                />
                                <DecimalInput 
                                  label="Diff" 
                                  field="Diff" 
                                  value={form.Diff} 
                                  onChange={(value) => setForm({ ...form, Diff: value })} 
                                />
                                <DecimalInput 
                                  label="X Ni2" 
                                  field="X_Ni2" 
                                  value={form.X_Ni2} 
                                  onChange={(value) => setForm({ ...form, X_Ni2: value })} 
                                />
                                <DecimalInput 
                                  label="Diff2" 
                                  field="Diff2" 
                                  value={form.Diff2} 
                                  onChange={(value) => setForm({ ...form, Diff2: value })} 
                                />
                              </div>                            
                              <div className="form-actions">
                                  <button type="button" className="btn-secondary" onClick={resetForm}>
                                  Cancel
                                  </button>
                                  <button type="submit" className="btn-primary" disabled={loading}>
                                  {loading ? 'Saving...' : editing ? 'Update' : 'Save'}
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