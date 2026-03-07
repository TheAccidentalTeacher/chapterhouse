import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function ResearchPage() {
  return (
    <PlaceholderScreen
      eyebrow="Research"
      title="Research that turns sources into judgment."
      description="This route will take URLs, feeds, and selected records and turn them into summaries, verdicts, citations, and review-ready outputs."
      bullets={[
        "Source fetch and parsing pipeline",
        "Persona-aware analysis modes",
        "Evidence grading and confidence notes",
        "Review queue handoff for anything that matters",
      ]}
    />
  );
}