-- supabase/migrations/20250730104500_seed_significant_issues_data.sql

-- Bagian "up" untuk menerapkan migrasi (seeding)
INSERT INTO public.significant_issues (tanggal, keterangan) VALUES
('2025-05-02', '18:35-19:00 LT, 19:00-19:40, Hujan (BG. TGH 3651 & BG. PB 3101)'),
('2025-05-07', '19:00-21:00 LT, Awal kegiatan Exca 239 kerusakan dalam tongkang (BG. MEGA VICTORY)'),
('2025-05-09', '19:25-23:30 LT, Hujan (BG. SEGARA 63 & BG. MP 330 11)'),
('2025-05-14', '13:35-17:25 LT, Hujan (BG. PB 3101 & BG. WIRATIMUR 3006)'),
('2025-05-16', '14:50-16:00 LT, Hujan (BG. WIRATIMUR 3006 & BG. MP 330 19)');

-- Bagian "down" untuk mengembalikan migrasi (menghapus data yang di-seed)
-- Hati-hati dengan ini, pastikan Anda hanya menghapus data yang di-seed oleh migrasi ini.
-- Contoh sederhana: DELETE FROM public.significant_issues WHERE tanggal IN ('2025-05-02', '2025-05-07', ...);
-- Atau jika Anda punya kolom unik lain, gunakan itu.
-- Untuk data seeding yang statis, kadang DROP TABLE di migrasi sebelumnya sudah cukup.
-- Untuk contoh ini, kita bisa menghapus berdasarkan keterangan unik atau tanggal.
DELETE FROM public.significant_issues
WHERE keterangan IN (
    '18:35-19:00 LT, 19:00-19:40, Hujan (BG. TGH 3651 & BG. PB 3101)',
    '19:00-21:00 LT, Awal kegiatan Exca 239 kerusakan dalam tongkang (BG. MEGA VICTORY)',
    '19:25-23:30 LT, Hujan (BG. SEGARA 63 & BG. MP 330 11)',
    '13:35-17:25 LT, Hujan (BG. PB 3101 & BG. WIRATIMUR 3006)',
    '14:50-16:00 LT, Hujan (BG. WIRATIMUR 3006 & BG. MP 330 19)'
);