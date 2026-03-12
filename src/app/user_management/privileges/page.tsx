"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";

interface Bureau {
  id: number;
  name: string;
  description: string;
}

interface MenuItem {
  id: number;
  menu_key: string;
  menu_name: string;
  parent_id: number | null;
}

interface Permission {
  id: number;
  bureau_id: number;
  menu_id: number;
  can_view: boolean;
  can_create?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  bureau_groups: { id: number; name: string };
  menu_items: { id: number; menu_key: string; menu_name: string };
}

export default function GroupPrivilegePage() {
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<Permission[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBureau, setSelectedBureau] = useState<number | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newBureau, setNewBureau] = useState({ name: '', description: '' });
  const [editingBureauId, setEditingBureauId] = useState<number | null>(null);
  const [editingBureauName, setEditingBureauName] = useState('');
  const [filterBureau, setFilterBureau] = useState<number | null>(null);
  const [submittingBureau, setSubmittingBureau] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bureausRes, menusRes, permissionsRes] = await Promise.all([
        fetch('/api/bureaus'),
        fetch('/api/menus'),
        fetch('/api/bureau-permissions')
      ]);

      const bureausData = await bureausRes.json();
      const menusData = await menusRes.json();
      const permissionsData = await permissionsRes.json();

      setBureaus(bureausData);
      setMenus(menusData.filter((m: MenuItem) => m.parent_id === null));
      setPermissions(permissionsData);
      setOriginalPermissions(JSON.parse(JSON.stringify(permissionsData)));
      setPendingChanges(new Set());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (bureauId: number, menuId: number) => {
    return permissions.find(p => p.bureau_id === bureauId && p.menu_id === menuId);
  };

  const togglePermission = (bureauId: number, menuId: number) => {
    const key = `${bureauId}-${menuId}`;
    const existing = permissions.find(p => p.bureau_id === bureauId && p.menu_id === menuId);

    if (existing) {
      setPermissions(permissions.filter(p => !(p.bureau_id === bureauId && p.menu_id === menuId)));
    } else {
      setPermissions([...permissions, {
        id: 0,
        bureau_id: bureauId,
        menu_id: menuId,
        can_view: true,
        bureau_groups: { id: bureauId, name: '' },
        menu_items: { id: menuId, menu_key: '', menu_name: '' }
      }]);
    }

    const newChanges = new Set(pendingChanges);
    if (newChanges.has(key)) {
      newChanges.delete(key);
    } else {
      newChanges.add(key);
    }
    setPendingChanges(newChanges);
  };

  const toggleCrudPermission = (bureauId: number, menuId: number, field: 'can_create' | 'can_edit' | 'can_delete') => {
    const key = `${bureauId}-${menuId}-${field}`;
    setPermissions(permissions.map(p => {
      if (p.bureau_id === bureauId && p.menu_id === menuId) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    }));

    const newChanges = new Set(pendingChanges);
    if (newChanges.has(key)) {
      newChanges.delete(key);
    } else {
      newChanges.add(key);
    }
    setPendingChanges(newChanges);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Handle removed permissions (can_view toggled OFF)
      for (const orig of originalPermissions) {
        const stillExists = permissions.find(p => p.id === orig.id);
        if (!stillExists && orig.id !== 0) {
          await fetch('/api/bureau-permissions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: orig.id })
          });
        }
      }

      // Handle new permissions (can_view toggled ON, id === 0)
      for (const perm of permissions) {
        if (perm.id === 0) {
          await fetch('/api/bureau-permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bureau_id: perm.bureau_id, menu_id: perm.menu_id, can_view: true })
          });
        }
      }

      // Handle CRUD changes on existing permissions
      for (const perm of permissions) {
        if (perm.id === 0) continue;
        const original = originalPermissions.find(p => p.id === perm.id);
        if (original && (original.can_create !== perm.can_create || original.can_edit !== perm.can_edit || original.can_delete !== perm.can_delete)) {
          await fetch('/api/bureau-permissions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: perm.id, 
              can_create: perm.can_create,
              can_edit: perm.can_edit,
              can_delete: perm.can_delete
            })
          });
        }
      }

      await fetchData();
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPermission = async () => {
    if (!selectedBureau || !selectedMenu) return;

    try {
      await fetch('/api/bureau-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bureau_id: selectedBureau, menu_id: selectedMenu, can_view: true })
      });
      setShowModal(false);
      setSelectedBureau(null);
      setSelectedMenu(null);
      fetchData();
    } catch (error) {
      console.error('Error adding permission:', error);
    }
  };

  const handleAddBureau = async () => {
    if (!newBureau.name.trim()) {
      alert('Bureau name is required');
      return;
    }

    setSubmittingBureau(true);
    try {
      const response = await fetch('/api/bureaus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBureau)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to add bureau');
        return;
      }

      setShowModal(false);
      setNewBureau({ name: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding bureau:', error);
      alert('Failed to add bureau');
    } finally {
      setSubmittingBureau(false);
    }
  };

  const handleEditBureau = (bureau: Bureau) => {
    setEditingBureauId(bureau.id);
    setEditingBureauName(bureau.name);
  };

  const handleSaveBureau = async (bureauId: number) => {
    if (!editingBureauName.trim()) {
      alert('Bureau name cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/bureaus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bureauId, name: editingBureauName })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to update bureau');
        return;
      }

      setEditingBureauId(null);
      setEditingBureauName('');
      fetchData();
    } catch (error) {
      console.error('Error updating bureau:', error);
      alert('Failed to update bureau');
    }
  };

  const handleCancelEdit = () => {
    setEditingBureauId(null);
    setEditingBureauName('');
  };

  // Filter permissions based on selected bureau
  const filteredPermissions = filterBureau
    ? permissions.filter(p => p.can_view && p.bureau_id === filterBureau && menus.find(m => m.id === p.menu_id))
    : permissions.filter(p => p.can_view && menus.find(m => m.id === p.menu_id));

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
    <>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f1f2f7" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="p-8 w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#273240]">Group Privilege Management</h1>
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={pendingChanges.size === 0 || saving}
                className={`px-6 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                  pendingChanges.size === 0 || saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                }`}
              >
                {saving ? 'Saving...' : `Submit Changes (${pendingChanges.size})`}
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
              >
                + Add Bureau
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gray-100 border-b">
              <h2 className="text-lg font-semibold text-gray-800">View Permissions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Bureau</th>
                    {menus.map(menu => (
                      <th key={menu.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        {menu.menu_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bureaus.map(bureau => (
                    <tr key={bureau.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        {editingBureauId === bureau.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingBureauName}
                              onChange={(e) => setEditingBureauName(e.target.value)}
                              className="px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveBureau(bureau.id)}
                              className="text-green-600 hover:text-green-800 cursor-pointer"
                              title="Save"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-red-600 hover:text-red-800 cursor-pointer"
                              title="Cancel"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{bureau.name}</span>
                            <button
                              onClick={() => handleEditBureau(bureau)}
                              className="text-blue-600 hover:text-blue-800 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit Bureau"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                      {menus.map(menu => {
                        const perm = hasPermission(bureau.id, menu.id);
                        return (
                          <td key={menu.id} className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={!!perm}
                              onChange={() => togglePermission(bureau.id, menu.id)}
                              className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-100 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">CRUD Permissions</h2>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <select
                  value={filterBureau || ''}
                  onChange={(e) => setFilterBureau(e.target.value ? Number(e.target.value) : null)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none cursor-pointer bg-white"
                >
                  <option value="">All Bureaus</option>
                  {bureaus.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {filterBureau && (
                  <button
                    onClick={() => setFilterBureau(null)}
                    className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    title="Clear filter"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Bureau</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Menu</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Create</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Edit</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPermissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        {filterBureau ? 'No permissions found for selected bureau' : 'No permissions available'}
                      </td>
                    </tr>
                  ) : (
                    filteredPermissions.map(perm => (
                      <tr key={`${perm.bureau_id}-${perm.menu_id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                          {bureaus.find(b => b.id === perm.bureau_id)?.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {menus.find(m => m.id === perm.menu_id)?.menu_name}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!perm.can_create}
                            onChange={() => toggleCrudPermission(perm.bureau_id, perm.menu_id, 'can_create')}
                            className="w-5 h-5 text-green-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!perm.can_edit}
                            onChange={() => toggleCrudPermission(perm.bureau_id, perm.menu_id, 'can_edit')}
                            className="w-5 h-5 text-yellow-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!perm.can_delete}
                            onChange={() => toggleCrudPermission(perm.bureau_id, perm.menu_id, 'can_delete')}
                            className="w-5 h-5 text-red-600 rounded cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">Add Bureau</h2>
              <p className="text-green-100 text-sm mt-1">Create a new bureau group</p>
            </div>

            <div className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bureau Name *</label>
                <input
                  type="text"
                  value={newBureau.name}
                  onChange={(e) => setNewBureau({ ...newBureau, name: e.target.value })}
                  placeholder="e.g., Marketing, Finance, Operations"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newBureau.description}
                  onChange={(e) => setNewBureau({ ...newBureau, description: e.target.value })}
                  placeholder="Brief description of the bureau"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-5 flex justify-between items-center border-t rounded-b-2xl">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewBureau({ name: '', description: '' });
                }}
                disabled={submittingBureau}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBureau}
                disabled={submittingBureau}
                className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submittingBureau && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {submittingBureau ? 'Adding...' : 'Add Bureau'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
