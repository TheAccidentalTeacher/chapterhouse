"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { CheckCircle, X, ChevronDown, ChevronUp } from "lucide-react";

interface SocialPost {
  id: string;
  brand: string;
  platform: string;
  post_text: string;
  hashtags: string[];
  image_brief: string | null;
  status: string;
  created_at: string;
}

interface SocialAccount {
  buffer_profile_id: string;
  display_name: string;
  platform: string;
  brand: string;
}

const BRAND_LABEL: Record<string, string> = {
  ncho: "NCHO",
  somersschool: "SomersSchool",
  alana_terry: "Alana Terry",
  scott_personal: "Scott",
};

const BRAND_COLOR: Record<string, string> = {
  ncho: "bg-amber-500/20 text-amber-300",
  somersschool: "bg-red-500/20 text-red-300",
  alana_terry: "bg-purple-500/20 text-purple-300",
  scott_personal: "bg-slate-500/20 text-slate-300",
};

const PLATFORM_COLOR: Record<string, string> = {
  facebook: "bg-blue-500/20 text-blue-300",
  instagram: "bg-pink-500/20 text-pink-300",
  linkedin: "bg-sky-500/20 text-sky-300",
};

const BRAND_ORDER = ["ncho", "somersschool", "alana_terry", "scott_personal"];

export function SocialReviewQueue() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingText, setEditingText] = useState<Record<string, string>>({});
  const [approving, setApproving] = useState<string | null>(null);
  const [approveForm, setApproveForm] = useState<Record<string, { scheduled_for: string; buffer_profile_id: string }>>({});
  const [openImage, setOpenImage] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    const res = await fetch("/api/social/posts?status=pending_review");
    if (res.ok) {
      const data = await res.json() as { posts: SocialPost[] };
      setPosts(data.posts ?? []);
    }
    setLoading(false);
  }, []);

  const loadAccounts = useCallback(async () => {
    const res = await fetch("/api/social/accounts");
    if (res.ok) {
      const data = await res.json() as { accounts: SocialAccount[] };
      setAccounts(data.accounts ?? []);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadAccounts();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("social-posts-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "social_posts" },
        () => { loadPosts(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadPosts]);

  const handleBlurEdit = async (postId: string) => {
    const newText = editingText[postId];
    if (!newText) return;
    await fetch(`/api/social/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_text: newText }),
    });
  };

  const handleReject = async (postId: string) => {
    await fetch(`/api/social/posts/${postId}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleApprove = async (postId: string) => {
    const form = approveForm[postId];
    if (!form?.scheduled_for || !form?.buffer_profile_id) return;
    setApproving(postId);
    const res = await fetch(`/api/social/posts/${postId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setApproving(null);
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const grouped = BRAND_ORDER.reduce<Record<string, SocialPost[]>>((acc, brand) => {
    const brandPosts = posts.filter((p) => p.brand === brand);
    if (brandPosts.length) acc[brand] = brandPosts;
    return acc;
  }, {});

  if (loading) {
    return <div className="text-muted-foreground text-sm py-8 text-center">Loading posts...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">No posts pending review.</p>
        <p className="text-xs mt-1">Switch to the Generate tab to create a new batch.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([brand, brandPosts]) => (
        <div key={brand}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BRAND_COLOR[brand] ?? "bg-muted text-muted-foreground"}`}>
              {BRAND_LABEL[brand] ?? brand}
            </span>
            <span className="text-xs text-muted-foreground">{brandPosts.length} posts</span>
          </div>

          <div className="space-y-3">
            {brandPosts.map((post) => {
              const accountsForPlatform = accounts.filter((a) => a.platform === post.platform);
              const isApprovingThis = approving === post.id;
              const approve = approveForm[post.id];

              return (
                <div
                  key={post.id}
                  className="bg-card border border-border/50 rounded-xl p-4 space-y-3"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLOR[post.platform] ?? "bg-muted text-muted-foreground"}`}>
                      {post.platform}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Post text — inline editable */}
                  <textarea
                    className="w-full bg-transparent text-sm text-foreground resize-none border border-transparent focus:border-border/50 rounded-lg p-2 focus:outline-none min-h-[80px]"
                    defaultValue={post.post_text}
                    onChange={(e) =>
                      setEditingText((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onBlur={() => handleBlurEdit(post.id)}
                  />

                  {/* Hashtags */}
                  {post.hashtags?.length > 0 && (
                    <div className="text-xs text-blue-400/70">
                      {post.hashtags.join(" ")}
                    </div>
                  )}

                  {/* Image brief collapsible */}
                  {post.image_brief && (
                    <div>
                      <button
                        onClick={() => setOpenImage(openImage === post.id ? null : post.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {openImage === post.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        Image brief
                      </button>
                      {openImage === post.id && (
                        <p className="text-xs text-muted-foreground mt-1 pl-4 border-l border-border/40 italic">
                          {post.image_brief}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Approve form */}
                  <div className="flex flex-wrap items-end gap-2 pt-1 border-t border-border/30">
                    <input
                      type="datetime-local"
                      className="bg-background border border-border/50 rounded-md text-xs px-2 py-1 text-foreground"
                      value={approve?.scheduled_for ?? ""}
                      onChange={(e) =>
                        setApproveForm((prev) => ({
                          ...prev,
                          [post.id]: { ...prev[post.id], scheduled_for: e.target.value },
                        }))
                      }
                    />
                    <select
                      className="bg-background border border-border/50 rounded-md text-xs px-2 py-1 text-foreground"
                      value={approve?.buffer_profile_id ?? ""}
                      onChange={(e) =>
                        setApproveForm((prev) => ({
                          ...prev,
                          [post.id]: { ...prev[post.id], buffer_profile_id: e.target.value },
                        }))
                      }
                    >
                      <option value="">Select Buffer account...</option>
                      {accountsForPlatform.map((a) => (
                        <option key={a.buffer_profile_id} value={a.buffer_profile_id}>
                          {a.display_name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleApprove(post.id)}
                      disabled={isApprovingThis || !approve?.scheduled_for || !approve?.buffer_profile_id}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-green-600/20 text-green-300 hover:bg-green-600/30 disabled:opacity-40 transition"
                    >
                      <CheckCircle size={12} />
                      {isApprovingThis ? "Scheduling..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(post.id)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-red-600/15 text-red-400 hover:bg-red-600/25 transition"
                    >
                      <X size={12} />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
