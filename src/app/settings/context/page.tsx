import { PageFrame } from "@/components/page-frame";
import { ContextFilePanel } from "@/components/context-file-panel";

export default function ContextSettingsPage() {
  return (
    <PageFrame
      eyebrow="Settings → Context"
      title="Context Brain."
      description="Multiple named documents — copilot-instructions, dreamer, extended context, intel — all assembled into one system prompt on every chat request. Edit any doc here, push updates from other workspaces via the API."
    >
      <ContextFilePanel />
    </PageFrame>
  );
}
