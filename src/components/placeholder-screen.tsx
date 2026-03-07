import { ArrowRight } from "lucide-react";
import { PageFrame } from "@/components/page-frame";

type PlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
};

export function PlaceholderScreen({
  eyebrow,
  title,
  description,
  bullets,
}: PlaceholderScreenProps) {
  return (
    <PageFrame
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={
        <button className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90">
          MVP route scaffolded
        </button>
      }
    >
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel rounded-3xl p-6">
          <h2 className="text-lg font-semibold">What this screen will own</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-accent" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-panel rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Build posture</h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            This route exists so the shell is honest now, while the deeper data and workflow logic arrive in the next passes.
          </p>
          <div className="mt-6 rounded-2xl border border-border/70 bg-muted-surface p-4 text-sm text-muted">
            The goal is not fake polish. The goal is a usable structure that can accept real data without a redesign spiral.
          </div>
        </div>
      </section>
    </PageFrame>
  );
}