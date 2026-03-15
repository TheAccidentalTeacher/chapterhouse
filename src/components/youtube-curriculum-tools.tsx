"use client";

import { useState } from "react";
import {
  FileQuestion,
  BookOpen,
  List,
  MessageCircle,
  Target,
  LayoutGrid,
  StickyNote,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ToolDef = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const TOOLS: ToolDef[] = [
  {
    id: "quiz",
    label: "Quiz",
    description: "Multiple choice + short answer + extended response with answer key",
    icon: FileQuestion,
  },
  {
    id: "lesson-plan",
    label: "Lesson Plan",
    description: "Full lesson plan with objectives, activities, and assessment",
    icon: BookOpen,
  },
  {
    id: "vocabulary",
    label: "Vocabulary",
    description: "15–20 key terms with definitions, context, and flashcard format",
    icon: List,
  },
  {
    id: "discussion",
    label: "Discussion",
    description: "Discussion questions organized by Bloom's taxonomy level",
    icon: MessageCircle,
  },
  {
    id: "dok-project",
    label: "DOK Project",
    description: "DOK 3–4 extended projects with rubrics and timelines",
    icon: Target,
  },
  {
    id: "graphic-organizer",
    label: "Graphic Organizer",
    description: "Timeline, cause/effect, concept map, KWL chart templates",
    icon: LayoutGrid,
  },
  {
    id: "guided-notes",
    label: "Guided Notes",
    description: "Cornell notes, outlines, fill-in-blank with timestamp refs",
    icon: StickyNote,
  },
  {
    id: "full-analysis",
    label: "Full Analysis",
    description: "Multi-perspective analysis: accuracy, pedagogy, standards, verdict",
    icon: Sparkles,
  },
];

type Props = {
  videoId: string;
  videoTitle: string;
  transcript: string;
};

type GeneratedOutput = {
  toolId: string;
  content: string;
  model: string;
  generatedAt: string;
};

export default function YoutubeCurriculumTools({
  videoId,
  videoTitle,
  transcript,
}: Props) {
  const [gradeLevel, setGradeLevel] = useState<number | undefined>(7);
  const [generating, setGenerating] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, GeneratedOutput>>({});
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [copiedTool, setCopiedTool] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate(toolId: string) {
    setError("");
    setGenerating(toolId);
    try {
      const res = await fetch("/api/youtube/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          videoTitle,
          transcript,
          outputType: toolId,
          options: gradeLevel ? { gradeLevel } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }
      setOutputs((prev) => ({
        ...prev,
        [toolId]: {
          toolId,
          content: data.content,
          model: data.model,
          generatedAt: data.generatedAt,
        },
      }));
      setExpandedTool(toolId);
    } catch {
      setError("Network error during generation");
    } finally {
      setGenerating(null);
    }
  }

  async function handleCopy(toolId: string) {
    const output = outputs[toolId];
    if (!output) return;
    await navigator.clipboard.writeText(output.content);
    setCopiedTool(toolId);
    setTimeout(() => setCopiedTool(null), 2000);
  }

  function handleDownload(toolId: string) {
    const output = outputs[toolId];
    if (!output) return;
    const blob = new Blob([output.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${videoTitle.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 50)}-${toolId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Grade level selector */}
      <div className="glass-panel rounded-3xl p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-muted">Grade Level</label>
          <select
            value={gradeLevel ?? ""}
            onChange={(e) =>
              setGradeLevel(e.target.value ? Number(e.target.value) : undefined)
            }
            className="rounded-xl border border-border/70 bg-muted-surface px-3 py-1.5 text-sm text-foreground focus:border-accent/40 focus:outline-none"
          >
            <option value="">Auto-detect</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map((tool) => {
          const hasOutput = !!outputs[tool.id];
          const isExpanded = expandedTool === tool.id;
          const isGenerating = generating === tool.id;

          return (
            <div
              key={tool.id}
              className={`glass-panel rounded-2xl p-4 transition ${
                hasOutput ? "border-accent/30" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-accent/10 p-2">
                  <tool.icon className="h-5 w-5 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    {tool.label}
                  </h4>
                  <p className="mt-0.5 text-xs leading-snug text-muted">
                    {tool.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleGenerate(tool.id)}
                disabled={isGenerating || generating !== null}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating…
                  </>
                ) : hasOutput ? (
                  "Regenerate"
                ) : (
                  "Generate"
                )}
              </button>
              {hasOutput && (
                <button
                  onClick={() =>
                    setExpandedTool(isExpanded ? null : tool.id)
                  }
                  className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-muted transition hover:text-foreground"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {isExpanded ? "Hide" : "View Output"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Expanded output panel */}
      {expandedTool && outputs[expandedTool] && (
        <div className="glass-panel rounded-3xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {TOOLS.find((t) => t.id === expandedTool)?.label} — Output
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(expandedTool)}
                className="flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
              >
                {copiedTool === expandedTool ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copiedTool === expandedTool ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => handleDownload(expandedTool)}
                className="flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
              >
                <Download className="h-3.5 w-3.5" />
                Download .md
              </button>
            </div>
          </div>
          <div className="max-h-[32rem] overflow-y-auto rounded-2xl border border-border/50 bg-muted-surface/50 p-4 scroll-fade prose prose-sm prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {outputs[expandedTool].content}
            </ReactMarkdown>
          </div>
          <p className="mt-2 text-right text-xs text-muted">
            Generated with {outputs[expandedTool].model} ·{" "}
            {new Date(outputs[expandedTool].generatedAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
