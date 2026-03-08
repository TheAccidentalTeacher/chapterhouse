import fs from "fs";
import path from "path";
import { DocumentsList } from "@/components/documents-list";

type DocFile = {
  slug: string;
  title: string;
  preview: string;
  content: string;
  size: number;
};

function readDocs(): DocFile[] {
  const root = process.cwd();
  let files: string[];

  try {
    files = fs.readdirSync(root).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }

  // Put important brand/ops docs first
  const priority = [
    "persona.md",
    "biography.md",
    "brand-personality-handoff.md",
    "operating-system.md",
    "ai-operating-principles.md",
    "shopify-strategy.md",
    "chapterhouse-product-spec.md",
    "chapterhouse-coding-plan.md",
    "README.md",
  ];

  const sorted = [
    ...priority.filter((f) => files.includes(f)),
    ...files.filter((f) => !priority.includes(f)).sort(),
  ];

  return sorted.map((filename): DocFile => {
    const filePath = path.join(root, filename);
    let content = "";
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      content = "(Could not read file)";
    }

    // Extract title from first # heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch
      ? titleMatch[1].trim()
      : filename.replace(/\.md$/, "").replace(/-/g, " ");

    // Preview: first non-empty, non-heading paragraph
    const lines = content.split("\n");
    let preview = "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith(">") && !trimmed.startsWith("|") && !trimmed.startsWith("---")) {
        preview = trimmed.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").slice(0, 180);
        break;
      }
    }

    return {
      slug: filename,
      title,
      preview,
      content,
      size: Buffer.byteLength(content, "utf-8"),
    };
  });
}

export default function DocumentsPage() {
  const docs = readDocs();

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Documents</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Brand memory, all of it.</h1>
          <p className="mt-2 text-sm text-muted">
            Every document in the brand guide. Click any card to read the full content.
            These feed the chat system prompt as research is saved and briefs are generated.
          </p>
        </div>

        <DocumentsList docs={docs} />
      </div>
    </div>
  );
}