import { PageFrame } from "@/components/page-frame";
import { reviewQueueItems } from "@/lib/mock-data";

export default function ReviewQueuePage() {
  return (
    <PageFrame
      eyebrow="Review Queue"
      title="Review before automation gets ideas."
      description="The review queue is where good signals become approved work and bad assumptions die before they reach the storefront or the calendar."
    >
      <section className="glass-panel rounded-3xl p-6">
        <div className="space-y-3">
          {reviewQueueItems.map((item) => (
            <div key={item.title} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-medium">{item.title}</h2>
                <p className="mt-1 text-sm text-muted">Owner: {item.owner}</p>
              </div>
              <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-semibold text-muted">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}