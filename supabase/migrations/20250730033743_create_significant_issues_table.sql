-- supabase/migrations/YOUR_TIMESTAMP_create_significant_issues_table.sql

CREATE TABLE public.significant_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tanggal DATE NOT NULL,
    keterangan TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ALTER TABLE public.significant_issues ENABLE ROW LEVEL SECURITY;

-- Bagian "down" untuk mengembalikan migrasi (rollback)
-- DROP TABLE IF EXISTS public.significant_issues;