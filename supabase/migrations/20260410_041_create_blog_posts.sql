-- Blog posts table: calendar planning + content + Shopify publishing lifecycle
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Calendar planning
  target_date DATE NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('sales', 'authority', 'holiday', 'seasonal')),
  topic_seed TEXT NOT NULL,               -- The idea/brief for this post

  -- Content
  title TEXT,
  slug TEXT,
  body TEXT,                              -- Full HTML content
  excerpt TEXT,                           -- Short summary for Shopify + SEO
  tags TEXT[] DEFAULT '{}',

  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[] DEFAULT '{}',

  -- Product references (Shopify product handles for sales posts)
  product_references TEXT[] DEFAULT '{}',

  -- Status lifecycle: planned → drafting → draft → review → published | rejected
  status TEXT NOT NULL DEFAULT 'planned' CHECK (
    status IN ('planned', 'drafting', 'draft', 'review', 'published', 'rejected')
  ),

  -- Shopify publishing
  shopify_article_id TEXT,
  shopify_article_url TEXT,
  published_at TIMESTAMPTZ,

  -- AI generation tracking
  generation_prompt TEXT,
  calendar_month TEXT                     -- e.g. '2026-04' — which calendar generation produced this
);

-- Indexes
CREATE INDEX blog_posts_status_idx ON blog_posts(status);
CREATE INDEX blog_posts_target_date_idx ON blog_posts(target_date);
CREATE INDEX blog_posts_user_id_idx ON blog_posts(user_id);
CREATE INDEX blog_posts_calendar_month_idx ON blog_posts(calendar_month);

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON blog_posts
  FOR ALL USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE blog_posts;
