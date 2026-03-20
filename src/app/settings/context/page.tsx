import { PageFrame } from "@/components/page-frame";
import { ContextFilePanel } from "@/components/context-file-panel";

export default function ContextSettingsPage() {
  return (
    <PageFrame
      eyebrow="Settings → Context"
      title="Your context file."
      description="The full copilot-instructions.md lives here. Every chat session loads it as the base system prompt — edit it once, it's live immediately. No deploy, no restart."
    >
      <ContextFilePanel />
    </PageFrame>
  );
}
