import { PageFrame } from "@/components/page-frame";
import { UnreadTriage } from "@/components/unread-triage";

export default function UnreadTriagePage() {
  return (
    <PageFrame
      title="Unread Triage"
      description="AI-powered triage for unread emails across all accounts."
    >
      <UnreadTriage />
    </PageFrame>
  );
}
