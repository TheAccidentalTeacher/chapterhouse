import { PageFrame } from "@/components/page-frame";
import { EmailInbox } from "@/components/email-inbox";

export default function InboxPage() {
  return (
    <PageFrame title="Inbox" description="scott@nextchapterhomeschool.com">
      <EmailInbox />
    </PageFrame>
  );
}
