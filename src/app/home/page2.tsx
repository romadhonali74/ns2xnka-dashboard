"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createBrowserClient } from "../lib/supabase";
import "../components/stylish-crud-table.css";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export default function StylishCRUDTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ id: 0, name: "", email: "", role: "user" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('test_table')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error:', error);
    else setUsers(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editing) {
      const { error } = await supabase
        .from('test_table')
        .update({ name: form.name, email: form.email, role: form.role })
        .eq('id', form.id);
      
      if (error) console.error('Error:', error);
    } else {
      const { error } = await supabase
        .from('test_table')
        .insert([{ name: form.name, email: form.email, role: form.role }]);
      
      if (error) console.error('Error:', error);
    }

    setForm({ id: 0, name: "", email: "", role: "" });
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
      const { error } = await supabase.from('test_table').delete().eq('id', id);
      if (error) console.error('Error:', error);
      else fetchUsers();
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ id: 0, name: "", email: "", role: "user" });
    setEditing(false);
    setShowModal(false);
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <h2>User Management</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add User
        </button>
      </div>

      <div className="table-container">
        <table className="stylish-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="loading">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="no-data">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(user)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(user.id)}>
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
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit User' : 'Add New User'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
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
  );
}