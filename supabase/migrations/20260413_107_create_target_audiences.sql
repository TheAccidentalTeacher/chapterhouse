-- Phase 28E: Audiences as Structured Data
CREATE TABLE target_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  demographics JSONB DEFAULT '{}',
  pain_points JSONB DEFAULT '[]',
  motivations JSONB DEFAULT '[]',
  preferred_tone TEXT,
  doc_type_affinity JSONB DEFAULT '{}',
  brand_voice_id UUID REFERENCES brand_voices(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE target_audiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "target_audiences_owner" ON target_audiences
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX target_audiences_user_idx ON target_audiences(user_id);

-- Seed audience (uses first user — Scott)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users) THEN
    INSERT INTO target_audiences (user_id, name, description, demographics, pain_points, motivations, preferred_tone)
    VALUES (
      (SELECT id FROM auth.users LIMIT 1),
      'Conviction-Stage Homeschool Parent',
      'Parent who has already decided to homeschool. Not exploring — committed. Looking for the right curriculum, not permission.',
      '{"children_ages": "5-18", "decision_stage": "committed", "location_type": "rural_or_suburban", "tech_comfort": "moderate"}'::jsonb,
      '["state compliance complexity", "curriculum overwhelm from too many options", "isolation from other homeschool families", "record-keeping burden", "questions about rigor vs. traditional school"]'::jsonb,
      '["faith or values alignment", "child learns at own pace", "family time and presence", "better academic outcomes", "escape from toxic school environments"]'::jsonb,
      'warm, direct, practical — no jargon, no hedging'
    );
  END IF;
END $$;
