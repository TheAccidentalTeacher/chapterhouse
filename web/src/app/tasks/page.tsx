import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function TasksPage() {
  return (
    <PlaceholderScreen
      eyebrow="Tasks"
      title="Turn decisions into execution."
      description="Tasks are where approved briefs, reviews, and research outputs get converted into actual follow-through."
      bullets={[
        "Task creation from briefs, research, and opportunities",
        "Owner assignment and due dates",
        "Status transitions and completion tracking",
        "Linked-doc and linked-source context",
      ]}
    />
  );
}