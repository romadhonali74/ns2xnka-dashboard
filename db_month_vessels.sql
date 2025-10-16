-- Month-specific vessel mapping
CREATE TABLE IF NOT EXISTS public.month_vessels (
  id serial PRIMARY KEY,
  month_year varchar(7) NOT NULL, -- YYYY-MM
  vessel_id integer NOT NULL REFERENCES public.vessels(id) ON DELETE CASCADE,
  seq integer NOT NULL, -- posisi kolom (1 = paling kiri)
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- izinkan duplikasi vessel di bulan yang sama (untuk menampilkan dua kolom nama sama)
-- kombinasi uniknya adalah (month_year, seq)
CREATE UNIQUE INDEX IF NOT EXISTS month_vessels_month_seq_unique
  ON public.month_vessels (month_year, seq);


