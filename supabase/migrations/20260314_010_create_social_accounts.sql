-- Social accounts: Buffer profile IDs per brand+platform combination
-- Populated manually via Settings > Social Accounts after connecting Buffer
-- March 14, 2026

CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  brand TEXT NOT NULL CHECK (brand IN ('ncho', 'somersschool', 'alana_terry', 'scott_personal')),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'threads', 'tiktok', 'youtube', 'pinterest')),
  buffer_profile_id TEXT NOT NULL,  -- channel ID from Buffer GraphQL API (GetChannels query)
  display_name TEXT NOT NULL,       -- human-readable e.g. "NCHO Facebook Page"
  is_active BOOLEAN NOT NULL DEFAULT true,

  UNIQUE (brand, platform)
);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON social_accounts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE TRIGGER social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();
