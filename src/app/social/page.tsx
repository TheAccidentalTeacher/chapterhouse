"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PageFrame } from "@/components/page-frame";
import { SocialReviewQueue } from "@/components/social-review-queue";
import { SocialGeneratePanel } from "@/components/social-generate-panel";
import { SocialAccountsPanel } from "@/components/social-accounts-panel";
import { Tooltip } from "@/components/tooltip";
import { logEvent } from "@/lib/debug-log";
import { Send, Plus, Settings2, HelpCircle } from "lucide-react";

const TABS = [
  { id: "queue", label: "Review Queue", icon: Send, tip: "Review and approve pending posts before they publish" },
  { id: "generate", label: "Generate", icon: Plus, tip: "Create new AI-generated posts for any brand × platform" },
  { id: "accounts", label: "Accounts", icon: Settings2, tip: "Manage Buffer channel connections per brand" },
];

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState("queue");

  useEffect(() => {
    logEvent("nav", "Social · Page loaded");
  }, []);

  return (
    <PageFrame
      title="Social Media"
      description="Generate, review, and schedule posts across all three brands."
      actions={
        <Tooltip content="Social Media help & documentation" position="bottom">
          <Link href="/social/help" className="text-muted-foreground hover:text-accent transition">
            <HelpCircle size={18} />
          </Link>
        </Tooltip>
      }
    >
      <div className="flex gap-1 border-b border-border/50 mb-6">
        {TABS.map((tab) => (
          <Tooltip key={tab.id} content={tab.tip} position="bottom">
            <button
              onClick={() => {
                    logEvent("click", "Social · Tab switched", { tab: tab.id });
                    setActiveTab(tab.id);
                  }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition
                ${
                  activeTab === tab.id
                    ? "bg-accent/10 text-foreground border-b-2 border-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          </Tooltip>
        ))}
      </div>

      {activeTab === "queue" && <SocialReviewQueue />}
      {activeTab === "generate" && <SocialGeneratePanel onGenerated={() => setActiveTab("queue")} />}
      {activeTab === "accounts" && <SocialAccountsPanel />}
    </PageFrame>
  );
}
