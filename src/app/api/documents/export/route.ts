import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { createClient } from "@supabase/supabase-js";
import { markdownToDocx } from "@/lib/docx-builder";

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
      .select("id, title, content, doc_type, export_history")
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
      // Programmatic .docx generation via docx library
      // Replaces html-to-docx — native Word XML elements, not HTML conversion
      const docxBuffer = await markdownToDocx(
        doc.title || "Untitled",
        doc.content || "",
        doc.doc_type as string | undefined
      );

      return new Response(new Uint8Array(docxBuffer), {
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
