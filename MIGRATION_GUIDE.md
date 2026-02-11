# Migration Guide: Dari Hardcode ke Database-Driven Permissions

## Sistem Lama (Hardcode)
```tsx
// useQCPermission.ts - HARDCODE
const hasQCAccess = () => {
  return normalized.includes("qc"); // ❌ Hardcode cek bureau
};
```

## Sistem Baru (Database-Driven)
```tsx
// Menggunakan useCrudPermissions - DARI DATABASE
const { canCreate, canEdit, canDelete } = useCrudPermissions('quality_control');
```

---

## Cara Migrasi Komponen

### SEBELUM (Hardcode):
```tsx
// File: quality_control/gcs/page.tsx
import { useQCPermission } from "@/app/hooks/useQCPermission";

export default function GCSPage() {
  const { canAddData, canEdit, canDelete } = useQCPermission(); // ❌ Hardcode
  
  return (
    <>
      {canAddData && <button>Tambah</button>}
      {canEdit && <button>Edit</button>}
      {canDelete && <button>Delete</button>}
    </>
  );
}
```

### SESUDAH (Database-Driven):
```tsx
// File: quality_control/gcs/page.tsx
import { useCrudPermissions } from "@/app/hooks/useUserRole";

export default function GCSPage() {
  const { canCreate, canEdit, canDelete } = useCrudPermissions('quality_control'); // ✅ Dari database
  
  return (
    <>
      {canCreate && <button>Tambah</button>}
      {canEdit && <button>Edit</button>}
      {canDelete && <button>Delete</button>}
    </>
  );
}
```

---

## Setup Database untuk Bureau "default"

### 1. Pastikan data di tabel `bureau_groups`:
```sql
INSERT INTO bureau_groups (name) VALUES ('default');
```

### 2. Pastikan data di tabel `menu_items`:
```sql
INSERT INTO menu_items (menu_key, menu_name) VALUES 
('quality_control', 'Quality Control'),
('finance', 'Finance'),
('mining-reports', 'Mining Reports'),
('daily-operations', 'Daily Operations');
```

### 3. Set permissions untuk bureau "default":
```sql
-- Bureau "default" bisa VIEW semua menu tapi TIDAK bisa CRUD
INSERT INTO bureau_menu_permissions 
(bureau_id, menu_id, can_view, can_create, can_edit, can_delete)
SELECT 
  (SELECT id FROM bureau_groups WHERE name = 'default'),
  id,
  true,  -- can_view = true (bisa lihat menu)
  false, -- can_create = false (tidak bisa create)
  false, -- can_edit = false (tidak bisa edit)
  false  -- can_delete = false (tidak bisa delete)
FROM menu_items;
```

### 4. Set permissions untuk bureau "qc":
```sql
-- Bureau "qc" bisa VIEW dan CRUD di quality_control
INSERT INTO bureau_menu_permissions 
(bureau_id, menu_id, can_view, can_create, can_edit, can_delete)
VALUES (
  (SELECT id FROM bureau_groups WHERE name = 'qc'),
  (SELECT id FROM menu_items WHERE menu_key = 'quality_control'),
  true,  -- can_view
  true,  -- can_create
  true,  -- can_edit
  true   -- can_delete
);
```

---

## Keuntungan Sistem Baru:

✅ **Tidak ada hardcode** - Semua dari database
✅ **Fleksibel** - Ubah permission via UI admin
✅ **Scalable** - Tambah bureau/menu baru tanpa ubah code
✅ **Granular** - Control per menu per bureau
✅ **Maintainable** - Satu hook untuk semua menu

---

## File yang Bisa Dihapus (Opsional):

Setelah migrasi selesai, file ini bisa dihapus:
- `useQCPermission.ts` (sudah tidak dipakai)
- `useMiningPermission.ts` (sudah tidak dipakai)

Ganti semua dengan `useCrudPermissions` dari `useUserRole.ts`
