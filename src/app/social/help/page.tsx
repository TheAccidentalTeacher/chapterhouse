"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Layers,
  Link2,
  Megaphone,
  Plus,
  RefreshCw,
  Settings2,
  Send,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import { PageFrame } from "@/components/page-frame";

/* ── Section data ──────────────────────────────────────────────── */

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const SECTIONS: Section[] = [
  {
    id: "overview",
    icon: <Megaphone size={16} />,
    title: "Overview",
    subtitle: "What the Social system does",
  },
  {
    id: "review",
    icon: <Eye size={16} />,
    title: "Review Queue",
    subtitle: "Approve, edit, and schedule posts",
  },
  {
    id: "generate",
    icon: <Sparkles size={16} />,
    title: "Generate",
    subtitle: "Create AI-powered posts",
  },
  {
    id: "accounts",
    icon: <Settings2 size={16} />,
    title: "Accounts",
    subtitle: "Buffer channels and brand mapping",
  },
  {
    id: "lifecycle",
    icon: <Layers size={16} />,
    title: "Post Lifecycle",
    subtitle: "From draft to published",
  },
  {
    id: "automation",
    icon: <Zap size={16} />,
    title: "Automation",
    subtitle: "Crons, webhooks, and batch jobs",
  },
  {
    id: "tips",
    icon: <FileText size={16} />,
    title: "Tips & FAQ",
    subtitle: "Best practices and common questions",
  },
];

/* ── Reusable UI pieces ────────────────────────────────────────── */

function Callout({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "warn" | "tip";
}) {
  const styles = {
    info: "border-[#D4A80E] bg-[#D4A80E]/5",
    warn: "border-orange-500 bg-orange-500/5",
    tip: "border-emerald-500 bg-emerald-500/5",
  };
  return (
    <div
      className={`border-l-4 rounded-r-lg px-4 py-3 text-sm leading-relaxed my-4 ${styles[variant]}`}
    >
      {children}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}
    >
      {children}
    </span>
  );
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function KeyboardKey({ children }: { children: string }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 text-[11px] font-mono rounded bg-[#1a1508] border border-[#D4A80E]/20 text-[#f0e8cc]">
      {children}
    </kbd>
  );
}

/* ── Collapsible FAQ item ──────────────────────────────────────── */

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[#f0e8cc] hover:bg-accent/5 transition text-left"
      >
        {q}
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

/* ── Flow diagram (ASCII-style) ─────────────────────────────── */

function FlowDiagram() {
  const steps = [
    { icon: <Sparkles size={14} />, label: "Generate", sub: "Claude writes posts" },
    { icon: <Eye size={14} />, label: "Review", sub: "Human gate" },
    { icon: <Send size={14} />, label: "Schedule", sub: "Buffer API" },
    { icon: <CheckCircle2 size={14} />, label: "Published", sub: "Live on platform" },
  ];
  return (
    <div className="flex flex-wrap items-start gap-2 my-6">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1 min-w-[90px]">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              {s.icon}
            </div>
            <span className="text-xs font-semibold text-[#f0e8cc]">{s.label}</span>
            <span className="text-[10px] text-muted-foreground">{s.sub}</span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={14} className="text-muted-foreground/40 mt-[-18px]" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Section content renderers ─────────────────────────────────── */

function OverviewSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        The Social Media system replaces Sintra ($49/mo) with a fully owned pipeline:
        AI-powered post generation, a human review gate, and Buffer-based scheduling —
        all wired into Chapterhouse&apos;s job runner and debug logger.
      </p>

      <FlowDiagram />

      <Callout variant="info">
        <strong>Nothing auto-publishes.</strong> Every AI-generated post must pass through the
        Review Queue before it reaches Buffer. This is a hard architectural constraint, not a
        preference.
      </Callout>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {[
          { n: "3 brands", d: "NCHO · SomersSchool · Alana Terry" },
          { n: "3 platforms", d: "Facebook · Instagram · Pinterest" },
          { n: "2 triggers", d: "Weekly cron · Shopify webhook" },
        ].map((c) => (
          <div
            key={c.n}
            className="rounded-lg border border-border/30 bg-[#1a1508]/60 p-3"
          >
            <p className="text-xs font-bold text-accent">{c.n}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{c.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        The Review Queue is the only human gate in the pipeline. Posts arrive here after AI
        generation or a Shopify webhook trigger. Each card shows the post text, brand, platform,
        and an optional image brief.
      </p>

      <h4 className="text-xs font-bold text-accent uppercase tracking-wider mt-6">
        Card Actions
      </h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
          <span>
            <strong className="text-[#f0e8cc]">Approve</strong> — pick a date/time and a Buffer
            channel, then hit Approve. The post is pushed to Buffer&apos;s scheduling queue via
            the GraphQL <code>createPost</code> mutation.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <span>
            <strong className="text-[#f0e8cc]">Reject</strong> — soft-deletes the post
            (status&nbsp;→&nbsp;<code>rejected</code>). The row stays in the database for
            analytics.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <FileText size={14} className="text-sky-400 mt-0.5 shrink-0" />
          <span>
            <strong className="text-[#f0e8cc]">Edit inline</strong> — click the post text to
            edit. Previous versions are saved to <code>edit_history</code> JSONB so you can see
            what the AI originally wrote.
          </span>
        </li>
      </ul>

      <Callout variant="tip">
        You can filter posts by status (<em>pending</em>, <em>approved</em>, <em>rejected</em>,
        etc.) using the dropdown at the top of the queue.
      </Callout>

      <h4 className="text-xs font-bold text-accent uppercase tracking-wider mt-6">
        Image Brief
      </h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Every generated post includes an <strong>image brief</strong> — an AI-written
        description of the ideal accompanying image. Toggle it open with the image button on
        each card. Use the brief as a prompt in Creative Studio or as direction for a designer.
      </p>
    </div>
  );
}

function GenerateSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        The Generate panel sends a request to Claude Sonnet 4.6 with brand-specific voice rules.
        You choose brands, platforms, count, and optionally a topic seed. Generated posts land
        directly in the Review Queue.
      </p>

      <h4 className="text-xs font-bold text-accent uppercase tracking-wider mt-6">
        Configuration
      </h4>
      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <Layers size={14} className="text-accent mt-0.5 shrink-0" />
          <span>
            <strong className="text-[#f0e8cc]">Brands</strong> — Select one or more:
            NCHO, SomersSchool, Alana Terry.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Link2 size={14} className="text-accent mt-0.5 shrink-0" />
          <span>
            <strong className="text-[#f0e8cc]">Platforms</strong> — Facebook, Instagram,
            Pinterest. Each platform gets format-specific rules in the system prompt.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Plus size={14} className="text-accent mt-0.5 shrink-0" />
          <span>
            <strong className="text-[#f0e8cc]">Posts per combo</strong> — The stepper controls
            how many posts are generated per brand × platform combination. Default is 2.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="text-accent mt-0.5 shrink-0" />
          <span>
            <strong className="text-[#f0e8cc]">Topic seed</strong> — Optional free-text prompt
            or one of the suggestion chips. Guides Claude toward a specific angle. Leave blank
            for an evergreen post.
          </span>
        </div>
      </div>

      <Callout variant="info">
        Brand voice rules are stored in the <code>brand_voices</code> Supabase table —
        editable from Settings without a code deploy. Each brand has its own voice, forbidden
        words, and platform hints.
      </Callout>

      <h4 className="text-xs font-bold text-accent uppercase tracking-wider mt-6">
        Brand Voice Quick Reference
      </h4>
      <div className="rounded-lg border border-border/30 overflow-hidden text-xs">
        <table className="w-full">
          <thead>
            <tr className="bg-[#1a1508]/80 text-[#f0e8cc]">
              <th className="text-left px-3 py-2 font-semibold">Brand</th>
              <th className="text-left px-3 py-2 font-semibold">Voice</th>
              <th className="text-left px-3 py-2 font-semibold">Key Rules</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground divide-y divide-border/20">
            <tr>
              <td className="px-3 py-2 font-medium text-[#f0e8cc]">NCHO</td>
              <td className="px-3 py-2">Warm, teacher-curated</td>
              <td className="px-3 py-2">&quot;Your child&quot; not &quot;your student.&quot; No: explore, journey, leverage</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium text-[#f0e8cc]">SomersSchool</td>
              <td className="px-3 py-2">Confident, secular</td>
              <td className="px-3 py-2">Zero faith language. Lead with visible progress.</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium text-[#f0e8cc]">Alana Terry</td>
              <td className="px-3 py-2">Personal, faith-forward</td>
              <td className="px-3 py-2">Written as Anna. Community, not audience.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        The Accounts tab maps Buffer channels to brand + platform combinations. One channel per
        combo (e.g., NCHO → Facebook → a specific Buffer channel ID). Posts are routed to the
        correct channel on approval.
      </p>

      <h4 className="text-xs font-bold text-accent uppercase tracking-wider mt-6">
        Setup Steps
      </h4>
      <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
        <li>
          <strong className="text-[#f0e8cc]">Connect in Buffer</strong> — Log into
          Buffer and connect your social accounts (Facebook page, Instagram business, Pinterest).
        </li>
        <li>
          <strong className="text-[#f0e8cc]">Sync from Buffer</strong> — Click the Sync button
          in Chapterhouse. This fetches your Buffer organization and all connected channels via
          GraphQL.
        </li>
        <li>
          <strong className="text-[#f0e8cc]">Map channels</strong> — Use the Add Channel form
          to pair each Buffer channel with a brand and platform combination.
        </li>
        <li>
          <strong className="text-[#f0e8cc]">Done</strong> — The Review Queue dropdown
          automatically shows only the mapped channels for each platform.
        </li>
      </ol>

      <Callout variant="warn">
        <strong>Buffer Essentials plan</strong> supports 6 channel slots. Current allocation:
        NCHO (FB + IG + Pinterest) and SomersSchool (FB + IG + Pinterest). LinkedIn dropped
        from active roster.
      </Callout>

      <h4 className="text-xs font-bold text-accent uppercase tracking-wider mt-6">
        Environment Variables
      </h4>
      <div className="rounded-lg border border-border/30 bg-[#1a1508]/50 px-4 py-3 text-xs font-mono text-muted-foreground space-y-1">
        <p>BUFFER_ACCESS_TOKEN — Bearer token for Buffer GraphQL API</p>
        <p>SHOPIFY_WEBHOOK_SECRET — HMAC verification for product webhooks</p>
      </div>
    </div>
  );
}

function LifecycleSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Every post follows a strict status machine. No state can be skipped.
      </p>

      <div className="flex flex-wrap gap-2 mt-2">
        {[
          { label: "pending_review", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
          { label: "approved", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
          { label: "scheduled", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
          { label: "published", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
          { label: "rejected", color: "bg-red-500/20 text-red-400 border-red-500/30" },
          { label: "failed", color: "bg-red-500/20 text-red-400 border-red-500/30" },
        ].map((s) => (
          <Badge key={s.label} color={`border ${s.color}`}>
            {s.label}
          </Badge>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border/30 bg-[#1a1508]/40 p-4 text-xs text-muted-foreground space-y-2">
        <p>
          <StatusDot color="bg-amber-400" label="pending_review" /> — AI-generated, awaiting
          human review.
        </p>
        <p>
          <StatusDot color="bg-sky-400" label="approved" /> — Approved, date/channel assigned.
          Pushed to Buffer immediately.
        </p>
        <p>
          <StatusDot color="bg-indigo-400" label="scheduled" /> — Buffer accepted the post and
          will publish at the scheduled time.
        </p>
        <p>
          <StatusDot color="bg-emerald-400" label="published" /> — Live on the platform.
          Analytics pull-back begins.
        </p>
        <p>
          <StatusDot color="bg-red-400" label="rejected" /> — Soft-deleted. Stays in DB for
          analytics but never publishes.
        </p>
        <p>
          <StatusDot color="bg-red-400" label="failed" /> — Buffer returned an error.
          Check logs.
        </p>
      </div>

      <Callout variant="tip">
        Every manual edit (text or hashtags) is appended to the <code>edit_history</code>&nbsp;
        JSONB array on the <code>social_posts</code> row. You always have a full audit trail.
      </Callout>
    </div>
  );
}

function AutomationSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Two automated triggers generate posts without manual action. Both land in the Review
        Queue — nothing auto-publishes.
      </p>

      <h4 className="text-xs font-bold text-accent uppercase tracking-wider mt-6">
        Weekly Cron
      </h4>
      <div className="rounded-lg border border-border/30 bg-[#1a1508]/50 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
        <Clock size={16} className="text-accent mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-[#f0e8cc]">Monday 05:00 UTC (Sunday 9 PM Alaska)</p>
          <p className="mt-1">
            Vercel cron → <code>/api/cron/social-weekly</code> → creates a{" "}
            <code>social_batch</code> job → QStash → Railway worker → calls{" "}
            <code>/api/social/generate</code> with 3 brands × 3 platforms × 2 each = 18 posts.
          </p>
        </div>
      </div>

      <h4 className="text-xs font-bold text-accent uppercase tracking-wider mt-6">
        Shopify Product Webhook
      </h4>
      <div className="rounded-lg border border-border/30 bg-[#1a1508]/50 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
        <Zap size={16} className="text-accent mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-[#f0e8cc]">Triggered when Anna adds a product</p>
          <p className="mt-1">
            Shopify fires <code>products/create</code> → HMAC-verified by{" "}
            <code>/api/webhooks/shopify-product</code> → auto-generates NCHO launch posts for
            Facebook + Instagram.
          </p>
        </div>
      </div>

      <h4 className="text-xs font-bold text-accent uppercase tracking-wider mt-6">
        Analytics Pull-back
      </h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <code>POST /api/social/analytics</code> iterates published posts, queries Buffer
        GraphQL for engagement stats (reach, clicks, likes, comments, shares), and stores them
        in the <code>buffer_stats</code> JSONB column. Over time this feeds the autoresearch
        loop.
      </p>
    </div>
  );
}

function TipsSection() {
  return (
    <div className="space-y-3">
      <FaqItem
        q="How do I change a brand's voice without a deploy?"
        a={
          <p>
            Go to <strong>Settings → Brand Voices</strong>. Each brand has an editable textarea
            stored in the <code>brand_voices</code> Supabase table. Changes apply immediately
            to the next generation.
          </p>
        }
      />
      <FaqItem
        q="What happens if Buffer rejects a post?"
        a={
          <p>
            The post status moves to <code>failed</code>. Check the debug log (pill in the
            bottom-right corner) — the Buffer API error message is logged with full detail.
            Common causes: expired token, channel disconnected, or platform-specific content
            policy.
          </p>
        }
      />
      <FaqItem
        q="Can I regenerate a single rejected post?"
        a={
          <p>
            Not yet as a one-click action. Use the Generate tab with a specific topic seed to
            create a replacement, then reject the old one. Single-post regeneration is on the
            roadmap.
          </p>
        }
      />
      <FaqItem
        q="How do I add a new platform?"
        a={
          <p>
            A DB migration is needed to add the platform to the <code>CHECK</code> constraint on
            both <code>social_accounts</code> and <code>social_posts</code>. Then connect the
            channel in Buffer, Sync, and Map. The Generate route&apos;s Zod schema and platform
            rules also need updating.
          </p>
        }
      />
      <FaqItem
        q="How do edit histories work?"
        a={
          <p>
            Every time you save an inline edit on a Review Queue card, the previous version
            (text + hashtags + timestamp) is appended to the <code>edit_history</code> JSONB
            array. This is append-only — you can always trace back to the AI&apos;s original
            output.
          </p>
        }
      />
      <FaqItem
        q="What's the cost per generation batch?"
        a={
          <p>
            A full 18-post batch (3 brands × 3 platforms × 2 posts) costs approximately
            $0.03–0.05 in Claude Sonnet tokens. The weekly cron generates one batch per week,
            so monthly cost is roughly $0.12–0.20.
          </p>
        }
      />
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */

export default function SocialHelpPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const sectionContent: Record<string, React.ReactNode> = {
    overview: <OverviewSection />,
    review: <ReviewSection />,
    generate: <GenerateSection />,
    accounts: <AccountsSection />,
    lifecycle: <LifecycleSection />,
    automation: <AutomationSection />,
    tips: <TipsSection />,
  };

  return (
    <PageFrame
      title="Social Media — Help"
      description="How the review queue, generation engine, and Buffer pipeline work."
      actions={
        <Link
          href="/social"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition"
        >
          <ArrowLeft size={13} />
          Back to Social
        </Link>
      }
    >
      <div className="flex gap-6 min-h-[calc(100vh-160px)]">
        {/* ── Sidebar ──────────────────────────────────── */}
        <nav className="w-56 shrink-0 space-y-1 sticky top-4 self-start hidden md:block">
          {SECTIONS.map((s) => {
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition text-sm ${
                  active
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-muted-foreground hover:text-[#f0e8cc] hover:bg-[#1a1508]/50"
                }`}
              >
                <span className={`mt-0.5 ${active ? "text-accent" : "text-muted-foreground/60"}`}>
                  {s.icon}
                </span>
                <span>
                  <span className="block font-medium leading-tight">{s.title}</span>
                  <span className="block text-[11px] text-muted-foreground/70 leading-tight mt-0.5">
                    {s.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* ── Mobile nav ───────────────────────────────── */}
        <div className="md:hidden w-full mb-4">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className="w-full rounded-lg border border-border/30 bg-[#1a1508] text-sm text-[#f0e8cc] px-3 py-2"
          >
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} — {s.subtitle}
              </option>
            ))}
          </select>
        </div>

        {/* ── Content ──────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-[#D4A80E] mb-1">
              {SECTIONS.find((s) => s.id === activeSection)?.title}
            </h2>
            <p className="text-xs text-muted-foreground/60 mb-5">
              {SECTIONS.find((s) => s.id === activeSection)?.subtitle}
            </p>
            {sectionContent[activeSection]}
          </div>
        </main>
      </div>
    </PageFrame>
  );
}
