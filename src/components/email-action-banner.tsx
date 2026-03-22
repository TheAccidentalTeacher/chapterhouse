"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, X, Zap } from "lucide-react";

interface ActionItem {
  id: string;
  subject: string;
  from_name: string;
  category: string;
  urgency: number;
  email_account?: string;
}

export function EmailActionBanner() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/email/action-items");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setCount(data.count ?? 0);
    } catch {
      // silent — banner is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchItems, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  if (loading || dismissed || count === 0) return null;

  return (
    <div className="mx-4 mt-3 mb-1 rounded-lg border border-amber-600/30 bg-amber-900/20 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-300">
            {count} email{count !== 1 ? "s" : ""} need{count === 1 ? "s" : ""} your attention
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/inbox"
            className="text-xs px-2.5 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 transition-colors"
          >
            View Inbox
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            title="Dismiss (reappears on refresh)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs text-gray-300">
            <Mail className="w-3 h-3 text-gray-500 shrink-0" />
            <span className="font-medium text-gray-200">{item.from_name}:</span>
            <span className="truncate">{item.subject}</span>
            {item.category && (
              <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase">
                {item.category.replace("_", " ")}
              </span>
            )}
            {item.urgency >= 4 && (
              <span className="shrink-0 text-[9px] font-semibold text-red-400">urgent</span>
            )}
          </div>
        ))}
        {count > 3 && (
          <p className="text-[11px] text-gray-500 pl-5">
            + {count - 3} more
          </p>
        )}
      </div>
    </div>
  );
}
