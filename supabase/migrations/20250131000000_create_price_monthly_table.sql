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
