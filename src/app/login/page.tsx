"use client";

import { useState, useEffect, Suspense } from "react";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "unauthorized") {
      setError("That account isn't authorized. Contact Scott to request access.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured. Check environment variables.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      setError("Invalid email or password.");
    } else {
      const next = searchParams.get("next") ?? "/";
      router.push(next);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl metallic-accent text-accent-foreground shadow-lg shadow-accent/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Chapterhouse</p>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs font-medium text-muted uppercase tracking-wide">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@somers.com"
              required
              className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-xs font-medium text-muted uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/20 disabled:opacity-40"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
            ) : (
              "Sign in"
            )}
          </button>
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
