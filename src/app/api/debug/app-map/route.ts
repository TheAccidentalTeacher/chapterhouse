// /api/debug/app-map
// Returns a structured map of every Chapterhouse feature:
// - Page route, API routes, component files, required env vars, availability status
// Used by: debug panel "App Map" tab + chat context (self-knowledge)

interface FeatureEntry {
  id: string;
  name: string;
  description: string;
  page?: string;
  apiRoutes: string[];
  components: string[];
  envVars: { key: string; required: boolean }[];
  phase?: string;
  available: boolean;
  missingRequired: string[];
  missingOptional: string[];
}

// Static registry — every feature in Chapterhouse, its location, its requirements.
// Update this when adding new features.
const FEATURE_REGISTRY: Omit<FeatureEntry, "available" | "missingRequired" | "missingOptional">[] = [
  // ── Command Center ───────────────────────────────────────────────────────────
  {
    id: "home-chat",
    name: "Home Chat",
    description: "Chat interface with Solo and Council Mode. SSE streaming, thread persistence, auto-learn (/remember), URL detection + fetch, inline Council toggle.",
    page: "/",
    apiRoutes: ["/api/chat", "/api/chat/council", "/api/threads", "/api/extract-learnings"],
    components: ["src/components/chat-interface.tsx", "src/app/page.tsx"],
    envVars: [
      { key: "ANTHROPIC_API_KEY", required: true },
      { key: "OPENAI_API_KEY", required: true },
    ],
    phase: "Core",
  },
  {
    id: "daily-brief",
    name: "Daily Brief",
    description: "AI-generated business intelligence from RSS, GitHub, and daily.dev. Track impact scoring (ncho/somersschool/biblesaas 0-3). Collision detection. Vercel cron 3:00 UTC.",
    page: "/daily-brief",
    apiRoutes: ["/api/briefs", "/api/briefs/generate", "/api/cron/daily-brief"],
    components: ["src/components/brief-item-card.tsx", "src/app/daily-brief/page.tsx"],
    envVars: [
      { key: "ANTHROPIC_API_KEY", required: true },
      { key: "GITHUB_TOKEN", required: false },
      { key: "TAVILY_API_KEY", required: false },
      { key: "DAILYDEV_TOKEN", required: false },
    ],
    phase: "Phase 7",
  },
  {
    id: "inbox",
    name: "Email Inbox",
    description: "IMAP inbox with AI view: Haiku categorization (11 categories), urgency indicator, AI summary preview, TSVECTOR full-text search. Daily digest cron at midnight UTC.",
    page: "/inbox",
    apiRoutes: ["/api/email/sync", "/api/email/categorize", "/api/email/search", "/api/cron/email-digest"],
    components: ["src/components/email-inbox.tsx"],
    envVars: [
      { key: "NCHO_EMAIL_HOST", required: true },
      { key: "NCHO_EMAIL_USER", required: true },
      { key: "NCHO_EMAIL_PASSWORD", required: true },
      { key: "ANTHROPIC_API_KEY", required: true },
    ],
    phase: "Phase 8",
  },
  // ── Intelligence ─────────────────────────────────────────────────────────────
  {
    id: "intel",
    name: "Intel Sessions",
    description: "URL analysis sessions. 4-step pipeline: fetch → Claude Sonnet structured analysis → Haiku verification → Council of the Unserious synthesis. PW report paste path. Daily cron 04:00 UTC.",
    page: "/intel",
    apiRoutes: ["/api/intel", "/api/intel/[id]", "/api/intel/process", "/api/intel/publishers-weekly", "/api/cron/intel-fetch"],
    components: ["src/app/intel/page.tsx"],
    envVars: [
      { key: "ANTHROPIC_API_KEY", required: true },
    ],
    phase: "Phase 3",
  },
  {
    id: "research",
    name: "Research Library",
    description: "URL ingest, paste text, quick note, screenshot (GPT Vision), agentic auto-research (Tavily → GPT-5.4 → dedup), Deep Research (Tavily + SerpAPI + Reddit + NewsAPI). AI extraction + tagging.",
    page: "/research",
    apiRoutes: ["/api/research", "/api/research/auto"],
    components: ["src/app/research/page.tsx"],
    envVars: [
      { key: "ANTHROPIC_API_KEY", required: true },
      { key: "OPENAI_API_KEY", required: true },
      { key: "TAVILY_API_KEY", required: false },
      { key: "SERPAPI_API_KEY", required: false },
      { key: "REDDIT_CLIENT_ID", required: false },
      { key: "NEWSAPI_API_KEY", required: false },
    ],
    phase: "Core",
  },
  {
    id: "youtube",
    name: "YouTube Intelligence",
    description: "Paste URL or search → 3-tier transcript (captions npm → innertube → Gemini 2.5 Flash via Railway ~77s) → 8 curriculum tools (quiz, lesson plan, vocab, discussion, DOK, graphic organizer, guided notes). Gemini handles 100% of production transcripts.",
    page: "/youtube",
    apiRoutes: ["/api/youtube/transcript", "/api/youtube/search", "/api/youtube/batch", "/api/youtube/analyze"],
    components: ["src/components/youtube-input.tsx", "src/components/youtube-transcript-viewer.tsx", "src/components/youtube-curriculum-tools.tsx", "src/components/youtube-batch-sidebar.tsx"],
    envVars: [
      { key: "YOUTUBE_API_KEY", required: true },
      { key: "GEMINI_API_KEY", required: true },
      { key: "ANTHROPIC_API_KEY", required: true },
      { key: "RAILWAY_WORKER_URL", required: true },
    ],
    phase: "Phase 6",
  },
  {
    id: "product-intelligence",
    name: "Product Intelligence",
    description: "Scored opportunity cards (A+ through C). Triple-scored: Store (NCHO) / Curriculum (SomersSchool) / Content (marketing). Status tracking. Routes to Review Queue.",
    page: "/product-intelligence",
    apiRoutes: ["/api/opportunities"],
    components: ["src/app/product-intelligence/page.tsx"],
    envVars: [
      { key: "ANTHROPIC_API_KEY", required: true },
    ],
    phase: "Core",
  },
  // ── Production ───────────────────────────────────────────────────────────────
  {
    id: "content-studio",
    name: "Content Studio",
    description: "AI content generation in 3 modes: newsletter/campaign, curriculum guide, product description. Claude Sonnet 4.6. Copy to clipboard.",
    page: "/content-studio",
    apiRoutes: ["/api/content-studio"],
    components: ["src/app/content-studio/page.tsx"],
    envVars: [
      { key: "ANTHROPIC_API_KEY", required: true },
    ],
    phase: "Core",
  },
  {
    id: "creative-studio",
    name: "Creative Studio",
    description: "Multi-provider image gen (GPT Image 1, Stability AI SDXL, Flux via Replicate, Leonardo Phoenix). Stock search (Pexels/Pixabay/Unsplash simultaneously). 4× Real-ESRGAN upscale. Cloudinary CDN save. Freesound SFX browser. Suno music workflow. HeyGen avatar video (polls status 10s).",
    page: "/creative-studio",
    apiRoutes: ["/api/images", "/api/sounds", "/api/video/generate", "/api/video/status"],
    components: ["src/components/image-generation-studio.tsx"],
    envVars: [
      { key: "OPENAI_API_KEY", required: true },
      { key: "STABILITY_AI_KEY", required: false },
      { key: "REPLICATE_TOKEN", required: false },
      { key: "LEONARDO_API_KEY", required: false },
      { key: "PEXELS_API_KEY", required: false },
      { key: "PIXABAY_API_KEY", required: false },
      { key: "UNSPLASH_ACCESS_KEY", required: false },
      { key: "CLOUDINARY_URL", required: false },
      { key: "FREESOUND_API_KEY", required: false },
      { key: "HEYGEN_API_KEY", required: false },
    ],
    phase: "Core",
  },
  {
    id: "voice-studio",
    name: "Voice Studio",
    description: "ElevenLabs TTS (premium voices, scoped key) + Azure Speech TTS (10+ neural voices). In-browser recording → Azure Speech STT transcription. Speed control 0.5×–2.0×. Download as MP3.",
    page: "/voice-studio",
    apiRoutes: ["/api/voice/synthesize", "/api/voice/transcribe"],
    components: ["src/app/voice-studio/page.tsx"],
    envVars: [
      { key: "ELEVENLABS_GENERAL_KEY", required: false },
      { key: "AZURE_SPEECH_KEY", required: false },
      { key: "AZURE_SPEECH_REGION", required: false },
    ],
    phase: "Core",
  },
  {
    id: "review-queue",
    name: "Review Queue",
    description: "Combined research + opportunity review queue. Approve/reject/flag items. Direct task creation from queue items.",
    page: "/review-queue",
    apiRoutes: ["/api/research", "/api/opportunities"],
    components: ["src/app/review-queue/page.tsx"],
    envVars: [],
    phase: "Core",
  },
  {
    id: "tasks",
    name: "Task Board",
    description: "Task board with full status machine: open → in-progress → blocked → done → canceled. Source linking (from brief, opportunity, or manual). Full CRUD.",
    page: "/tasks",
    apiRoutes: ["/api/tasks"],
    components: ["src/app/tasks/page.tsx"],
    envVars: [],
    phase: "Core",
  },
  {
    id: "documents",
    name: "Documents",
    description: "Workspace markdown files rendered and searchable. Reads files from the server filesystem.",
    page: "/documents",
    apiRoutes: [],
    components: ["src/components/documents-list.tsx"],
    envVars: [],
    phase: "Core",
  },
  // ── AI & Automation ───────────────────────────────────────────────────────────
  {
    id: "job-runner",
    name: "Job Runner",
    description: "Background AI job dashboard. QStash → Railway worker pipeline. Supabase Realtime progress updates. Visual 6-step PassStepper. Accumulating session log. Job detail drawer.",
    page: "/jobs",
    apiRoutes: ["/api/jobs", "/api/jobs/[id]", "/api/jobs/[id]/cancel", "/api/jobs/[id]/run"],
    components: ["src/components/jobs-dashboard.tsx", "src/components/job-detail-drawer.tsx"],
    envVars: [
      { key: "QSTASH_TOKEN", required: true },
      { key: "QSTASH_CURRENT_SIGNING_KEY", required: true },
      { key: "QSTASH_NEXT_SIGNING_KEY", required: true },
      { key: "RAILWAY_WORKER_URL", required: true },
    ],
    phase: "Phase 1",
  },
  {
    id: "curriculum-factory",
    name: "Curriculum Factory",
    description: "6-pass Council of the Unserious (Gandalf → Data → Polgara → Earl → B&B → Extract JSON). CCSS-ELA/Math, NGSS, C3 Framework auto-aligned by subject. Produces SomersSchool pipeline JSON. HTML/PDF/DOCX export. Batch mode.",
    page: "/curriculum-factory",
    apiRoutes: ["/api/jobs/create"],
    components: ["src/components/curriculum-factory-form.tsx", "src/components/council-chamber-viewer.tsx"],
    envVars: [
      { key: "ANTHROPIC_API_KEY", required: true },
      { key: "OPENAI_API_KEY", required: true },
      { key: "QSTASH_TOKEN", required: true },
      { key: "RAILWAY_WORKER_URL", required: true },
    ],
    phase: "Phase 2",
  },
  {
    id: "pipelines",
    name: "Pipelines (n8n)",
    description: "n8n workflow control panel. Lists workflows, shows execution history, allows manual trigger. Proxies to Railway-hosted n8n. N8N_API_KEY never leaves the server.",
    page: "/pipelines",
    apiRoutes: ["/api/n8n/workflows", "/api/n8n/executions"],
    components: ["src/app/pipelines/page.tsx"],
    envVars: [
      { key: "N8N_BASE_URL", required: true },
      { key: "N8N_API_KEY", required: true },
    ],
    phase: "Phase 3",
  },
  {
    id: "council-chamber",
    name: "Council Chamber",
    description: "6-pass Council of the Unserious curriculum generation as a background job. Same pipeline as Curriculum Factory. Output: Scope & Sequence → Pipeline Handoff JSON (emerald card) → Earl → B&B → Working Papers → Download full session transcript.",
    page: "/council",
    apiRoutes: ["/api/jobs/create"],
    components: ["src/components/council-session-form.tsx", "src/components/council-chamber-viewer.tsx"],
    envVars: [
      { key: "ANTHROPIC_API_KEY", required: true },
      { key: "OPENAI_API_KEY", required: true },
      { key: "QSTASH_TOKEN", required: true },
      { key: "RAILWAY_WORKER_URL", required: true },
    ],
    phase: "Phase 4",
  },
  {
    id: "dreamer",
    name: "Dreamer",
    description: "Kanban seed board (Seeds → Active → Building → Shipped). Archive drawer. Earl AI review (Claude Sonnet suggests promote/dismiss/hold/merge — never auto-applies). Daily dream log. 48 seeds imported from dreamer.md.",
    page: "/dreamer",
    apiRoutes: ["/api/dreams", "/api/dreams/[id]", "/api/dreams/bulk", "/api/dreams/reorder", "/api/dreams/ai-review", "/api/dream-log"],
    components: ["src/app/dreamer/page.tsx"],
    envVars: [
      { key: "ANTHROPIC_API_KEY", required: true },
    ],
    phase: "Phase 2 (Dreamer)",
  },
  {
    id: "social-media",
    name: "Social Media Automation",
    description: "3-tab UI: Review Queue (Realtime, inline edit, datetime picker, Buffer channel selector, approve/reject, edit history), Generate (Claude Sonnet 4.6, 3 brands × 3 platforms, brand voice enforced), Accounts (Buffer GraphQL sync). Weekly cron Mon 05:00 UTC. Shopify product webhook auto-generates launch posts.",
    page: "/social",
    apiRoutes: ["/api/social/accounts", "/api/social/accounts/sync", "/api/social/posts", "/api/social/posts/[id]", "/api/social/posts/[id]/approve", "/api/social/generate", "/api/social/analytics", "/api/cron/social-weekly", "/api/webhooks/shopify-product"],
    components: ["src/components/social-review-queue.tsx"],
    envVars: [
      { key: "ANTHROPIC_API_KEY", required: true },
      { key: "BUFFER_ACCESS_TOKEN", required: true },
      { key: "SHOPIFY_WEBHOOK_SECRET", required: false },
    ],
    phase: "Phase 5",
  },
  // ── System ───────────────────────────────────────────────────────────────────
  {
    id: "settings",
    name: "Settings",
    description: "Environment status grid (all services green/yellow). Founder memory panel (add/edit/delete notes). → /settings/context = Context Brain: named document slots injected into every chat call (inject_order 1-5: copilot_instructions, dreamer, extended_context, intel, email_daily).",
    page: "/settings",
    apiRoutes: ["/api/founder-notes", "/api/context/push", "/api/context/export"],
    components: ["src/components/founder-memory-panel.tsx"],
    envVars: [],
    phase: "Core",
  },
  {
    id: "help",
    name: "Help Guide",
    description: "Static markdown guide rendered from chapterhouse-help-guide.md at request time via fs.readFileSync. Custom line-by-line markdown→HTML transform (no React Markdown dependency).",
    page: "/help",
    apiRoutes: [],
    components: ["src/app/help/page.tsx"],
    envVars: [],
    phase: "Core",
  },
  // ── Debug / Diagnostics ───────────────────────────────────────────────────────
  {
    id: "debug",
    name: "Debug Panel",
    description: "Floating debug panel (bottom-right). 4 tabs: Event Log (searchable, filterable, Ask AI → prefills chat), Performance (timing waterfall), Brain Context (calls /api/debug/context, renders Supabase brain state), App Map (this feature map with availability status).",
    page: "global overlay",
    apiRoutes: ["/api/debug", "/api/debug/context", "/api/debug/app-map"],
    components: ["src/components/debug-panel.tsx"],
    envVars: [],
    phase: "Core",
  },
];

export async function GET(request: Request) {
  // Allow Supabase cookie auth OR CRON_SECRET bearer
  const authHeader = request.headers.get("authorization");
  const hasCronAuth = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const hasCookie = request.headers.get("cookie")?.includes("sb-");
  if (!hasCronAuth && !hasCookie) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Evaluate each feature's availability based on env var presence
  const features: FeatureEntry[] = FEATURE_REGISTRY.map((f) => {
    const missingRequired: string[] = [];
    const missingOptional: string[] = [];

    for (const v of f.envVars) {
      const present = Boolean(process.env[v.key]);
      if (!present) {
        if (v.required) missingRequired.push(v.key);
        else missingOptional.push(v.key);
      }
    }

    return {
      ...f,
      available: missingRequired.length === 0,
      missingRequired,
      missingOptional,
    };
  });

  const available = features.filter((f) => f.available).length;
  const partial = features.filter((f) => !f.available && f.missingRequired.length > 0 && f.envVars.some((v) => v.required && process.env[v.key])).length;

  return Response.json(
    {
      features,
      summary: {
        total: features.length,
        available,
        partial,
        unavailable: features.length - available - partial,
        generatedAt: new Date().toISOString(),
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
