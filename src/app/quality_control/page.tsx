"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createBrowserClient } from "../lib/supabase";
import "../components/stylish-crud-table.css";

import Sidebar from "../components/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Edit, Trash2, Search, Filter, Download, FileText } from "lucide-react";
import { useAuth } from "../providers/auth_provider";


interface User {
  id: number;
  kode_produksi: string;
  no_produksi: string;
  jenis_material: string;
  kode_front: string;
  kode_kontraktor: string;
  jumlah_sampel: number;
  created_at?: string;
}

export default function StylishCRUDTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [form, setForm] = useState<{ id: number; kode_produksi: string; no_produksi: string; jenis_material: string; kode_front: string; kode_kontraktor: string; jumlah_sampel: number }>({ id: 0, kode_produksi: "", no_produksi: "", jenis_material: "", kode_front: "", kode_kontraktor: "", jumlah_sampel: 0 });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    console.log('Fetching data from quality_control table...');
    const { data, error } = await supabase
      .from('quality_control')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fetch Error:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
    } else {
      console.log('Fetched data:', data);
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
        .from('quality_control')
        .update({ kode_produksi: form.kode_produksi, no_produksi: form.no_produksi, jenis_material: form.jenis_material, kode_front: form.kode_front, kode_kontraktor: form.kode_kontraktor, jumlah_sampel: form.jumlah_sampel })
        .eq('id', form.id);
      
      if (error) {
        console.error('Update Error:', error);
        console.error('Error message:', error.message);
      }
    } else {
      const { error } = await supabase
        .from('quality_control')
        .insert([{ kode_produksi: form.kode_produksi, no_produksi: form.no_produksi, jenis_material: form.jenis_material, kode_front: form.kode_front, kode_kontraktor: form.kode_kontraktor, jumlah_sampel: form.jumlah_sampel }]);
      
      if (error) {
        console.error('Insert Error:', error);
        console.error('Error message:', error.message);
      }
    }

    setForm({ id: 0, kode_produksi: "", no_produksi: "", jenis_material: "", kode_front: "", kode_kontraktor: "", jumlah_sampel: 0 });
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
      const { error } = await supabase.from('quality_control').delete().eq('id', id);
      if (error) {
        console.error('Delete Error:', error);
        console.error('Error message:', error.message);
      }
      else fetchUsers();
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ id: 0, kode_produksi: "", no_produksi: "", jenis_material: "", kode_front: "", kode_kontraktor: "", jumlah_sampel: 0 });
    setEditing(false);
    setShowModal(false);
  };

  const handleTabChange = (tab: string) => {
    // Handle tab change logic here if needed
    console.log('Tab changed to:', tab);
  };

  const exportToExcel = () => {
    const headers = ['Kode Produksi', 'No Produksi', 'Jenis Material', 'Kode Front', 'Kode Kontraktor', 'Jumlah Sampel'];
    const data = filteredUsers.map(user => [
      user.kode_produksi,
      user.no_produksi,
      user.jenis_material,
      user.kode_front,
      user.kode_kontraktor,
      user.jumlah_sampel
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
    a.download = 'quality_control.xls';
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
                    <h2>Quality Control</h2>
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
                          user.kode_produksi?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                          // user.no_produksi?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.jenis_material?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.kode_front?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                          user.kode_kontraktor?.toLowerCase().includes(e.target.value.toLowerCase())
                          // String(user.jumlah_sampel).toLowerCase().includes(e.target.value.toLowerCase())
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
                              setSortBy('kode_produksi');
                              let sorted = [...filteredUsers];
                              sorted.sort((a, b) => a.kode_produksi.localeCompare(b.kode_produksi));
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
                            Kode Produksi
                          </div>
                          <div
                            onClick={() => {
                              setSortBy('no_produksi');
                              let sorted = [...filteredUsers];
                              sorted.sort((a, b) => String(a.no_produksi).localeCompare(String(b.no_produksi)));
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
                            No Produksi
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
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Kode Produksi</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>No Produksi</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Jenis Material</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Kode Front</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Kode Kontraktor</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Jumlah Sampel</th>
                            <th style={{textAlign: 'center', border: '1px solid #ddd', padding: '8px'}}>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {loading ? (
                          <tr>
                              <td colSpan={7} className="loading">Loading...</td>
                          </tr>
                          ) : filteredUsers.length === 0 ? (
                          <tr>
                              <td colSpan={7} className="no-data">No data found</td>
                          </tr>
                          ) : (
                          filteredUsers.map((user) => (
                              <tr key={user.id}>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.kode_produksi}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.no_produksi}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.jenis_material}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.kode_front}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.kode_kontraktor}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{user.jumlah_sampel}</td>
                                {/* <td style={{border: '1px solid #ddd', padding: '8px'}}>
                                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                                </td> */}
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
                                  <label>Kode Produksi</label>
                                  <input
                                  type="text"
                                  value={form.kode_produksi}
                                  onChange={(e) => setForm({ ...form, kode_produksi: e.target.value })}
                                  required
                                  />
                              </div>
                              <div className="form-group">
                                  <label>No Produksi</label>
                                  <input
                                  type="number"
                                  value={form.no_produksi}
                                  onChange={(e) => setForm({ ...form, no_produksi: e.target.value })}
                                  required
                                  />
                              </div>
                              <div className="form-group">
                                  <label>Jenis Material</label>
                                  <select
                                  value={form.jenis_material}
                                  onChange={(e) => setForm({ ...form, jenis_material: e.target.value })}
                                  required
                                  >
                                  <option value="" disabled>Pilih...</option>
                                  <option value="Bahan 1">Bahan 1</option>
                                  <option value="Bahan 2">Bahan 2</option>
                                  <option value="Bahan 3">Bahan 3</option>
                                  </select>
                              </div>
                              <div className="form-group">
                                  <label>Kode Front</label>
                                  <select
                                  value={form.kode_front}
                                  onChange={(e) => setForm({ ...form, kode_front: e.target.value })}
                                  >
                                  <option value="" disabled>Pilih...</option>
                                  <option value="Front 1">Front 1</option>
                                  <option value="Front 2">Front 2</option>
                                  <option value="Front 3">Front 3</option>
                                  </select>
                              </div>
                              <div className="form-group">
                                  <label>Kode Kontraktor</label>
                                  <select
                                  value={form.kode_kontraktor}
                                  onChange={(e) => setForm({ ...form, kode_kontraktor: e.target.value })}
                                  >
                                  <option value="" disabled>Pilih...</option>
                                  <option value="Kontraktor 1">Kontraktor 1</option>
                                  <option value="Kontraktor 2">Kontraktor 2</option>
                                  <option value="Kontraktor 3">Kontraktor 3</option>
                                  </select>
                              </div>
                              <div className="form-group">
                                  <label>Jumlah Sampel</label>
                                  <input
                                  type="number"
                                  value={form.jumlah_sampel}
                                  onChange={(e) => setForm({ ...form, jumlah_sampel: Number(e.target.value) })}
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