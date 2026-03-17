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

// =============================================================================
// Types
// =============================================================================

type ToolDef = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type ToolOptions = {
  gradeLevel?: string;
  // Quiz
  numMultipleChoice?: number;
  numShortAnswer?: number;
  numTrueFalse?: number;
  numFillInBlank?: number;
  difficulty?: string;
  // Discussion
  includeSocratic?: boolean;
  includeDebate?: boolean;
  // Guided notes
  noteStyle?: string;
  // Graphic organizer
  organizerType?: string;
  // DOK project
  dokLevel?: number;
  projectType?: string;
  duration?: string;
  // Add-ons
  includeReading?: boolean;
  includeExitTicket?: boolean;
};

// =============================================================================
// Tool definitions
// =============================================================================

const TOOLS: ToolDef[] = [
  {
    id: "quiz",
    label: "Quiz",
    description:
      "MC, short answer, T/F, fill-in-blank — configurable counts, difficulty, DOK level",
    icon: FileQuestion,
  },
  {
    id: "lesson-plan",
    label: "Lesson Plan",
    description:
      "Backward design (UbD) with differentiation, ELL supports, and standards alignment",
    icon: BookOpen,
  },
  {
    id: "vocabulary",
    label: "Vocabulary",
    description:
      "15–20 Tier 2/3 terms with definitions, memory tips, and flashcard format",
    icon: List,
  },
  {
    id: "discussion",
    label: "Discussion",
    description:
      "All 6 Bloom's levels with follow-up probes, Socratic seminar, and debate prompts",
    icon: MessageCircle,
  },
  {
    id: "dok-project",
    label: "DOK Project",
    description:
      "DOK 3–4 extended project with rubric, timeline, differentiation, and reflection",
    icon: Target,
  },
  {
    id: "graphic-organizer",
    label: "Graphic Organizer",
    description:
      "6 types: concept map, timeline, Venn, cause/effect, KWL, mind map",
    icon: LayoutGrid,
  },
  {
    id: "guided-notes",
    label: "Guided Notes",
    description:
      "4 styles: Cornell, outline, fill-in-blank worksheet, guided questions",
    icon: StickyNote,
  },
  {
    id: "full-analysis",
    label: "Full Analysis",
    description:
      "Multi-perspective analysis: accuracy, pedagogy, standards, verdict",
    icon: Sparkles,
  },
];

const GRADE_BANDS = [
  { value: "elementary", label: "Elementary (K-5)" },
  { value: "middle", label: "Middle School (6-8)" },
  { value: "high", label: "High School (9-12)" },
  { value: "college", label: "College" },
];

const NOTE_STYLES = [
  { value: "cornell", label: "Cornell Notes" },
  { value: "outline", label: "Outline" },
  { value: "fillinblank", label: "Fill-in-the-Blank" },
  { value: "guided", label: "Guided Questions" },
];

const ORGANIZER_TYPES = [
  { value: "concept-map", label: "Concept Map" },
  { value: "timeline", label: "Timeline" },
  { value: "venn", label: "Venn Diagram" },
  { value: "cause-effect", label: "Cause & Effect" },
  { value: "kwl", label: "KWL Chart" },
  { value: "mind-map", label: "Mind Map" },
];

const PROJECT_TYPES = [
  { value: "research", label: "Research" },
  { value: "design", label: "Design" },
  { value: "investigation", label: "Investigation" },
  { value: "synthesis", label: "Synthesis" },
];

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "mixed", label: "Mixed" },
];

// =============================================================================
// Props
// =============================================================================

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

// =============================================================================
// Component
// =============================================================================

export default function YoutubeCurriculumTools({
  videoId,
  videoTitle,
  transcript,
}: Props) {
  // Global
  const [gradeLevel, setGradeLevel] = useState("middle");
  const [generating, setGenerating] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, GeneratedOutput>>({});
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [copiedTool, setCopiedTool] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Quiz options
  const [numMC, setNumMC] = useState(5);
  const [numSA, setNumSA] = useState(3);
  const [numTF, setNumTF] = useState(5);
  const [numFIB, setNumFIB] = useState(5);
  const [difficulty, setDifficulty] = useState("mixed");

  // Discussion options
  const [includeSocratic, setIncludeSocratic] = useState(true);
  const [includeDebate, setIncludeDebate] = useState(true);

  // Guided notes
  const [noteStyle, setNoteStyle] = useState("cornell");

  // Graphic organizer
  const [organizerType, setOrganizerType] = useState("concept-map");

  // DOK project
  const [dokLevel, setDokLevel] = useState(3);
  const [projectType, setProjectType] = useState("research");
  const [duration, setDuration] = useState("2-3 weeks");

  // Add-ons (guided-notes + graphic-organizer)
  const [includeReading, setIncludeReading] = useState(false);
  const [includeExitTicket, setIncludeExitTicket] = useState(false);

  // Track which tool's config panel is open
  const [configOpen, setConfigOpen] = useState<string | null>(null);

  function buildOptions(toolId: string): ToolOptions {
    const base: ToolOptions = { gradeLevel };
    switch (toolId) {
      case "quiz":
        return {
          ...base,
          numMultipleChoice: numMC,
          numShortAnswer: numSA,
          numTrueFalse: numTF,
          numFillInBlank: numFIB,
          difficulty,
        };
      case "discussion":
        return { ...base, includeSocratic, includeDebate };
      case "guided-notes":
        return { ...base, noteStyle, includeReading, includeExitTicket };
      case "graphic-organizer":
        return {
          ...base,
          organizerType,
          includeReading,
          includeExitTicket,
        };
      case "dok-project":
        return { ...base, dokLevel, projectType, duration };
      default:
        return base;
    }
  }

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
          options: buildOptions(toolId),
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

  // ---- Sub-option renderers per tool ----

  function renderToolConfig(toolId: string) {
    const selectClass =
      "rounded-lg border border-border/70 bg-muted-surface px-2 py-1 text-xs text-foreground focus:border-accent/40 focus:outline-none";
    const toggleClass = (on: boolean) =>
      `rounded-lg px-2.5 py-1 text-xs font-medium transition ${
        on
          ? "bg-accent/20 text-accent border border-accent/40"
          : "bg-muted-surface text-muted border border-border/70 hover:text-foreground"
      }`;

    switch (toolId) {
      case "quiz":
        return (
          <div className="mt-2 space-y-2 rounded-xl border border-border/40 bg-muted-surface/30 p-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-between text-xs text-muted">
                MC
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={numMC}
                  onChange={(e) => setNumMC(Number(e.target.value))}
                  className="ml-1 w-12 rounded border border-border/70 bg-muted-surface px-1 py-0.5 text-center text-xs text-foreground"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-muted">
                Short Ans
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={numSA}
                  onChange={(e) => setNumSA(Number(e.target.value))}
                  className="ml-1 w-12 rounded border border-border/70 bg-muted-surface px-1 py-0.5 text-center text-xs text-foreground"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-muted">
                T/F
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={numTF}
                  onChange={(e) => setNumTF(Number(e.target.value))}
                  className="ml-1 w-12 rounded border border-border/70 bg-muted-surface px-1 py-0.5 text-center text-xs text-foreground"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-muted">
                Fill-Blank
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={numFIB}
                  onChange={(e) => setNumFIB(Number(e.target.value))}
                  className="ml-1 w-12 rounded border border-border/70 bg-muted-surface px-1 py-0.5 text-center text-xs text-foreground"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Difficulty</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className={selectClass}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case "discussion":
        return (
          <div className="mt-2 flex flex-wrap gap-1.5 rounded-xl border border-border/40 bg-muted-surface/30 p-3">
            <button
              type="button"
              onClick={() => setIncludeSocratic(!includeSocratic)}
              className={toggleClass(includeSocratic)}
            >
              🏛️ Socratic
            </button>
            <button
              type="button"
              onClick={() => setIncludeDebate(!includeDebate)}
              className={toggleClass(includeDebate)}
            >
              ⚔️ Debate
            </button>
          </div>
        );

      case "guided-notes":
        return (
          <div className="mt-2 space-y-2 rounded-xl border border-border/40 bg-muted-surface/30 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Style</span>
              <select
                value={noteStyle}
                onChange={(e) => setNoteStyle(e.target.value)}
                className={selectClass}
              >
                {NOTE_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setIncludeReading(!includeReading)}
                className={toggleClass(includeReading)}
              >
                📖 Reading Passage
              </button>
              <button
                type="button"
                onClick={() => setIncludeExitTicket(!includeExitTicket)}
                className={toggleClass(includeExitTicket)}
              >
                🎫 Exit Ticket
              </button>
            </div>
          </div>
        );

      case "graphic-organizer":
        return (
          <div className="mt-2 space-y-2 rounded-xl border border-border/40 bg-muted-surface/30 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Type</span>
              <select
                value={organizerType}
                onChange={(e) => setOrganizerType(e.target.value)}
                className={selectClass}
              >
                {ORGANIZER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setIncludeReading(!includeReading)}
                className={toggleClass(includeReading)}
              >
                📖 Reading Passage
              </button>
              <button
                type="button"
                onClick={() => setIncludeExitTicket(!includeExitTicket)}
                className={toggleClass(includeExitTicket)}
              >
                🎫 Exit Ticket
              </button>
            </div>
          </div>
        );

      case "dok-project":
        return (
          <div className="mt-2 space-y-2 rounded-xl border border-border/40 bg-muted-surface/30 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">DOK</span>
              <select
                value={dokLevel}
                onChange={(e) => setDokLevel(Number(e.target.value))}
                className={selectClass}
              >
                <option value={3}>Level 3 — Strategic Thinking</option>
                <option value={4}>Level 4 — Extended Thinking</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Type</span>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className={selectClass}
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Duration</span>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={selectClass}
              >
                <option value="1 week">1 week</option>
                <option value="2-3 weeks">2-3 weeks</option>
                <option value="1 month">1 month</option>
                <option value="semester-long">Semester-long</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  const hasConfig = (id: string) =>
    ["quiz", "discussion", "guided-notes", "graphic-organizer", "dok-project"].includes(id);

  return (
    <div className="space-y-4">
      {/* Grade band selector */}
      <div className="glass-panel rounded-3xl p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-muted">
            Grade Level
          </label>
          <div className="flex gap-1.5">
            {GRADE_BANDS.map((band) => (
              <button
                key={band.value}
                type="button"
                onClick={() => setGradeLevel(band.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  gradeLevel === band.value
                    ? "bg-accent text-accent-foreground shadow shadow-accent/25"
                    : "bg-muted-surface text-muted hover:text-foreground border border-border/70"
                }`}
              >
                {band.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map((tool) => {
          const hasOutput = !!outputs[tool.id];
          const isExpanded = expandedTool === tool.id;
          const isGenerating = generating === tool.id;
          const isConfigOpen = configOpen === tool.id;

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

              {/* Config toggle */}
              {hasConfig(tool.id) && (
                <button
                  type="button"
                  onClick={() =>
                    setConfigOpen(isConfigOpen ? null : tool.id)
                  }
                  className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-muted transition hover:text-foreground"
                >
                  {isConfigOpen ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {isConfigOpen ? "Hide Options" : "Options"}
                </button>
              )}

              {/* Inline config */}
              {isConfigOpen && renderToolConfig(tool.id)}

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
