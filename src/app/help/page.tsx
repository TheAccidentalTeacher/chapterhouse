import fs from "fs";
import path from "path";

export default function HelpPage() {
  let content = "";
  try {
    content = fs.readFileSync(
      path.join(process.cwd(), "chapterhouse-help-guide.md"),
      "utf-8"
    );
  } catch {
    content = "# Help guide not found\n\nThe help guide file is missing from the project root.";
  }

  // Simple markdown-to-HTML: headings, bold, tables, lists, blockquotes, horizontal rules
  const lines = content.split("\n");
  const htmlLines: string[] = [];
  let inTable = false;
  let inTableBody = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      if (inTable) {
        htmlLines.push("</tbody></table>");
        inTable = false;
        inTableBody = false;
      }
      htmlLines.push('<hr class="my-8 border-border" />');
      continue;
    }

    // Table row
    if (line.includes("|") && line.trim().startsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      // Separator row (|---|---|)
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;

      if (!inTable) {
        htmlLines.push(
          '<div class="overflow-x-auto my-4"><table class="w-full text-sm border border-border rounded-xl overflow-hidden">'
        );
        htmlLines.push(
          "<thead><tr>" +
            cells
              .map(
                (c) =>
                  `<th class="text-left px-4 py-2.5 bg-muted-surface font-semibold text-foreground border-b border-border">${inlineFormat(c)}</th>`
              )
              .join("") +
            "</tr></thead>"
        );
        htmlLines.push("<tbody>");
        inTable = true;
        inTableBody = true;
        continue;
      }

      htmlLines.push(
        "<tr>" +
          cells
            .map(
              (c) =>
                `<td class="px-4 py-2.5 border-b border-border/50 text-muted">${inlineFormat(c)}</td>`
            )
            .join("") +
          "</tr>"
      );
      continue;
    }

    // Close table if we were in one
    if (inTable && !line.includes("|")) {
      htmlLines.push("</tbody></table></div>");
      inTable = false;
      inTableBody = false;
    }

    // Headings
    if (line.startsWith("# ")) {
      htmlLines.push(
        `<h1 class="text-3xl font-bold mt-10 mb-4 text-foreground">${inlineFormat(line.slice(2))}</h1>`
      );
      continue;
    }
    if (line.startsWith("## ")) {
      htmlLines.push(
        `<h2 class="text-2xl font-bold mt-10 mb-3 text-foreground">${inlineFormat(line.slice(3))}</h2>`
      );
      continue;
    }
    if (line.startsWith("### ")) {
      htmlLines.push(
        `<h3 class="text-xl font-semibold mt-8 mb-2 text-foreground">${inlineFormat(line.slice(4))}</h3>`
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      htmlLines.push(
        `<blockquote class="border-l-4 border-accent/50 pl-4 my-4 text-muted italic">${inlineFormat(line.slice(2))}</blockquote>`
      );
      continue;
    }

    // List item
    if (/^[-*] /.test(line.trimStart())) {
      const text = line.replace(/^[\s]*[-*] /, "");
      htmlLines.push(
        `<li class="ml-5 list-disc text-muted leading-7">${inlineFormat(text)}</li>`
      );
      continue;
    }

    // Numbered list
    if (/^\d+\. /.test(line.trimStart())) {
      const text = line.replace(/^[\s]*\d+\. /, "");
      htmlLines.push(
        `<li class="ml-5 list-decimal text-muted leading-7">${inlineFormat(text)}</li>`
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      htmlLines.push('<div class="h-3"></div>');
      continue;
    }

    // Paragraph
    htmlLines.push(
      `<p class="text-muted leading-7 mb-2">${inlineFormat(line)}</p>`
    );
  }

  if (inTable) {
    htmlLines.push("</tbody></table></div>");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <div dangerouslySetInnerHTML={{ __html: htmlLines.join("\n") }} />
    </div>
  );
}

/** Bold, italic, inline code, links */
function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="rounded bg-muted-surface px-1.5 py-0.5 text-xs font-mono text-accent">$1</code>')
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-accent underline underline-offset-2 hover:text-accent/80">$1</a>'
    );
}
