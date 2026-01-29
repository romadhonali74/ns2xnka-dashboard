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

interface User {
  id: number;
  kode_tumpukan: string;
  tanggal: string;
  kode_dome: string;
  asal_lokasi: string;
  lokasi_dumping: string;
  tonnage_wmt: string;
  ni: string;
  co: string;
  fe: string;
  sio2: string;
  cao: string;
  mgo: string;
  mc: string;
  fe_ni: string;
  sio2_mgo: string;
  status: string;
}

export default function ProductDetailsTable() {
  const router = useRouter();
  const { canAddData, showActions } = useQCPermission();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const [form, setForm] = useState<{
    id: number;
    kode_tumpukan: string;
    tanggal: string;
    kode_dome: string;
    asal_lokasi: string;
    lokasi_dumping: string;
    tonnage_wmt: string;
    ni: string;
    co: string;
    fe: string;
    sio2: string;
    cao: string;
    mgo: string;
    mc: string;
    fe_ni: string;
    sio2_mgo: string;
    status: string;
  }>({
    id: 0,
    kode_tumpukan: "",
    tanggal: "",
    kode_dome: "",
    asal_lokasi: "",
    lokasi_dumping: "",
    tonnage_wmt: "",
    ni: "",
    co: "",
    fe: "",
    sio2: "",
    cao: "",
    mgo: "",
    mc: "",
    fe_ni: "",
    sio2_mgo: "",
    status: "",
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
      const response = await fetch('/api/product_details');
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
        kode_tumpukan: form.kode_tumpukan,
        tanggal: form.tanggal,
        kode_dome: form.kode_dome,
        asal_lokasi: form.asal_lokasi,
        lokasi_dumping: form.lokasi_dumping,
        tonnage_wmt: form.tonnage_wmt,
        ni: form.ni,
        co: form.co,
        fe: form.fe,
        sio2: form.sio2,
        cao: form.cao,
        mgo: form.mgo,
        mc: form.mc,
        fe_ni: form.fe_ni,
        sio2_mgo: form.sio2_mgo,
        status: form.status
      };

      const response = await fetch('/api/product_details', {
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
      kode_tumpukan: "",
      tanggal: "",
      kode_dome: "",
      asal_lokasi: "",
      lokasi_dumping: "",
      tonnage_wmt: "",
      ni: "",
      co: "",
      fe: "",
      sio2: "",
      cao: "",
      mgo: "",
      mc: "",
      fe_ni: "",
      sio2_mgo: "",
      status: "",
    });
    setEditing(false);
    setShowModal(false);
    fetchUsers();
    setLoading(false);
  };

  const handleEdit = (user: User) => {
    try {
      const safeUser = {
        id: user.id || 0,
        kode_tumpukan: user.kode_tumpukan || "",
        tanggal: user.tanggal || "",
        kode_dome: user.kode_dome || "",
        asal_lokasi: user.asal_lokasi || "",
        lokasi_dumping: user.lokasi_dumping || "",
        tonnage_wmt: user.tonnage_wmt || "",
        ni: user.ni || "",
        co: user.co || "",
        fe: user.fe || "",
        sio2: user.sio2 || "",
        cao: user.cao || "",
        mgo: user.mgo || "",
        mc: user.mc || "",
        fe_ni: user.fe_ni || "",
        sio2_mgo: user.sio2_mgo || "",
        status: user.status || ""
      };
      setForm(safeUser);
      setEditing(true);
      setShowModal(true);
    } catch (error) {
      console.error('Edit error:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/product_details?id=${id}`, {
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
      kode_tumpukan: "",
      tanggal: "",
      kode_dome: "",
      asal_lokasi: "",
      lokasi_dumping: "",
      tonnage_wmt: "",
      ni: "",
      co: "",
      fe: "",
      sio2: "",
      cao: "",
      mgo: "",
      mc: "",
      fe_ni: "",
      sio2_mgo: "",
      status: "",
    });
    setEditing(false);
    setShowModal(false);
  };

  const applyFilters = (search: string, startDate: string, endDate: string) => {
    if (!search && !startDate && !endDate) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => {
      let matchesSearch = true;
      if (search) {
        matchesSearch = false;
        try {
          if (user.kode_tumpukan && user.kode_tumpukan.toString().indexOf(search) >= 0) matchesSearch = true;
          if (user.kode_dome && user.kode_dome.toString().indexOf(search) >= 0) matchesSearch = true;
          if (user.asal_lokasi && user.asal_lokasi.toString().indexOf(search) >= 0) matchesSearch = true;
        } catch (e) {
          // ignore error
        }
      }
      
      let matchesDate = true;
      if (startDate || endDate) {
        matchesDate = false;
        if (user.tanggal) {
          if (!startDate || user.tanggal >= startDate) {
            if (!endDate || user.tanggal <= endDate) {
              matchesDate = true;
            }
          }
        }
      }
      
      return matchesSearch && matchesDate;
    });
    
    setFilteredUsers(filtered);
  };

  const exportToExcel = () => {
    const headers = [
      'Kode Tumpukan',
      'Tanggal', 
      'Kode Dome',
      'Asal Lokasi',
      'Lokasi Dumping',
      'Tonnage WMT',
      'Ni(%)',
      'Co(%)',
      'Fe(%)',
      'SiO2(%)',
      'CaO(%)',
      'MgO(%)',
      'MC(%)',
      'Fe/Ni',
      'SiO2/MgO',
      'Status'
    ];
    const data = filteredUsers.map(user => [
      user.kode_tumpukan,
      user.tanggal,
      user.kode_dome,
      user.asal_lokasi,
      user.lokasi_dumping,
      user.tonnage_wmt,
      user.ni,
      user.co,
      user.fe,
      user.sio2,
      user.cao,
      user.mgo,
      user.mc,
      user.fe_ni,
      user.sio2_mgo,
      user.status
    ]);
    
    const filterInfo = [];
    if (dateFilter || endDateFilter) {
      const startDate = dateFilter ? new Date(dateFilter).toLocaleDateString('id-ID') : 'Awal';
      const endDate = endDateFilter ? new Date(endDateFilter).toLocaleDateString('id-ID') : 'Akhir';
      filterInfo.push(`Filter Tanggal: ${startDate} - ${endDate}`);
    }
    if (searchTerm) {
      filterInfo.push(`Pencarian: ${searchTerm}`);
    }
    
    let htmlContent = `
      <table border="1" style="border-collapse: collapse; width: 100%;">
        ${filterInfo.length > 0 ? `
          <tr>
            <td colspan="${headers.length}" style="padding: 8px; text-align: center; background-color: #e9ecef; font-weight: bold;">
              ${filterInfo.join(' | ')}
            </td>
          </tr>
        ` : ''}
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
    const fileName = `ProductDetails${dateFilter || endDateFilter ? `_${dateFilter || 'start'}-${endDateFilter || 'end'}` : ''}.xls`;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f1f2f7" }}>
      <div className="flex">
        <Sidebar />
        <div className="crud-container">
            <div className="crud-header">
                    <h2>Product Details</h2>
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
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        applyFilters(e.target.value, dateFilter, endDateFilter);
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
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => {
                          setDateFilter(e.target.value);
                          applyFilters(searchTerm, e.target.value, endDateFilter);
                        }}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: '#ffffff',
                          colorScheme: 'light',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{fontSize: '14px', color: '#666'}}>to</span>
                      <input
                        type="date"
                        value={endDateFilter}
                        onChange={(e) => {
                          setEndDateFilter(e.target.value);
                          applyFilters(searchTerm, dateFilter, e.target.value);
                        }}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: '#ffffff',
                          colorScheme: 'light',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer'
                        }}
                      />
                      <button
                        onClick={() => {
                          setDateFilter('');
                          setEndDateFilter('');
                          applyFilters(searchTerm, '', '');
                        }}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#f8f9fa',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button
                      onClick={() => router.push('/quality_control/product_sum')}
                      style={{
                        background: '#6f42c1',
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
                      <FileText size={14} />
                      Summary
                    </button>
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
                  </div>
                </div>
                <div className="table-container">
                    <table className="stylish-table" style={{border: '1px solid #ddd', borderCollapse: 'collapse'}}>
                      <thead>
                          <tr>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Kode Tumpukan</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Tanggal</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Kode Dome</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Asal Lokasi</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Lokasi Dumping</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Tonnage WMT</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Ni(%)</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Co(%)</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Fe(%)</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>SiO2(%)</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>CaO(%)</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>MgO(%)</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>MC(%)</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Fe/Ni</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>SiO2/MgO</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Status</th>
                            {showActions && <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Actions</th>}
                          </tr>
                      </thead>
                      <tbody>
                          {loading ? (
                          <tr>
                              <td colSpan={showActions ? 17 : 16} className="loading">Loading...</td>
                          </tr>
                          ) : filteredUsers.length === 0 ? (
                          <tr>
                              <td colSpan={showActions ? 17 : 16} className="no-data">No data found</td>
                          </tr>
                          ) : (
                          filteredUsers.map((user) => (
                              <tr key={user.id}>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.kode_tumpukan}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.tanggal ? new Date(user.tanggal).toLocaleDateString('id-ID') : ''}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.kode_dome}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.asal_lokasi}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.lokasi_dumping}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.tonnage_wmt}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.ni}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.co}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.fe}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.sio2}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.cao}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.mgo}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.mc}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.fe_ni}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.sio2_mgo}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.status}</td>
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
                        <div className="modal" style={{maxHeight: '90vh', overflowY: 'auto', width: '90vw', maxWidth: '800px'}}>
                            <div className="modal-header">
                            <h3>{editing ? 'Edit Data' : 'Add Data'}</h3>
                            <button className="close-btn" onClick={resetForm}>×</button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-form">
                              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px'}}>
                                <div className="form-group">
                                    <label>Kode Tumpukan</label>
                                    <input
                                    type="text"
                                    value={form.kode_tumpukan}
                                    onChange={(e) => setForm({ ...form, kode_tumpukan: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal</label>
                                    <input
                                    type="date"
                                    value={form.tanggal}
                                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Kode Dome</label>
                                    <input
                                    type="text"
                                    value={form.kode_dome}
                                    onChange={(e) => setForm({ ...form, kode_dome: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Asal Lokasi</label>
                                    <input
                                    type="text"
                                    value={form.asal_lokasi}
                                    onChange={(e) => setForm({ ...form, asal_lokasi: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Lokasi Dumping</label>
                                    <input
                                    type="text"
                                    value={form.lokasi_dumping}
                                    onChange={(e) => setForm({ ...form, lokasi_dumping: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tonnage WMT</label>
                                    <input
                                    type="text"
                                    value={form.tonnage_wmt}
                                    onChange={(e) => setForm({ ...form, tonnage_wmt: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ni</label>
                                    <input
                                    type="text"
                                    value={form.ni}
                                    onChange={(e) => setForm({ ...form, ni: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Co</label>
                                    <input
                                    type="text"
                                    value={form.co}
                                    onChange={(e) => setForm({ ...form, co: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fe</label>
                                    <input
                                    type="text"
                                    value={form.fe}
                                    onChange={(e) => setForm({ ...form, fe: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SiO2</label>
                                    <input
                                    type="text"
                                    value={form.sio2}
                                    onChange={(e) => setForm({ ...form, sio2: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>CaO</label>
                                    <input
                                    type="text"
                                    value={form.cao}
                                    onChange={(e) => setForm({ ...form, cao: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>MgO</label>
                                    <input
                                    type="text"
                                    value={form.mgo}
                                    onChange={(e) => setForm({ ...form, mgo: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>MC</label>
                                    <input
                                    type="text"
                                    value={form.mc}
                                    onChange={(e) => setForm({ ...form, mc: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fe/Ni</label>
                                    <input
                                    type="text"
                                    value={form.fe_ni}
                                    onChange={(e) => setForm({ ...form, fe_ni: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SiO2/MgO</label>
                                    <input
                                    type="text"
                                    value={form.sio2_mgo}
                                    onChange={(e) => setForm({ ...form, sio2_mgo: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    required
                                    style={{
                                      padding: '10px 12px',
                                      border: '2px solid #e1e5e9',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      backgroundColor: '#ffffff',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                      outline: 'none',
                                      appearance: 'none',
                                      backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
                                      backgroundPosition: 'right 12px center',
                                      backgroundRepeat: 'no-repeat',
                                      backgroundSize: '16px',
                                      paddingRight: '40px'
                                    }}
                                    onFocus={(e) => {
                                      (e.target as HTMLSelectElement).style.borderColor = '#3b82f6';
                                      (e.target as HTMLSelectElement).style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                      (e.target as HTMLSelectElement).style.borderColor = '#e1e5e9';
                                      (e.target as HTMLSelectElement).style.boxShadow = 'none';
                                    }}
                                    onMouseEnter={(e) => {
                                      (e.target as HTMLSelectElement).style.borderColor = '#9ca3af';
                                      (e.target as HTMLSelectElement).style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      if (e.target !== document.activeElement) {
                                        (e.target as HTMLSelectElement).style.borderColor = '#e1e5e9';
                                      }
                                      (e.target as HTMLSelectElement).style.transform = 'translateY(0)';
                                    }}
                                    >
                                      <option value="">Select Status</option>
                                      <option value="Complete">Complete</option>
                                      <option value="Waiting Assay">Waiting Assay</option>
                                      <option value="Waiting MC">Waiting MC</option>
                                    </select>
                                </div>
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