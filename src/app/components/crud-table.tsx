"use client";

import { useState } from "react";

interface Item {
  id: number;
  name: string;
  email: string;
  status: string;
}

export default function CRUDTable() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "John Doe", email: "john@example.com", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Inactive" }
  ]);
  
  const [form, setForm] = useState({ id: 0, name: "", email: "", status: "Active" });
  const [editing, setEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setItems(items.map(item => item.id === form.id ? form : item));
    } else {
      setItems([...items, { ...form, id: Date.now() }]);
    }
    setForm({ id: 0, name: "", email: "", status: "Active" });
    setEditing(false);
  };

  const handleEdit = (item: Item) => {
    setForm(item);
    setEditing(true);
  };

  const handleDelete = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>CRUD Table</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ccc" }}>
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ margin: "5px", padding: "8px", border: "1px solid #ccc" }}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ margin: "5px", padding: "8px", border: "1px solid #ccc" }}
          required
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={{ margin: "5px", padding: "8px", border: "1px solid #ccc" }}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button type="submit" style={{ margin: "5px", padding: "8px 15px", backgroundColor: "#007bff", color: "white", border: "none", cursor: "pointer" }}>
          {editing ? "Update" : "Add"}
        </button>
        {editing && (
          <button type="button" onClick={() => { setForm({ id: 0, name: "", email: "", status: "Active" }); setEditing(false); }} 
            style={{ margin: "5px", padding: "8px 15px", backgroundColor: "#6c757d", color: "white", border: "none", cursor: "pointer" }}>
            Cancel
          </button>
        )}
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8f9fa" }}>
            <th style={{ padding: "10px", border: "1px solid #ccc", textAlign: "left" }}>Name</th>
            <th style={{ padding: "10px", border: "1px solid #ccc", textAlign: "left" }}>Email</th>
            <th style={{ padding: "10px", border: "1px solid #ccc", textAlign: "left" }}>Status</th>
            <th style={{ padding: "10px", border: "1px solid #ccc", textAlign: "left" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ backgroundColor: item.id % 2 === 0 ? "#f8f9fa" : "white" }}>
              <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.name}</td>
              <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.email}</td>
              <td style={{ padding: "10px", border: "1px solid #ccc" }}>{item.status}</td>
              <td style={{ padding: "10px", border: "1px solid #ccc" }}>
                <button onClick={() => handleEdit(item)} 
                  style={{ margin: "2px", padding: "5px 10px", backgroundColor: "#28a745", color: "white", border: "none", cursor: "pointer" }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(item.id)} 
                  style={{ margin: "2px", padding: "5px 10px", backgroundColor: "#dc3545", color: "white", border: "none", cursor: "pointer" }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}