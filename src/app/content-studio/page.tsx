import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function ContentStudioPage() {
  return (
    <PlaceholderScreen
      eyebrow="Content Studio"
      title="Draft content without losing the plot."
      description="This route will eventually connect strategy, approved signals, and brand voice into a reviewed content workflow."
      bullets={[
        "Campaign and newsletter drafting",
        "Channel-specific planning with review gates",
        "Content calendar hooks tied to real signals",
        "Brand-voice grounding from the core docs",
      ]}
    />
  );
}