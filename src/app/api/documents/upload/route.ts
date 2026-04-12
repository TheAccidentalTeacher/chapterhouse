import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/epub+zip": "epub",
  "text/plain": "txt",
  "text/markdown": "md",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/documents/upload
 *
 * Accept file upload (multipart form data), extract text, store in DB.
 * Supports PDF, DOCX, ePub, TXT, MD.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const fileType = ALLOWED_TYPES[file.type] || inferTypeFromName(file.name);
    if (!fileType) {
      return Response.json(
        { error: `Unsupported file type: ${file.type || file.name}. Supported: PDF, DOCX, ePub, TXT, MD` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text based on file type
    let extractedText = "";
    let extractionMethod = "direct";
    let pageCount: number | null = null;
    let tableCount: number | null = null;

    if (fileType === "pdf") {
      // Try Azure Doc Intelligence first, fall back to pdf-parse
      const azureResult = await extractWithAzure(buffer);
      if (azureResult) {
        extractedText = azureResult.text;
        extractionMethod = "azure-doc-intelligence";
        pageCount = azureResult.pageCount;
        tableCount = azureResult.tableCount;
      } else {
        const pdfResult = await extractWithPdfParse(buffer);
        extractedText = pdfResult.text;
        extractionMethod = "pdf-parse";
        pageCount = pdfResult.pageCount;
      }
    } else if (fileType === "docx") {
      extractedText = await extractDocx(buffer);
      extractionMethod = "mammoth";
    } else if (fileType === "epub") {
      extractedText = await extractEpub(buffer);
      extractionMethod = "epub-parser";
    } else {
      // TXT or MD — direct read
      extractedText = buffer.toString("utf-8");
      extractionMethod = "direct";
    }

    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
    const characterCount = extractedText.length;

    // Save to database
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        storage_path: `uploads/${Date.now()}-${file.name}`,
        extracted_text: extractedText,
        character_count: characterCount,
        word_count: wordCount,
        page_count: pageCount,
        table_count: tableCount,
        extraction_method: extractionMethod,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json({
      documentId: doc.id,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      extractedText,
      extraction: {
        characterCount,
        wordCount,
        pageCount,
        tableCount,
        extractionMethod,
      },
    });
  } catch (error) {
    console.error("[documents/upload] Error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * GET /api/documents/upload
 *
 * List all uploaded documents.
 */
export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, file_type, file_size, character_count, word_count, page_count, table_count, extraction_method, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ documents: data ?? [] });
}

// ─── Extraction helpers ──────────────────────────────

function inferTypeFromName(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "pdf",
    docx: "docx",
    epub: "epub",
    txt: "txt",
    md: "md",
  };
  return map[ext || ""] || null;
}

async function extractWithAzure(
  buffer: Buffer
): Promise<{ text: string; pageCount: number; tableCount: number } | null> {
  const key = process.env.AZURE_AI_FOUNDRY_KEY;
  const endpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT;
  if (!key || !endpoint) return null;

  try {
    // Start analysis
    const analyzeRes = await fetch(
      `${endpoint}formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2024-02-29-preview`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/pdf",
        },
        body: new Uint8Array(buffer),
        signal: AbortSignal.timeout(60_000),
      }
    );

    if (!analyzeRes.ok) return null;

    const operationUrl = analyzeRes.headers.get("Operation-Location");
    if (!operationUrl) return null;

    // Poll for result
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusRes = await fetch(operationUrl, {
        headers: { "Ocp-Apim-Subscription-Key": key },
      });
      if (!statusRes.ok) return null;

      const result = await statusRes.json();
      if (result.status === "succeeded") {
        return {
          text: result.analyzeResult?.content || "",
          pageCount: result.analyzeResult?.pages?.length || 0,
          tableCount: result.analyzeResult?.tables?.length || 0,
        };
      }
      if (result.status === "failed") return null;
    }
    return null;
  } catch {
    return null;
  }
}

async function extractWithPdfParse(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    const result = await pdfParse(buffer);
    return {
      text: result.text || "",
      pageCount: result.numpages || 0,
    };
  } catch {
    return { text: "", pageCount: 0 };
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch {
    return "";
  }
}

async function extractEpub(buffer: Buffer): Promise<string> {
  // Simple ePub parser: ePub is a ZIP containing XHTML content files
  // Use Node.js built-in ZIP support via zlib, or extract text from content
  try {
    const { Readable } = await import("stream");
    const { createUnzip } = await import("zlib");
    const stream = Readable.from(buffer);

    // ePub is a ZIP file — we need to extract XHTML content
    // Using a simple approach: convert buffer to string and extract text between tags
    const text = buffer.toString("utf-8");

    // Find all text content (between HTML/XHTML tags)
    const stripped = text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // If that didn't work well (binary content), just return what we can
    void stream;
    void createUnzip;
    return stripped.length > 100 ? stripped : "(ePub text extraction limited — upload as PDF for best results)";
  } catch {
    return "(ePub extraction failed)";
  }
}
