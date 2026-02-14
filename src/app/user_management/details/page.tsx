"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";

interface User {
  id: string;
  email: string;
  raw_app_meta_data: any;
  raw_user_meta_data: any;
  is_super_admin: boolean;
  last_sign_in_at: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    app_role: "",
    app_bureau: "",
    user_role: "",
    user_bureau: "",
    is_super_admin: false,
    email_confirm: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      console.log('Users data received:', data);
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAddMode(true);
    setEditingUser(null);
    setShowPassword(false);
    setFormData({
      email: "",
      password: "",
      app_role: "",
      app_bureau: "",
      user_role: "",
      user_bureau: "",
      is_super_admin: false,
      email_confirm: true
    });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setIsAddMode(false);
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      app_role: user.raw_app_meta_data?.role || "",
      app_bureau: user.raw_app_meta_data?.bureau || "",
      user_role: user.raw_user_meta_data?.role || "",
      user_bureau: user.raw_user_meta_data?.bureau || "",
      is_super_admin: user.is_super_admin,
      email_confirm: true
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (isAddMode) {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            email_confirm: formData.email_confirm,
            app_metadata: { role: formData.app_role, bureau: formData.app_bureau },
            user_metadata: { role: formData.user_role, bureau: formData.user_bureau }
          })
        });
        if (response.ok) {
          setShowModal(false);
          fetchUsers();
        }
      } else {
        if (!editingUser) return;
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            app_metadata: { role: formData.app_role, bureau: formData.app_bureau, is_super_admin: formData.is_super_admin },
            user_metadata: { role: formData.user_role, bureau: formData.user_bureau }
          })
        });
        if (response.ok) {
          setShowModal(false);
          setEditingUser(null);
          fetchUsers();
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.raw_app_meta_data?.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.raw_app_meta_data?.bureau?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.raw_user_meta_data?.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.raw_user_meta_data?.bureau?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#273240]">Users Management</h1>
            <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">+ Add User</button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              Error: {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by email, role, or bureau..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">App Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Super Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sign In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>Role: {user.raw_app_meta_data?.role || '-'}</div>
                      <div>Bureau: {user.raw_app_meta_data?.bureau || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>Role: {user.raw_user_meta_data?.role || '-'}</div>
                      <div>Bureau: {user.raw_user_meta_data?.bureau || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${user.is_super_admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.is_super_admin ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800 mr-3 cursor-pointer transition-all hover:scale-110">Edit</button>
                      <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 cursor-pointer transition-all hover:scale-110">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">{isAddMode ? 'Add User' : 'Edit User'}</h2>
              <p className="text-blue-100 text-sm mt-1">{isAddMode ? 'Create new user account' : editingUser?.email}</p>
            </div>

            <div className="p-8 space-y-4">
              {isAddMode && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" checked={formData.email_confirm} onChange={(e) => setFormData({...formData, email_confirm: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    <label className="ml-2 text-sm font-semibold text-gray-700">Auto Confirm User</label>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">App Role</label>
                  <input type="text" value={formData.app_role} onChange={(e) => setFormData({...formData, app_role: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">App Bureau</label>
                  <input type="text" value={formData.app_bureau} onChange={(e) => setFormData({...formData, app_bureau: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">User Role</label>
                  <input type="text" value={formData.user_role} onChange={(e) => setFormData({...formData, user_role: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">User Bureau</label>
                  <input type="text" value={formData.user_bureau} onChange={(e) => setFormData({...formData, user_bureau: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
              <div className="flex items-center">
                <input type="checkbox" checked={formData.is_super_admin} onChange={(e) => setFormData({...formData, is_super_admin: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                <label className="ml-2 text-sm font-semibold text-gray-700">Super Admin</label>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-5 flex justify-between items-center border-t">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100">Cancel</button>
              <button onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
