import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  Cpu,
  FileText,
  GitBranch,
  Home,
  Layers3,
  Lightbulb,
  Mail,
  Palette,
  Search,
  Send,
  Settings,
  Sparkles,
  Users,
  Volume2,
  Youtube,
  Zap,
} from "lucide-react";

export type TooltipContent = {
  summary: string;
  features: string[];
  tips: string[];
};

export type NavigationItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  tooltip: TooltipContent;
  status: "live" | "partial" | "planned";
};

export type NavigationGroup = {
  id: string;
  label: string;
  items: NavigationItem[];
  defaultOpen?: boolean;
};

export const navigationGroups: NavigationGroup[] = [
  {
    id: "command",
    label: "Command Center",
    defaultOpen: true,
    items: [
      {
        label: "Home",
        href: "/",
        description: "Chat-first command surface and daily signal overview.",
        icon: Home,
        tooltip: {
          summary: "Your primary chat interface and command surface. Talk to one AI model in Solo mode, or toggle Council mode to get multi-member Council of the Unserious responses with a rebuttal round. Every conversation is enriched with your daily brief, saved research, open opportunities, and founder memory.",
          features: [
            "Solo mode: single AI response (GPT-5.4, Claude Opus/Sonnet, GPT-5-mini)",
            "Council mode: Gandalf, Data, Polgara (+ Earl, Beavis & Butthead on complex queries) respond via SSE streaming",
            "Rebuttal round: members respond to each other after initial pass",
            "Persistent threads with pin, rename, and delete",
            "/remember command to save facts permanently to founder memory",
            "Auto-learn extracts key facts from conversations",
          ],
          tips: [
            "Test Council mode with a complex question — look for colored avatar bubbles and the rebuttal divider",
            "Try /remember followed by any fact — verify it appears in Settings → Founder Memory",
            "Switch models mid-conversation via the dropdown to compare responses",
          ],
        },
        status: "live",
      },
      {
        label: "Daily Brief",
        href: "/daily-brief",
        description: "Morning intelligence and action queue.",
        icon: Sparkles,
        tooltip: {
          summary: "Auto-generated morning intelligence brief compiled from 9 RSS feeds (education, homeschool, edtech) and 11 GitHub repos you follow. Claude Sonnet 4.6 reads all sources, scores relevance, and writes a prioritized summary. Runs on a Vercel cron at 3:00 UTC (7:00 AM Alaska).",
          features: [
            "Automatic daily generation via cron — no button press needed",
            "Manual generation with optional focus area to steer attention",
            "Each item: headline, relevance score, and recommended action",
            "Convert any item to a Task or send to Review Queue",
            "Knowledge summaries from past research injected for context",
            "Manual write mode for custom briefs",
          ],
          tips: [
            "Check the brief page after 7 AM Alaska time to verify the cron fired",
            "Try Generate Brief with a focus like 'Alaska homeschool allotments' to test steering",
            "Convert an item to a task and verify it lands on the Tasks page",
          ],
        },
        status: "live",
      },
      {
        label: "Inbox",
        href: "/inbox",
        description: "Email client for scott@nextchapterhomeschool.com.",
        icon: Mail,
        tooltip: {
          summary: "Full email client connected to scott@nextchapterhomeschool.com via IMAP/SMTP. Read messages, compose new emails, and reply with proper threading — all without leaving Chapterhouse.",
          features: [
            "Two-panel layout: message list + viewer",
            "HTML and plain-text email rendering",
            "Reply with In-Reply-To and References headers for proper threading",
            "Compose new messages",
            "Unread indicator and attachment detection",
            "Pagination for large inboxes",
          ],
          tips: [
            "Click any message to open it — it's automatically marked as read",
            "Hit Reply to send a threaded reply with full headers",
            "Use the compose button (pencil icon) to write a new message",
          ],
        },
        status: "live",
      },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    defaultOpen: true,
    items: [
      {
        label: "Research",
        href: "/research",
        description: "Turn sources into verdicts, notes, and review items.",
        icon: Search,
        tooltip: {
          summary: "Your intelligence intake system. Feed it URLs, pasted text, quick notes, or screenshots and the AI extracts key findings, writes a verdict, and tags everything for your knowledge base. Saved items automatically enrich chat context and opportunity analysis. Deep Research mode fires parallel searches across Tavily, Google (SerpAPI), Reddit, NewsAPI, and Internet Archive simultaneously.",
          features: [
            "URL tab: paste a web address — AI fetches, reads, and summarizes with verdict",
            "Paste text tab: copy-paste articles, emails, or Slack messages for analysis",
            "Quick note tab: jot observations with AI-generated context",
            "Screenshot tab: drag-and-drop images for GPT Vision analysis",
            "Auto-research tab: topic → Tavily search → GPT-5.4 analysis → auto-ingest",
            "Deep Research tab: multi-source parallel search with AI synthesis (quick/standard/deep)",
            "Condense knowledge: compress tagged research into summaries",
            "SSRF protection on URL fetching — can't hit internal networks",
          ],
          tips: [
            "Test URL ingest with a real education news article — check the generated tags and verdict",
            "Try a screenshot of a competitor's site — verify GPT Vision reads and analyzes it",
            "After saving 3+ items, check that Chat knows about them (ask 'what's in my research?')",
          ],
        },
        status: "live",
      },
      {
        label: "YouTube Intelligence",
        href: "/youtube",
        description: "Turn any YouTube video into curriculum materials.",
        icon: Youtube,
        tooltip: {
          summary: "Paste any YouTube URL and get a full transcript via captions, Gemini AI, or Whisper STT. Then generate quizzes, lesson plans, vocabulary lists, discussion questions, DOK projects, graphic organizers, and guided notes — all grade-appropriate. Batch multiple videos for cross-video materials like combined quizzes and master vocabulary.",
          features: [
            "3-tier transcript fallback: captions → Gemini AI → Whisper STT",
            "8 curriculum tools: quiz, lesson plan, vocabulary, discussion, DOK project, graphic organizer, guided notes, full analysis",
            "YouTube search built in — find videos without leaving Chapterhouse",
            "Batch mode: queue up to 20 videos for cross-video materials",
            "Grade level selector (1–12) for age-appropriate output",
            "Save videos to Research for chat context enrichment",
            "Copy and download all generated content as Markdown",
          ],
          tips: [
            "Try a history or science video — paste the URL and check which transcript source it uses",
            "Generate a quiz and a lesson plan from the same video to see the range",
            "Add 3+ videos to batch mode and generate a unit study guide",
            "Save a video to Research, then ask Chat about it — it should know the content",
          ],
        },
        status: "live",
      },
      {
        label: "Product Intelligence",
        href: "/product-intelligence",
        description: "Track opportunities, threats, and catalog signals.",
        icon: Lightbulb,
        tooltip: {
          summary: "AI-powered opportunity radar. Run an analysis and GPT-5.4 scans all your research and briefs, then surfaces scored opportunity cards. Each card rates relevance across three dimensions: Store (NCHO Shopify), Curriculum (SomerSchool), and Content (marketing).",
          features: [
            "One-click opportunity analysis across all saved research and briefs",
            "Triple-scored cards: Store / Curriculum / Content (A+ to C grades)",
            "Supporting evidence and recommended next action per opportunity",
            "Status tracking: mark as In Progress, Done, or Passed",
            "Category filter to focus on Store, Curriculum, or Content signals",
            "Cards auto-populate the Review Queue for decision-making",
          ],
          tips: [
            "Save 5+ research items first — more data gives better opportunity signals",
            "Run analysis, then check Review Queue to see if opportunities appeared",
            "Filter by category and verify scores make sense for NCHO vs SomerSchool",
          ],
        },
        status: "live",
      },
    ],
  },
  {
    id: "production",
    label: "Production",
    defaultOpen: false,
    items: [
      {
        label: "Content Studio",
        href: "/content-studio",
        description: "Draft, queue, and shape outbound content.",
        icon: FileText,
        tooltip: {
          summary: "AI writing assistant that generates brand-voiced content using Claude Sonnet 4.6. Three production modes for the content types you create most. Output copies to clipboard for pasting into Shopify, email platforms, Google Docs, or anywhere else.",
          features: [
            "Newsletter/Campaign mode: topic or hook → polished email newsletter or campaign brief",
            "Curriculum Guide mode: book title + author → discussion questions, unit study, activity sets by grade range",
            "Product Description mode: product name → Shopify-ready headline, body, bullets, meta description",
            "Copy-to-clipboard output for instant use anywhere",
            "All content generated in your brand voice and tone",
          ],
          tips: [
            "Test each of the three modes — verify output quality and formatting",
            "Try Curriculum Guide with a public domain book title like 'Treasure Island'",
            "Paste a Product Description into your Shopify staging store to see how it renders",
          ],
        },
        status: "live",
      },
      {
        label: "Creative Studio",
        href: "/creative-studio",
        description: "AI image generation, stock search, sound effects, video, and media management.",
        icon: Palette,
        tooltip: {
          summary: "Multi-provider AI image generation studio with integrated stock photography search, sound effects browser, and HeyGen avatar video generation. Generate images using GPT Image 1, Stability AI (SDXL), Flux via Replicate, or Leonardo.ai (Phoenix for Gimli consistency). Search free stock photos across Pexels, Pixabay, and Unsplash simultaneously. Upscale any image 4× with Real-ESRGAN and save to Cloudinary CDN. Browse CC-licensed sound effects from Freesound. Generate avatar videos with HeyGen.",
          features: [
            "4 AI providers: GPT Image 1, Stability AI, Flux (Replicate), Leonardo.ai",
            "Size presets: square, landscape, portrait, wide",
            "Negative prompt support for Stability AI",
            "3 stock sources: Pexels, Pixabay, Unsplash — searched simultaneously",
            "4× upscale via Real-ESRGAN on Replicate",
            "One-click save to Cloudinary CDN",
            "Freesound sound effects search with license and duration filters",
            "In-browser audio preview for sound effects",
            "Suno AI music generation workflow guide",
            "HeyGen avatar video generation with polling status",
            "Generation history preserved in session",
          ],
          tips: [
            "Use GPT Image 1 for scenes with text — it handles text-in-images better than other providers",
            "Leonardo Phoenix is best for character consistency — use it for Gimli illustrations",
            "Test each provider with the same prompt to compare styles and quality",
            "Upscale a generated image before saving to Cloudinary for maximum resolution",
            "Use CC0 filter in Sound Browser for completely attribution-free sounds",
            "HeyGen videos take 1-5 minutes to render — status auto-polls every 10 seconds",
          ],
        },
        status: "live",
      },
      {
        label: "Voice Studio",
        href: "/voice-studio",
        description: "Text-to-speech and speech-to-text for content workflows.",
        icon: Volume2,
        tooltip: {
          summary: "Dual-engine voice studio for curriculum narration and content transcription. Generate audio with ElevenLabs (premium voices, Gimli clone-ready) or Azure Speech (free tier, 10+ voices). Record and transcribe speech for content writing workflows.",
          features: [
            "ElevenLabs TTS: premium voices with adjustable speed and stability",
            "Azure Speech TTS: free tier with 10+ neural voices across languages",
            "Speed control: 0.5× to 2.0× playback rate",
            "In-browser audio recording for speech-to-text",
            "Azure Speech STT transcription with language detection",
            "Copy transcription or use directly as TTS input",
            "Download generated audio as MP3",
          ],
          tips: [
            "Use Azure Speech (free tier) for testing and drafts — switch to ElevenLabs for final production audio",
            "Record a quick note and use 'Use as TTS Input' to hear it in a different voice",
            "ElevenLabs voices are scoped-key protected — set ELEVENLABS_CURRICULUM_KEY for production use",
          ],
        },
        status: "live",
      },
      {
        label: "Review Queue",
        href: "/review-queue",
        description: "Approve, reject, revise, and route important items.",
        icon: ClipboardList,
        tooltip: {
          summary: "Decision-making holding pen where research items and opportunities wait for your verdict before moving forward. This is your inbox for things that need a human decision — approve, reject, or route them. When the queue is empty, you're caught up.",
          features: [
            "Dual-feed: pulls from both Research items and Product Intelligence opportunities",
            "Save or Reject research items with one click",
            "Create Task directly from any opportunity card",
            "Mark opportunities as In Progress or Pass",
            "Queue-clear indicator when nothing needs attention",
            "Items auto-arrive from Daily Brief ('Send to review') and Product Intelligence",
          ],
          tips: [
            "Add a research item and mark it for review — verify it shows up here",
            "Run a Product Intelligence analysis — check that new opportunities appear in the queue",
            "Create a task from a queued opportunity — confirm it shows on the Tasks page",
          ],
        },
        status: "live",
      },
      {
        label: "Tasks",
        href: "/tasks",
        description: "Execution layer for approved work.",
        icon: Layers3,
        tooltip: {
          summary: "Your to-do list with full status tracking and source linking. Tasks are created manually, from Daily Brief items, or from Review Queue opportunities. Each task shows where it came from so you always have context on why it exists.",
          features: [
            "Full CRUD: create, edit, delete tasks",
            "Status machine: Open → In Progress → Blocked → Done → Canceled",
            "Source linking shows origin (brief, opportunity, or manual)",
            "Tasks created from brief items or opportunities auto-link to their source",
            "Filter and sort by status",
          ],
          tips: [
            "Create a manual task and walk it through all status transitions",
            "Convert a Daily Brief item to a task — verify the source link is preserved",
            "Test the Blocked status — it should visually distinguish from In Progress",
          ],
        },
        status: "live",
      },
      {
        label: "Documents",
        href: "/documents",
        description: "Core brand memory and operating references.",
        icon: BookOpen,
        tooltip: {
          summary: "Library of all markdown files in the Chapterhouse workspace plus uploaded documents. Upload PDFs, DOCX, ePub, or text files for AI-powered extraction and analysis using Claude's 1M token context — no chunking needed. Brand documents, strategy guides, customer avatar, and operating references all searchable from the top bar.",
          features: [
            "Auto-reads all .md files from the repo root and renders them",
            "Upload zone: drag-and-drop PDF, DOCX, ePub, TXT, MD files (up to 50MB)",
            "Azure AI Document Intelligence for PDF extraction (layout-aware, tables)",
            "8 analysis types: summary, key findings, curriculum map, chapter outline, vocabulary, discussion guide, critique, full analysis",
            "Top-bar search integration — search documents from any page",
            "Card-based layout with expand/collapse per document",
          ],
          tips: [
            "Use the top search bar to search for 'avatar' — verify it filters documents",
            "Check that this help guide appears in the documents list",
            "Verify all markdown files from the workspace root render without errors",
          ],
        },
        status: "live",
      },
    ],
  },
  {
    id: "automation",
    label: "AI & Automation",
    defaultOpen: false,
    items: [
      {
        label: "Job Runner",
        href: "/jobs",
        description: "Background AI jobs with live progress. Fire and sleep.",
        icon: Cpu,
        tooltip: {
          summary: "Dashboard for background AI jobs that run on Railway workers while you sleep. Jobs are queued via QStash, processed asynchronously, and report progress in real time via Supabase Realtime — no page refresh needed. View, create, cancel, and re-run jobs from one place.",
          features: [
            "Create new background AI jobs (curriculum generation, research batches, council sessions)",
            "Live progress bars update in real time via Supabase Realtime subscription",
            "Status tracking: queued → running → completed / failed / cancelled",
            "Click any job to see full output, error details, and timing",
            "Cancel running jobs, re-run completed ones",
            "Export job output as Markdown",
          ],
          tips: [
            "Create a test job and watch the progress bar update without refreshing the page",
            "Open Supabase Studio and manually update a job's progress — verify the UI reflects it instantly",
            "Test the cancel flow: create a job, then cancel it before it completes",
          ],
        },
        status: "live",
      },
      {
        label: "Curriculum Factory",
        href: "/curriculum-factory",
        description: "5-pass Council of the Unserious critique loop. 70 scope & sequences overnight.",
        icon: Zap,
        tooltip: {
          summary: "Generate complete curriculum scope & sequences using the 5-pass Council of the Unserious. Gandalf drafts, Data audits, Polgara finalizes, Earl assesses operations, Beavis & Butthead stress-test engagement. Supports single-course generation or batch mode for up to 70 courses overnight.",
          features: [
            "5-pass pipeline: Gandalf → Data → Polgara → Earl → Beavis & Butthead",
            "Single generation: pick subject, grade (5-12), duration, and optional standards",
            "Batch mode: select multiple subjects × grade ranges for mass generation",
            "Output viewer renders final scope & sequence as Markdown",
            "Earl's operational assessment + Beavis & Butthead's engagement report",
            "Download as .md or copy to clipboard",
          ],
          tips: [
            "Start with a single generation (e.g., 'US History, Grade 7, Full Year') to test the pipeline",
            "Check Earl's ops assessment and Beavis & Butthead's engagement verdicts",
            "In batch mode, verify parent/child job tracking on the Job Runner page",
          ],
        },
        status: "live",
      },
      {
        label: "Pipelines",
        href: "/pipelines",
        description: "Monitor and trigger n8n automation workflows.",
        icon: GitBranch,
        tooltip: {
          summary: "Control panel for n8n automation workflows running on Railway. View workflow status, trigger manual runs, and check execution history. This is a proxy layer — the n8n API key stays server-side and never reaches the browser. Requires n8n to be deployed and the API key configured.",
          features: [
            "List all n8n workflows with active/inactive status",
            "One-click manual trigger for any workflow",
            "Execution history: last run timestamp, success/failure status",
            "Auto-refresh every 30 seconds for live monitoring",
            "Activate/deactivate workflows without opening the n8n UI",
            "Server-side proxy strips API key from client exposure",
          ],
          tips: [
            "Verify the N8N_API_KEY and N8N_BASE_URL environment variables are set in Vercel",
            "If no workflows appear, check that n8n is running on Railway and the API key is correct",
            "Trigger a test workflow and confirm the execution appears in the history",
          ],
        },
        status: "partial",
      },
      {
        label: "Council Chamber",
        href: "/council",
        description: "5-agent agentic system for curriculum generation.",
        icon: Users,
        tooltip: {
          summary: "Purpose-built curriculum generator that runs all 5 Council of the Unserious members as a background job. Unlike Council Mode in Chat (which is real-time and general-purpose), the Council Chamber is specifically designed for producing complete scope & sequence documents and runs asynchronously.",
          features: [
            "5 Council members: Gandalf, Data, Polgara, Earl, Beavis & Butthead",
            "Runs as a background job — submit and check results later",
            "Select subject, grade level, and duration",
            "Full scope & sequence output with all 5 perspectives",
            "Job progress visible on the Job Runner page",
            "Designed for long-running, thorough curriculum analysis",
          ],
          tips: [
            "Submit a curriculum request and then navigate to Job Runner to watch it process",
            "Compare Council Chamber output with Curriculum Factory output for the same subject",
            "Test with a niche subject like 'Alaska Native History, Grade 6' to evaluate depth",
          ],
        },
        status: "live",
      },
      {
        label: "Social Media",
        href: "/social",
        description: "Generate, review, and schedule posts across all three brands.",
        icon: Send,
        tooltip: {
          summary: "AI-powered social media automation. Claude generates posts for NCHO, SomersSchool, and Alana Terry across Facebook, Instagram, and LinkedIn. Posts land in a review queue — nothing publishes without your approval. Approved posts push directly to Buffer for scheduling.",
          features: [
            "Generate a week of posts for all brands in one click",
            "Review queue: approve, edit, or reject each post individually",
            "One-click push to Buffer → scheduled on your connected channels",
            "Shopify webhook: new NCHO product triggers automatic post generation",
            "Weekly cron auto-generates a fresh batch every Monday at 5am UTC",
            "Analytics sync: pull Buffer engagement stats back into Chapterhouse",
          ],
          tips: [
            "Set up Buffer accounts first (Accounts tab) before approving any posts",
            "Use topic seed for product launches — e.g. 'new product: Saxon Math 5/4'",
            "Generated posts include an image brief — use that with Image Generation Studio",
          ],
        },
        status: "live",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    defaultOpen: false,
    items: [
      {
        label: "Settings",
        href: "/settings",
        description: "Environment, providers, and system posture.",
        icon: Settings,
        tooltip: {
          summary: "System configuration and your founder memory manager. Two sections: Environment Status shows green/yellow dots for every required service connection (API keys, database URLs). Founder Memory is a list of facts the AI always knows about you, injected into every chat conversation.",
          features: [
            "Environment status: live check of all required API keys and service connections",
            "Green dot = configured, yellow = missing — instantly see what's broken",
            "Founder Memory CRUD: add, edit, or delete facts the AI should always know",
            "Category picker for organizing founder memory facts",
            "Facts added here are injected into every chat conversation automatically",
            "Same facts accessible via /remember command in Chat",
          ],
          tips: [
            "Check all green dots after a new deployment to verify env vars propagated",
            "Add a test fact via Founder Memory, then go to Chat and verify the AI knows it",
            "Look for any yellow dots — those indicate services that aren't configured on Vercel",
          ],
        },
        status: "partial",
      },
    ],
  },
];

// Flat list for backward compatibility
export const navigationItems: NavigationItem[] = navigationGroups.flatMap((g) => g.items);