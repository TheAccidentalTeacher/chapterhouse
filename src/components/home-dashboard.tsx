import { ChatInterface } from "@/components/chat-interface";
import { EmailActionBanner } from "@/components/email-action-banner";

export function HomeDashboard() {
  return (
    <>
      <EmailActionBanner />
      <ChatInterface />
    </>
  );
}