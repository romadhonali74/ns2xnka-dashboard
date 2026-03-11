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
import { useCrudPermissions } from "../../hooks/useUserRole";


interface User {
  id: number;
  Id_Lab: string;
  Ni: string;
  Co: string;
  Fe: string;
  SiO2: string;
  CaO: string;
  MgO: string;
  Analis: string;
  Kode_Sampel: string;
  Tanggal_analisa: string;
  Jam_Mulai: string;
  Jam_Selesai: string;
  Tgl_Convert: string;
}

export default function StylishCRUDTable() {
  const { canCreate, canEdit, canDelete } = useCrudPermissions('quality_control');
  const showActions = canEdit || canDelete;
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [dateFilter, setDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Format time function
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
  };

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const [form, setForm] = useState<{ id: number; Id_Lab: string; Ni: string; Co: string; Fe: string; SiO2: string; CaO: string; MgO: string; Analis: string; Kode_Sampel: string; Tanggal_analisa: string; Jam_Mulai: string; Jam_Selesai: string; Tgl_Convert: string }>({ id: 0, Id_Lab: "", Ni: "", Co: "", Fe: "", SiO2: "", CaO: "", MgO: "", Analis: "", Kode_Sampel: "", Tanggal_analisa: "", Jam_Mulai: "", Jam_Selesai: "", Tgl_Convert: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSpinner, setShowSpinner] = useState<{[key: string]: boolean}>({});

  // Format decimal functions
  const formatDecimal = (value: any) => {
    try {
      if (!value && value !== 0) return '';
      const str = String(value);
      return str.replace('.', ',');
    } catch (error) {
      return '';
    }
  };

  const parseDecimal = (value: any) => {
    try {
      if (!value && value !== 0) return '';
      const str = String(value);
      return str.replace(',', '.');
    } catch (error) {
      return '';
    }
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
            const regex = /^[0-9]*[,]?[0-9]*$/;
            if (regex.test(val)) {
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
      const response = await fetch('/api/gcs');
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
        Id_Lab: form.Id_Lab,
        Ni: form.Ni,
        Co: form.Co,
        Fe: form.Fe,
        SiO2: form.SiO2,
        CaO: form.CaO,
        MgO: form.MgO,
        Analis: form.Analis,
        Kode_Sampel: form.Kode_Sampel,
        Tanggal_analisa: form.Tanggal_analisa,
        Jam_Mulai: form.Jam_Mulai,
        Jam_Selesai: form.Jam_Selesai,
        Tgl_Convert: form.Tgl_Convert
      };

      const response = await fetch('/api/gcs', {
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

    setForm({ id: 0, Id_Lab: "", Ni: "", Co: "", Fe: "", SiO2: "", CaO: "", MgO: "", Analis: "", Kode_Sampel: "", Tanggal_analisa: "", Jam_Mulai: "", Jam_Selesai: "", Tgl_Convert: ""});
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
        const response = await fetch(`/api/gcs?id=${id}`, {
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
    setForm({ id: 0, Id_Lab: "", Ni: "", Co: "", Fe: "", SiO2: "", CaO: "", MgO: "", Analis: "", Kode_Sampel: "", Tanggal_analisa: "", Jam_Mulai: "", Jam_Selesai: "", Tgl_Convert: ""});
    setEditing(false);
    setShowModal(false);
  };

  const handleTabChange = (tab: string) => {
    // Handle tab change logic here if needed
    console.log('Tab changed to:', tab);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const exportToExcel = () => {
    const headers = ['Id Lab', 'Ni', 'Co', 'Fe', 'SiO2', 'CaO', 'MgO', 'Analis', 'Kode Sampel', 'Tanggal Analisa', 'Jam Mulai', 'Jam Selesai', 'Tgl Convert'];
    const data = filteredUsers.map(user => [
      user.Id_Lab,
      user.Ni,
      user.Co,
      user.Fe,
      user.SiO2,
      user.CaO,
      user.MgO,
      user.Analis,
      user.Kode_Sampel,
      user.Tanggal_analisa,
      user.Jam_Mulai,
      user.Jam_Selesai,
      user.Tgl_Convert
    ]);
    
    // Create filter info
    const filterInfo = [];
    if (dateFilter || endDateFilter) {
      const startDate = dateFilter ? new Date(dateFilter).toLocaleDateString('id-ID') : 'Awal';
      const endDate = endDateFilter ? new Date(endDateFilter).toLocaleDateString('id-ID') : 'Akhir';
      filterInfo.push(`Filter Tanggal: ${startDate} - ${endDate}`);
    }
    if (searchTerm) {
      filterInfo.push(`Pencarian: ${searchTerm}`);
    }
    
    // Create HTML table for Excel
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
    const fileName = `GCS${dateFilter || endDateFilter ? `_${dateFilter || 'start'}-${endDateFilter || 'end'}` : ''}.xls`;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const applyFilters = (search: string, startDate: string, endDate: string) => {
    let filtered = users.filter(user => {
      const matchesSearch = !search || (
        String(user.Id_Lab || '').toLowerCase().includes(search.toLowerCase()) ||
        String(user.Analis || '').toLowerCase().includes(search.toLowerCase()) ||
        String(user.Kode_Sampel || '').toLowerCase().includes(search.toLowerCase()) ||
        String(user.Tanggal_analisa || '').toLowerCase().includes(search.toLowerCase()) ||
        String(user.Jam_Mulai || '').toLowerCase().includes(search.toLowerCase()) ||
        String(user.Jam_Selesai || '').toLowerCase().includes(search.toLowerCase()) ||
        String(user.Tgl_Convert || '').toLowerCase().includes(search.toLowerCase())
      );
      
      const matchesDate = (!startDate && !endDate) || (
        user.Tanggal_analisa && (
          (!startDate || user.Tanggal_analisa >= startDate) &&
          (!endDate || user.Tanggal_analisa <= endDate)
        )
      );
      
      return matchesSearch && matchesDate;
    });
    
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };



  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f1f2f7" }}>
      <Sidebar onTabChange={handleTabChange} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="crud-container">
            <div className="crud-header">
                    <h2>Geological Control System</h2>
                    {canCreate && (
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
                <div className="table-container" style={{overflowX: 'auto', width: '100%'}}>
                    <table className="stylish-table" style={{border: '1px solid #ddd', borderCollapse: 'collapse'}}>
                      <thead>
                          <tr>
                            {/* <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Id Lab</th> */}
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Kode Sampel</th>     
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Ni</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Co</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Fe</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>SiO2</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>CaO</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>MgO</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Analis</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Jam Mulai</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Jam Selesai</th>                       
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Tanggal Analisa</th>
                            {/* <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Tgl Convert</th> */}
                            {showActions && <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Actions</th>}
                          </tr>
                      </thead>
                      <tbody>
                          {loading ? (
                          <tr>
                              <td colSpan={showActions ? 12 : 11} className="loading">Loading...</td>
                          </tr>
                          ) : filteredUsers.length === 0 ? (
                          <tr>
                              <td colSpan={showActions ? 12 : 11} className="no-data">No data found</td>
                          </tr>
                          ) : (
                          currentUsers.map((user) => (
                              <tr key={user.id}>
                                {/* <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Id_Lab}</td> */}
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Kode_Sampel}</td>                 
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Ni}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Co}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Fe}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.SiO2}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.CaO}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.MgO}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Analis}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{formatTime(user.Jam_Mulai)}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{formatTime(user.Jam_Selesai)}</td>               
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{formatDate(user.Tanggal_analisa)}</td>
                                {/* <td style={{border: '1px solid #ddd', padding: '8px'}}>{formatDate(user.Tgl_Convert)}</td> */}
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
                
                {/* Pagination Controls */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '10px'}}>
                  <div style={{fontSize: '14px', color: '#666'}}>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} entries
                  </div>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Previous
                    </button>
                    <span style={{fontSize: '14px', color: '#666'}}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#ffffff',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Next
                    </button>
                  </div>
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
                                    <label>Id Lab</label>
                                    <input
                                    type="text"
                                    value={form.Id_Lab}
                                    onChange={(e) => setForm({ ...form, Id_Lab: e.target.value })}
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
                                {/* <div className="form-group">
                                    <label>Ni</label>
                                    <input
                                    type="text"
                                    value={form.Ni}
                                    onChange={(e) => setForm({ ...form, Ni: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Co</label>
                                    <input
                                    type="text"
                                    value={form.Co}
                                    onChange={(e) => setForm({ ...form, Co: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fe</label>
                                    <input
                                    type="text"
                                    value={form.Fe}
                                    onChange={(e) => setForm({ ...form, Fe: parseFloat(e.target.value) || 0 })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SiO2</label>
                                    <input
                                    type="text"
                                    value={form.SiO2}
                                    onChange={(e) => setForm({ ...form, SiO2: parseFloat(e.target.value) || 0 })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>CaO</label>
                                    <input
                                    type="text"
                                    value={form.CaO}
                                    onChange={(e) => setForm({ ...form, CaO: parseFloat(e.target.value) || 0 })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>MgO</label>
                                    <input
                                    type="text"
                                    value={form.MgO}
                                    onChange={(e) => setForm({ ...form, MgO: parseFloat(e.target.value) || 0 })}
                                    required
                                    />
                                </div> */}
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
                                    <label>Kode Sampel</label>
                                    <input
                                    type="text"
                                    value={form.Kode_Sampel}
                                    onChange={(e) => setForm({ ...form, Kode_Sampel: e.target.value })}
                                    required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal Analisa</label>
                                    <input
                                    type="date"
                                    value={form.Tanggal_analisa}
                                    onChange={(e) => setForm({ ...form, Tanggal_analisa: e.target.value })}
                                    required
                                    />
                                </div>
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
                                    <label>Tanggal Convert</label>
                                    <input
                                    type="date"
                                    value={form.Tgl_Convert}
                                    onChange={(e) => setForm({ ...form, Tgl_Convert: e.target.value })}
                                    required
                                    />
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