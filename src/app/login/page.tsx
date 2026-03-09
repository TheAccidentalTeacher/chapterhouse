"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, MailCheck, AlertTriangle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "unauthorized") {
      setError("That email isn't on the access list. Contact Scott to request access.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured. Check environment variables.");
      setLoading(false);
      return;
    }

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "/auth/callback";

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="glass-panel w-full max-w-sm rounded-3xl p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <MailCheck className="h-7 w-7" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Check your email</h1>
            <p className="text-sm text-muted leading-6">
              We sent a sign-in link to <strong>{email}</strong>. Click it to access Chapterhouse.
            </p>
          </div>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="text-xs text-muted hover:text-foreground transition"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Chapterhouse</p>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs font-medium text-muted uppercase tracking-wide">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/20 disabled:opacity-40"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending link…</>
            ) : (
              "Send sign-in link"
            )}
          </button>
          <p className="text-center text-xs text-muted">
            We'll email you a magic link — no password needed.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
