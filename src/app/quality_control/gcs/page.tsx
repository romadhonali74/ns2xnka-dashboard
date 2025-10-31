"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createBrowserClient } from "../../lib/supabase";
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


interface User {
  id: number;
  Id_Lab: string;
  Ni: string;
  Co: string;
  Fe: number;
  SiO2: number;
  CaO: number;
  MgO: number;
  Analis: string;
  Kode_Sampel: string;
  Tanggal_analisa: string;
  Jam_Mulai: string;
  Jam_Selesai: string;
  Tgl_Convert: string;
}

export default function StylishCRUDTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [form, setForm] = useState<{ id: number; Id_Lab: string; Ni: string; Co: string; Fe: number; SiO2: number; CaO: number; MgO: number; Analis: string; Kode_Sampel: string; Tanggal_analisa: string; Jam_Mulai: string; Jam_Selesai: string; Tgl_Convert: string }>({ id: 0, Id_Lab: "", Ni: "", Co: "", Fe: 0, SiO2: 0, CaO: 0, MgO: 0, Analis: "", Kode_Sampel: "", Tanggal_analisa: "", Jam_Mulai: "", Jam_Selesai: "", Tgl_Convert: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const supabase = createBrowserClient();

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
    console.log('Fetching data from gcs table...');
    const { data, error } = await supabase
      .from('gcs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fetch Error:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
    } else {
      console.log('Fetched data:', data);
      if (data && data.length > 0) {
        console.log('First row structure:', Object.keys(data[0]));
        console.log('Sample data:', data[0]);
      }
      setUsers(data || []);
      setFilteredUsers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editing) {
      const { error } = await supabase
        .from('gcs')
        .update({ 
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
          Tgl_Convert: form.Tgl_Convert,
          edited_at: new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString()
        })
        .eq('id', form.id);
      
      if (error) {
        console.error('Update Error:', error);
        console.error('Error message:', error.message);
      }
    } else {
      const { error } = await supabase
        .from('gcs')
        .insert([{ 
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
          Tgl_Convert: form.Tgl_Convert,
          created_at: new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString()
        }]);
      
      if (error) {
        console.error('Insert Error:', error);
        console.error('Error message:', error.message);
      }
    }

    setForm({ id: 0, Id_Lab: "", Ni: "", Co: "", Fe: 0, SiO2: 0, CaO: 0, MgO: 0, Analis: "", Kode_Sampel: "", Tanggal_analisa: "", Jam_Mulai: "", Jam_Selesai: "", Tgl_Convert: ""});
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
      const { error } = await supabase.from('gcs').delete().eq('id', id);
      if (error) {
        console.error('Delete Error:', error);
        console.error('Error message:', error.message);
      }
      else fetchUsers();
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ id: 0, Id_Lab: "", Ni: "", Co: "", Fe: 0, SiO2: 0, CaO: 0, MgO: 0, Analis: "", Kode_Sampel: "", Tanggal_analisa: "", Jam_Mulai: "", Jam_Selesai: "", Tgl_Convert: ""});
    setEditing(false);
    setShowModal(false);
  };

  const handleTabChange = (tab: string) => {
    // Handle tab change logic here if needed
    console.log('Tab changed to:', tab);
  };

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
    a.download = 'GCS.xls';
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
                    <h2>GCS</h2>
                    <button className="btn-primary" onClick={() => setShowModal(true)} style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <Plus size={16} />
                    Add Data
                    </button>
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
                          user.Id_Lab?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.Ni?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.Co?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.Fe?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.SiO2?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.CaO?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.MgO?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.Analis?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.Kode_Sampel?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.Tanggal_analisa?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.Jam_Mulai?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.Jam_Selesai?.toString().toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.Tgl_Convert?.toString().toLowerCase().includes(e.target.value.toLowerCase())
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
                              setSortBy('Kode_Sampel');
                              let sorted = [...filteredUsers];
                              sorted.sort((a, b) => a.Kode_Sampel.localeCompare(b.Kode_Sampel));
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
                            Kode Sampel
                          </div>
                          <div
                            onClick={() => {
                              setSortBy('Analis');
                              let sorted = [...filteredUsers];
                              sorted.sort((a, b) => String(a.Analis).localeCompare(String(b.Analis)));
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
                            Analis
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
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Id Lab</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Ni</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Co</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Fe</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>SiO2</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>CaO</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>MgO</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Analis</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Kode Sampel</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Tanggal Analisa</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Jam Mulai</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Jam Selesai</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Tgl Convert</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {loading ? (
                          <tr>
                              <td colSpan={14} className="loading">Loading...</td>
                          </tr>
                          ) : filteredUsers.length === 0 ? (
                          <tr>
                              <td colSpan={14} className="no-data">No data found</td>
                          </tr>
                          ) : (
                          filteredUsers.map((user) => (
                              <tr key={user.id}>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Id_Lab}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Ni}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Co}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Fe}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.SiO2}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.CaO}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.MgO}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Analis}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Kode_Sampel}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Tanggal_analisa}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Jam_Mulai}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Jam_Selesai}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.Tgl_Convert}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>
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
                                </td>
                              </tr>
                          ))
                          )}
                      </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal" style={{maxHeight: '90vh', overflowY: 'auto'}}>
                            <div className="modal-header">
                            <h3>{editing ? 'Edit Data' : 'Menambah Data'}</h3>
                            <button className="close-btn" onClick={resetForm}>×</button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-form">
                              <div className="form-group">
                                  <label>Id Lab</label>
                                  <input
                                  type="text"
                                  value={form.Id_Lab}
                                  onChange={(e) => setForm({ ...form, Id_Lab: e.target.value })}
                                  required
                                  />
                              </div>
                              <div className="form-group">
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