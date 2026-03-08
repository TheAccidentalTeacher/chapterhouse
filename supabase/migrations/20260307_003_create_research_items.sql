-- Create research_items table for URL ingestion and AI analysis
CREATE TABLE IF NOT EXISTS research_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  title text,
  raw_text text,
  summary text,
  verdict text,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'review',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Allow service role to do everything (already implicit), allow anon to read
ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to research_items"
  ON research_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
