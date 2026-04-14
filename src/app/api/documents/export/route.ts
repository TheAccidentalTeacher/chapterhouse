import { z } from "zod";
import { marked } from "marked";
import { handleRouteError } from "@/lib/route-helpers";
import { createClient } from "@supabase/supabase-js";

const exportSchema = z.object({
  document_id: z.string().uuid(),
  format: z.enum(["docx", "md", "pdf"]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { document_id, format } = exportSchema.parse(body);

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch document
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("id, title, content, content_html, export_history")
      .eq("id", document_id)
      .single();

    if (fetchError || !doc) {
      return Response.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Track export in history
    const exportRecord = {
      format,
      exported_at: new Date().toISOString(),
      exported_by: "owner",
    };
    const history = Array.isArray(doc.export_history)
      ? doc.export_history
      : [];
    history.push(exportRecord);

    await supabase
      .from("documents")
      .update({ export_history: history })
      .eq("id", document_id);

    // Branch on format
    if (format === "md") {
      return new Response(doc.content || "", {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${slugify(doc.title)}.md"`,
        },
      });
    }

    if (format === "pdf") {
      // Client-side print — return a URL the client can open
      return Response.json({
        printUrl: `/doc-studio?id=${document_id}&print=true`,
      });
    }

    if (format === "docx") {
      // Convert markdown to HTML, then to DOCX via html-to-docx
      const html =
        doc.content_html ||
        (marked.parse(doc.content || "", { async: false }) as string);

      // html-to-docx expects a full HTML string
      const styledHtml = `
        <html><head><style>
          body { font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.5; }
          h1 { font-size: 20pt; font-weight: bold; margin-top: 24pt; margin-bottom: 8pt; }
          h2 { font-size: 16pt; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; }
          h3 { font-size: 13pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 4pt 8pt; }
          blockquote { border-left: 3px solid #2563eb; padding-left: 12pt; color: #555; }
        </style></head><body>
        <h1>${escapeHtml(doc.title || "Untitled")}</h1>
        ${html}
        </body></html>
      `;

      const HTMLtoDOCX = (await import("html-to-docx")).default;
      const docxBuffer = await HTMLtoDOCX(styledHtml, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });

      // html-to-docx returns a Buffer — convert to Uint8Array for Web Response compat
      const uint8 = Buffer.isBuffer(docxBuffer)
        ? new Uint8Array(docxBuffer)
        : new Uint8Array(docxBuffer as unknown as ArrayBuffer);

      return new Response(uint8 as BodyInit, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${slugify(doc.title)}.docx"`,
        },
      });
    }

    return Response.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error) {
    return handleRouteError(error);
  }
}

function slugify(text: string): string {
  return (text || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
