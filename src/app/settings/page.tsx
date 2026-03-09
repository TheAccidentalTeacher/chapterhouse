import { PageFrame } from "@/components/page-frame";
import { getEnvironmentStatus } from "@/lib/env";
import { hasSupabasePublicEnv } from "@/lib/env";
import { FounderMemoryPanel } from "@/components/founder-memory-panel";

export default function SettingsPage() {
  const environment = getEnvironmentStatus();

  return (
    <PageFrame
      eyebrow="Settings"
      title="Environment and provider posture."
      description="Secrets stay outside the repo. This screen only reports whether the app-level environment contract has been satisfied, without exposing any values."
    >
      <div className="space-y-6">
        <FounderMemoryPanel />

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Environment status</h2>
            <span className="rounded-full bg-muted-surface px-3 py-1 text-xs font-semibold text-muted">
              {environment.isValid ? "Ready" : "Needs setup"}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {environment.fields.map((field) => (
              <div key={field.key} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 text-sm">
                <span>{field.key}</span>
                <span className={`inline-flex items-center gap-2 ${field.present ? "text-success" : "text-warning"}`}>
                  <span className={`status-dot ${field.present ? "bg-success" : "bg-warning"}`} />
                  {field.present ? "Present" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Provider notes</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
            <p>
              Supabase public configuration is {hasSupabasePublicEnv() ? "available" : "not yet mapped"} for this app shell.
            </p>
            <p>
              The root repository secrets remain protected. App-specific env values should go in a local `web/.env.local` file or in hosted provider settings.
            </p>
            <div className="rounded-2xl border border-border/70 bg-muted-surface p-4">
              Next step: map the required app variables from your protected secret store into local and hosted app environments.
            </div>
          </div>
        </section>
      </div>
      </div>
    </PageFrame>
  );
}