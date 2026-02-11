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
      setOriginalPermissions(permissionsData);
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

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const originalSet = new Set(originalPermissions.map(p => `${p.bureau_id}-${p.menu_id}`));
      const currentSet = new Set(permissions.map(p => `${p.bureau_id}-${p.menu_id}`));

      for (const change of pendingChanges) {
        const [bureauId, menuId] = change.split('-').map(Number);
        
        if (currentSet.has(change) && !originalSet.has(change)) {
          await fetch('/api/bureau-permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bureau_id: bureauId, menu_id: menuId, can_view: true })
          });
        } else if (!currentSet.has(change) && originalSet.has(change)) {
          const perm = originalPermissions.find(p => p.bureau_id === bureauId && p.menu_id === menuId);
          if (perm) {
            await fetch('/api/bureau-permissions', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: perm.id })
            });
          }
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
            <h1 className="text-2xl font-bold text-[#273240]">Group Privilege Management</h1>
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={pendingChanges.size === 0 || saving}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  pendingChanges.size === 0 || saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                }`}
              >
                {saving ? 'Saving...' : `Submit Changes (${pendingChanges.size})`}
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add Permission
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Bureau \ Menu</th>
                    {menus.map(menu => (
                      <th key={menu.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        {menu.menu_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bureaus.map(bureau => (
                    <tr key={bureau.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        {bureau.name}
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
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Add Permission</h2>
            </div>

            <div className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bureau</label>
                <select
                  value={selectedBureau || ''}
                  onChange={(e) => setSelectedBureau(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Bureau</option>
                  {bureaus.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Menu</label>
                <select
                  value={selectedMenu || ''}
                  onChange={(e) => setSelectedMenu(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Menu</option>
                  {menus.map(m => (
                    <option key={m.id} value={m.id}>{m.menu_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-5 flex justify-between items-center border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPermission}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
