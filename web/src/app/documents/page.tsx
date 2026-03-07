import { PageFrame } from "@/components/page-frame";
import { documentLibrary } from "@/lib/mock-data";

export default function DocumentsPage() {
  return (
    <PageFrame
      eyebrow="Documents"
      title="Core memory starts here."
      description="These are the documents that will anchor retrieval, system behavior, and strategic continuity as Chapterhouse moves from shell to intelligence engine."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {documentLibrary.map((doc) => (
          <article key={doc.name} className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-muted-surface px-2.5 py-1 text-xs font-semibold text-muted">
                {doc.status}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-muted">{doc.role}</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-balance">{doc.name}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              This record is ready to become an ingested document entry with chunk metadata, embeddings, and citation behavior.
            </p>
          </article>
        ))}
      </section>
    </PageFrame>
  );
}