// CONTOH PENGGUNAAN DI KOMPONEN CRUD
// File: src/app/quality_control/gcs/page.tsx (contoh)

"use client";

import { useCrudPermissions } from "@/app/hooks/useUserRole";

export default function GCSPage() {
  // Ambil CRUD permissions untuk menu ini
  const { canCreate, canEdit, canDelete } = useCrudPermissions('quality_control');

  return (
    <div>
      <h1>GCS Page</h1>
      
      {/* Tombol Create - hanya muncul jika canCreate = true */}
      {canCreate && (
        <button onClick={() => console.log('Create')}>
          Tambah Data
        </button>
      )}

      {/* Tabel dengan action buttons */}
      <table>
        <tbody>
          <tr>
            <td>Data 1</td>
            <td>
              {/* Tombol Edit - hanya muncul jika canEdit = true */}
              {canEdit && <button>Edit</button>}
              
              {/* Tombol Delete - hanya muncul jika canDelete = true */}
              {canDelete && <button>Delete</button>}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
