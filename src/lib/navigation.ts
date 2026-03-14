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
  Search,
  Settings,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  tooltip: string;
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
        tooltip: "Your main chat interface. Toggle Solo/Council mode to get Fellowship input on any question. Threads auto-save.",
        status: "live",
      },
      {
        label: "Daily Brief",
        href: "/daily-brief",
        description: "Morning intelligence and action queue.",
        icon: Sparkles,
        tooltip: "Auto-generated daily brief from RSS feeds and GitHub activity. Runs on a cron at 3:00 UTC. Read it with coffee.",
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
        tooltip: "Ingest URLs, paste text, or attach screenshots. AI extracts key findings, tags them, and builds your knowledge base.",
        status: "live",
      },
      {
        label: "Product Intelligence",
        href: "/product-intelligence",
        description: "Track opportunities, threats, and catalog signals.",
        icon: Lightbulb,
        tooltip: "Scored opportunity cards (A+/A/B). Track competitive threats, market signals, and catalog gaps for NCHO and SomerSchool.",
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
        tooltip: "Generate newsletters, curriculum guides, and product descriptions using Claude. Three modes, copy-to-clipboard output.",
        status: "live",
      },
      {
        label: "Review Queue",
        href: "/review-queue",
        description: "Approve, reject, revise, and route important items.",
        icon: ClipboardList,
        tooltip: "Combined queue of research items and opportunities awaiting your verdict. Approve, reject, or flag for follow-up.",
        status: "live",
      },
      {
        label: "Tasks",
        href: "/tasks",
        description: "Execution layer for approved work.",
        icon: Layers3,
        tooltip: "Task board with status tracking (open, in-progress, blocked, done, canceled). Create tasks from any approved item.",
        status: "live",
      },
      {
        label: "Documents",
        href: "/documents",
        description: "Core brand memory and operating references.",
        icon: BookOpen,
        tooltip: "Your workspace markdown files — persona, brand guide, customer avatar, copilot instructions. Searchable from the top bar.",
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
        tooltip: "Submit jobs to QStash → Railway workers. Watch progress in real time via Supabase Realtime. Check results in the morning.",
        status: "live",
      },
      {
        label: "Curriculum Factory",
        href: "/curriculum-factory",
        description: "4-pass Council critique loop. 70 scope & sequences overnight.",
        icon: Zap,
        tooltip: "Generate curriculum scope & sequences. Gandalf drafts → Legolas critiques → Aragorn finalizes → Gimli stress-tests. Batch 70 at once.",
        status: "live",
      },
      {
        label: "Pipelines",
        href: "/pipelines",
        description: "Monitor and trigger n8n automation workflows.",
        icon: GitBranch,
        tooltip: "Control panel for n8n workflows running on Railway. View status, trigger runs, check execution history. Requires n8n API key.",
        status: "partial",
      },
      {
        label: "Council Chamber",
        href: "/council",
        description: "5-agent agentic system for curriculum generation.",
        icon: Users,
        tooltip: "Purpose-built curriculum generator. Select subject, grade, duration → 5 Council members produce a complete scope & sequence as a background job.",
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
        tooltip: "View environment variable status, AI provider configuration, and founder memory. Check what's connected and what's missing.",
        status: "partial",
      },
    ],
  },
];

// Flat list for backward compatibility
export const navigationItems: NavigationItem[] = navigationGroups.flatMap((g) => g.items);