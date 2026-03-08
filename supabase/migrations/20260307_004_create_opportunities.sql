-- Create product opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'product',  -- product | content | positioning | distribution
  store_score text,    -- A+, A, A-, B+, B, B-, C
  curriculum_score text,
  content_score text,
  evidence text[],     -- bullet points of what drove this score
  action text,         -- recommended next step
  status text NOT NULL DEFAULT 'open',  -- open | in-progress | passed | done
  source_ids uuid[],   -- research_items that informed this
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to opportunities"
  ON opportunities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
