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
  Zap,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  {
    label: "Home",
    href: "/",
    description: "Chat-first command surface and daily signal overview.",
    icon: Home,
  },
  {
    label: "Daily Brief",
    href: "/daily-brief",
    description: "Morning intelligence and action queue.",
    icon: Sparkles,
  },
  {
    label: "Research",
    href: "/research",
    description: "Turn sources into verdicts, notes, and review items.",
    icon: Search,
  },
  {
    label: "Product Intelligence",
    href: "/product-intelligence",
    description: "Track opportunities, threats, and catalog signals.",
    icon: Lightbulb,
  },
  {
    label: "Content Studio",
    href: "/content-studio",
    description: "Draft, queue, and shape outbound content.",
    icon: FileText,
  },
  {
    label: "Review Queue",
    href: "/review-queue",
    description: "Approve, reject, revise, and route important items.",
    icon: ClipboardList,
  },
  {
    label: "Tasks",
    href: "/tasks",
    description: "Execution layer for approved work.",
    icon: Layers3,
  },
  {
    label: "Documents",
    href: "/documents",
    description: "Core brand memory and operating references.",
    icon: BookOpen,
  },
  {
    label: "Job Runner",
    href: "/jobs",
    description: "Background AI jobs with live progress. Fire and sleep.",
    icon: Cpu,
  },
  {
    label: "Curriculum Factory",
    href: "/curriculum-factory",
    description: "4-pass Council critique loop. 70 scope & sequences overnight.",
    icon: Zap,
  },
  {
    label: "Pipelines",
    href: "/pipelines",
    description: "Monitor and trigger n8n automation workflows.",
    icon: GitBranch,
  },
  {
    label: "Settings",
    href: "/settings",
    description: "Environment, providers, and system posture.",
    icon: Settings,
  },
];