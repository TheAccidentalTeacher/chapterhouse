import fs from "fs";
import path from "path";
import { DocumentsList } from "@/components/documents-list";
import { DocumentUploadSection } from "@/components/document-upload-section";
import type { SearchParams } from "next/dist/server/request/search-params";

type DocFile = {
  slug: string;
  title: string;
  preview: string;
  content: string;
  size: number;
};

const DOC_DIRECTORIES = ["docs", "reference"];

const PRIORITY = [
  "docs/strategy/persona.md",
  "docs/strategy/biography.md",
  "docs/strategy/brand-personality-handoff.md",
  "docs/strategy/operating-system.md",
  "docs/strategy/ai-operating-principles.md",
  "docs/strategy/shopify-strategy.md",
  "docs/specs/chapterhouse-product-spec.md",
  "docs/specs/chapterhouse-coding-plan.md",
  "README.md",
  "CLAUDE.md",
];

function collectMarkdownFiles(root: string, directory: string): string[] {
  const absoluteDirectory = path.join(root, directory);

  if (!fs.existsSync(absoluteDirectory)) {
    return [];
  }

  const entries = fs.readdirSync(absoluteDirectory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const relativePath = path.posix.join(directory, entry.name);
    const absolutePath = path.join(root, relativePath);

    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(root, relativePath));
      continue;
    }

    if (entry.isFile() && absolutePath.endsWith(".md")) {
      files.push(relativePath);
    }
  }

  return files;
}

function readDocs(): DocFile[] {
  const root = process.cwd();
  let files: string[];

  try {
    const rootFiles = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name);

    const nestedFiles = DOC_DIRECTORIES.flatMap((directory) => collectMarkdownFiles(root, directory));

    files = Array.from(new Set([...rootFiles, ...nestedFiles]));
  } catch {
    return [];
  }

  const sorted = [
    ...PRIORITY.filter((file) => files.includes(file)),
    ...files.filter((file) => !PRIORITY.includes(file)).sort(),
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

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const docs = readDocs();
  const params = await searchParams;
  const initialQuery = typeof params.q === "string" ? params.q : "";

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Documents</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Brand memory, all of it.</h1>
          <p className="mt-2 text-sm text-muted">
            Every document in the brand guide, plus uploaded files for AI analysis.
            These feed the chat system prompt as research is saved and briefs are generated.
          </p>
        </div>

        <DocumentUploadSection />

        <DocumentsList docs={docs} initialQuery={initialQuery} />
      </div>
    </div>
  );
}