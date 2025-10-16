CREATE TABLE significant_issues (
  id SERIAL PRIMARY KEY,
  tanggal TEXT NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Opsional: Tambahkan data awal (seeding)
INSERT INTO significant_issues (tanggal, keterangan) VALUES
('2 May', '18:35-19:00 LT, 19:00-19:40, Hujan (BG. TGH 3651 & BG. PB 3101)'),
('7 May', '19:00-21:00 LT, Awal kegiatan Exca 239 kerusakan dalam tongkang (BG. MEGA VICTORY)'),
('9 May', '19:25-23:30 LT, Hujan (BG. SEGARA 63 & BG. MP 330 11)'),
('14 May', '13:35-17:25 LT, Hujan (BG. PB 3101 & BG. WIRATIMUR 3006)'),
('16 May', '14:50-16:00 LT, Hujan (BG. WIRATIMUR 3006 & BG. MP 330 19)');
