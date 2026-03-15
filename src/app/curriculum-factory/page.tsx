import { Zap } from "lucide-react";
import { CurriculumFactoryForm } from "@/components/curriculum-factory-form";

export const metadata = {
  title: "Curriculum Factory — Chapterhouse",
};

export default function CurriculumFactoryPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[var(--accent)]" />
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Curriculum Factory</h1>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Five-pass Council of the Unserious — Gandalf drafts, Data audits, Polgara finalizes,
          Earl assesses operations, Beavis &amp; Butthead stress-test engagement. Each job produces a
          full scope &amp; sequence ready to hand off to lesson builders.
        </p>
      </div>

      {/* How it works — quick legend */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { step: "Pass 1", name: "Gandalf", role: "Drafts scope & sequence" },
          { step: "Pass 2", name: "Data", role: "Structural audit" },
          { step: "Pass 3", name: "Polgara", role: "Final for the child" },
          { step: "Pass 4", name: "Earl", role: "Operational assessment" },
          { step: "Pass 5", name: "Beavis & Butthead", role: "Engagement test" },
        ].map((p) => (
          <div
            key={p.step}
            className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 space-y-0.5"
          >
            <p className="text-xs text-[var(--muted)]">{p.step}</p>
            <p className="text-sm font-semibold text-[var(--foreground)]">{p.name}</p>
            <p className="text-xs text-[var(--muted)]">{p.role}</p>
          </div>
        ))}
      </div>

      <hr className="border-[var(--border)]" />

      <CurriculumFactoryForm />
    </div>
  );
}
