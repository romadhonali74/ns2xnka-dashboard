# Price Monthly Table Setup

## 1. Jalankan Migration di Supabase

Buka **Supabase Dashboard** → **SQL Editor** → Jalankan script berikut:

```sql
-- Create price_monthly table for Sales & Marketing data
CREATE TABLE IF NOT EXISTS public.price_monthly (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  periode INTEGER NOT NULL CHECK (periode IN (1, 2)),
  hma DECIMAL(15, 2),
  premium DECIMAL(15, 2),
  hpm DECIMAL(15, 2),
  harga_jual DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month, periode)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_price_monthly_year_month ON public.price_monthly(year, month);

-- Enable RLS
ALTER TABLE public.price_monthly ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read price_monthly"
  ON public.price_monthly
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert price_monthly"
  ON public.price_monthly
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update price_monthly"
  ON public.price_monthly
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete price_monthly"
  ON public.price_monthly
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_price_monthly_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_price_monthly_updated_at
  BEFORE UPDATE ON public.price_monthly
  FOR EACH ROW
  EXECUTE FUNCTION update_price_monthly_updated_at();
```

## 2. Struktur Tabel

| Column      | Type      | Description                          |
|-------------|-----------|--------------------------------------|
| id          | SERIAL    | Primary key                          |
| year        | INTEGER   | Tahun (e.g., 2025)                   |
| month       | INTEGER   | Bulan (1-12)                         |
| periode     | INTEGER   | Periode (1 atau 2)                   |
| hma         | DECIMAL   | Harga HMA                            |
| premium     | DECIMAL   | Harga PREMIUM                        |
| hpm         | DECIMAL   | Harga HPM                            |
| harga_jual  | DECIMAL   | Harga JUAL                           |
| created_at  | TIMESTAMP | Waktu dibuat                         |
| updated_at  | TIMESTAMP | Waktu diupdate (auto-update)         |

**Unique Constraint:** `(year, month, periode)` - Tidak boleh ada duplikat untuk kombinasi tahun, bulan, dan periode yang sama.

## 3. API Endpoints

### GET `/api/price-monthly`
Fetch data harga bulanan.

**Query Parameters:**
- `year` (optional): Filter by year

**Example:**
```javascript
const res = await fetch('/api/price-monthly?year=2025');
const data = await res.json();
```

### POST `/api/price-monthly`
Insert atau update data harga untuk kedua periode sekaligus.

**Request Body:**
```json
{
  "year": 2025,
  "month": 1,
  "periode1": {
    "hma": "15000",
    "premium": "16000",
    "hpm": "14000",
    "harga_jual": "17000"
  },
  "periode2": {
    "hma": "15500",
    "premium": "16500",
    "hpm": "14500",
    "harga_jual": "17500"
  }
}
```

**Example:**
```javascript
const res = await fetch('/api/price-monthly', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    year: 2025,
    month: 1,
    periode1: { hma: '15000', premium: '16000', hpm: '14000', harga_jual: '17000' },
    periode2: { hma: '15500', premium: '16500', hpm: '14500', harga_jual: '17500' }
  })
});
```

## 4. Fitur yang Sudah Terintegrasi

✅ **Form Add Data** - 2 halaman (Periode I & Periode II) submit sekaligus ke database
✅ **Tabel Laporan Harga Bulanan** - Fetch data real dari database berdasarkan tahun
✅ **4 Chart Trend** - Otomatis update berdasarkan data dari database:
  - Trend HMA
  - Trend PREMIUM
  - Trend HPM
  - Trend HARGA JUAL

## 5. Cara Menggunakan

1. **Jalankan migration** di Supabase SQL Editor
2. **Restart development server** (jika perlu):
   ```bash
   npm run dev
   ```
3. **Buka halaman Sales & Marketing**
4. **Klik "Add Data"**
5. **Isi form Periode I** → Klik "Next"
6. **Isi form Periode II** → Klik "Save"
7. **Data akan tersimpan** di database dan langsung muncul di tabel & chart

## 6. Notes

- Data menggunakan **UPSERT** - jika data untuk tahun/bulan/periode sudah ada, akan di-update
- Chart menggunakan **rata-rata Periode I & II** untuk setiap bulan
- Jika tidak ada data, chart akan menampilkan garis datar di posisi baseline
- Filter tahun di dropdown akan fetch data sesuai tahun yang dipilih
