"use client";
import { useState } from "react";
import { PageFrame } from "@/components/page-frame";
import { SocialReviewQueue } from "@/components/social-review-queue";
import { SocialGeneratePanel } from "@/components/social-generate-panel";
import { SocialAccountsPanel } from "@/components/social-accounts-panel";
import { Send, Plus, Settings2 } from "lucide-react";

const TABS = [
  { id: "queue", label: "Review Queue", icon: Send },
  { id: "generate", label: "Generate", icon: Plus },
  { id: "accounts", label: "Accounts", icon: Settings2 },
];

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState("queue");

  return (
    <PageFrame
      title="Social Media"
      description="Generate, review, and schedule posts across all three brands."
    >
      <div className="flex gap-1 border-b border-border/50 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
        ))}
      </div>

      {activeTab === "queue" && <SocialReviewQueue />}
      {activeTab === "generate" && <SocialGeneratePanel onGenerated={() => setActiveTab("queue")} />}
      {activeTab === "accounts" && <SocialAccountsPanel />}
    </PageFrame>
  );
}
