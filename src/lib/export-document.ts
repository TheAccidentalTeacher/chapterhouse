import { marked } from "marked";

/**
 * Converts markdown content into a fully styled standalone HTML document
 * suitable for viewing, printing to PDF, and DOCX conversion.
 */
export function markdownToStyledHtml(
  markdown: string,
  title: string,
  options?: { includeCouncilReport?: boolean; councilReportMarkdown?: string }
): string {
  const mainHtml = marked.parse(markdown, { async: false }) as string;
  const councilReportHtml = options?.includeCouncilReport && options.councilReportMarkdown
    ? marked.parse(options.councilReportMarkdown, { async: false }) as string
    : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --color-text: #1a1a2e;
    --color-heading: #0f0f23;
    --color-muted: #555;
    --color-border: #d1d5db;
    --color-bg: #ffffff;
    --color-accent: #2563eb;
    --color-accent-light: #eff6ff;
    --color-table-stripe: #f9fafb;
    --color-table-header: #1e293b;
    --color-viability-bg: #fef9ee;
    --color-viability-border: #d97706;
  }

  @media print {
    body { margin: 0; padding: 0; }
    .page-break { page-break-before: always; }
    .no-print { display: none !important; }
    @page { margin: 0.75in 1in; size: letter; }
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11pt;
    line-height: 1.65;
    color: var(--color-text);
    background: var(--color-bg);
    max-width: 8.5in;
    margin: 0 auto;
    padding: 1in;
  }

  /* Title block */
  .doc-header {
    text-align: center;
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
    border-bottom: 3px solid var(--color-heading);
  }
  .doc-header h1 {
    font-family: 'Merriweather', Georgia, serif;
    font-size: 22pt;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
    letter-spacing: -0.02em;
  }
  .doc-header .subtitle {
    font-size: 10pt;
    color: var(--color-muted);
    margin-top: 0.5rem;
  }

  /* Headings */
  h1 {
    font-family: 'Merriweather', Georgia, serif;
    font-size: 18pt;
    font-weight: 700;
    color: var(--color-heading);
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.4rem;
    border-bottom: 2px solid var(--color-border);
    page-break-after: avoid;
  }
  h2 {
    font-family: 'Merriweather', Georgia, serif;
    font-size: 15pt;
    font-weight: 700;
    color: var(--color-heading);
    margin-top: 1.75rem;
    margin-bottom: 0.5rem;
    page-break-after: avoid;
  }
  h3 {
    font-size: 12pt;
    font-weight: 600;
    color: var(--color-heading);
    margin-top: 1.25rem;
    margin-bottom: 0.4rem;
    page-break-after: avoid;
  }
  h4 {
    font-size: 11pt;
    font-weight: 600;
    color: var(--color-muted);
    margin-top: 1rem;
    margin-bottom: 0.3rem;
    page-break-after: avoid;
  }

  p { margin-bottom: 0.75rem; }

  /* Lists */
  ul, ol {
    margin-bottom: 0.75rem;
    padding-left: 1.5rem;
  }
  li { margin-bottom: 0.25rem; }
  li > ul, li > ol { margin-top: 0.25rem; margin-bottom: 0; }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0 1.25rem;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  thead th {
    background: var(--color-table-header);
    color: #fff;
    font-weight: 600;
    text-align: left;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-table-header);
    font-size: 9.5pt;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  tbody td {
    padding: 0.45rem 0.75rem;
    border: 1px solid var(--color-border);
    vertical-align: top;
  }
  tbody tr:nth-child(even) {
    background: var(--color-table-stripe);
  }

  /* Inline */
  strong { font-weight: 600; }
  em { font-style: italic; }
  code {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 9.5pt;
    background: #f1f5f9;
    padding: 0.1em 0.35em;
    border-radius: 3px;
    color: #be185d;
  }
  pre {
    background: #f8fafc;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 0.75rem 1rem;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.5;
    margin-bottom: 1rem;
  }
  pre code {
    background: none;
    padding: 0;
    color: var(--color-text);
  }

  /* Blockquote */
  blockquote {
    border-left: 4px solid var(--color-accent);
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    background: var(--color-accent-light);
    color: var(--color-muted);
    font-style: italic;
  }
  blockquote p:last-child { margin-bottom: 0; }

  /* Horizontal rule */
  hr {
    border: none;
    border-top: 2px solid var(--color-border);
    margin: 1.5rem 0;
  }

  /* Viability report section */
  .viability-report {
    margin-top: 2rem;
    padding: 1.25rem;
    background: var(--color-viability-bg);
    border: 2px solid var(--color-viability-border);
    border-radius: 6px;
    page-break-before: always;
  }
  .viability-report h2 {
    color: #92400e;
    border-bottom-color: var(--color-viability-border);
    margin-top: 0;
  }

  /* Footer */
  .doc-footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    text-align: center;
    font-size: 9pt;
    color: var(--color-muted);
  }

  /* Print button (hidden in print) */
  .print-toolbar {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    gap: 0.5rem;
    z-index: 100;
  }
  .print-toolbar button {
    padding: 0.5rem 1rem;
    font-size: 10pt;
    font-weight: 500;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    background: white;
    color: var(--color-text);
    transition: all 0.15s;
  }
  .print-toolbar button:hover {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }
</style>
</head>
<body>

<div class="print-toolbar no-print">
  <button onclick="window.print()">📄 Print / Save PDF</button>
</div>

<div class="doc-header">
  <h1>${escapeHtml(title)}</h1>
  <div class="subtitle">Generated by Chapterhouse Council &mdash; ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
</div>

<div class="scope-content">
${mainHtml}
</div>

${councilReportHtml ? `
<div class="viability-report">
  <h2>Council Assessment Reports</h2>
  ${councilReportHtml}
</div>
` : ""}

<div class="doc-footer">
  SomersSchool Curriculum &mdash; Chapterhouse Council Output
</div>

</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Downloads content as a styled HTML file (client-side).
 */
export function downloadAsHtml(
  filename: string,
  markdown: string,
  title: string,
  options?: { includeCouncilReport?: boolean; councilReportMarkdown?: string }
) {
  const html = markdownToStyledHtml(markdown, title, options);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/\.md$/, ".html");
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Opens a new window with the styled HTML document and triggers the print dialog
 * (which includes "Save as PDF" on all modern OSs).
 */
export function exportAsPdf(
  markdown: string,
  title: string,
  options?: { includeCouncilReport?: boolean; councilReportMarkdown?: string }
) {
  const html = markdownToStyledHtml(markdown, title, options);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups for PDF export.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  // Wait for fonts and content to load before triggering print
  printWindow.addEventListener("load", () => {
    setTimeout(() => printWindow.print(), 300);
  });
}

/**
 * Generates a .doc file (Word-compatible HTML) and downloads it.
 * Uses the Word HTML format which opens perfectly in Microsoft Word.
 */
export function downloadAsDocx(
  filename: string,
  markdown: string,
  title: string,
  options?: { includeCouncilReport?: boolean; councilReportMarkdown?: string }
) {
  const mainHtml = marked.parse(markdown, { async: false }) as string;
  const councilReportHtml = options?.includeCouncilReport && options.councilReportMarkdown
    ? marked.parse(options.councilReportMarkdown, { async: false }) as string
    : null;

  const wordHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  body {
    font-family: 'Calibri', 'Segoe UI', sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a2e;
    margin: 1in;
  }
  h1 {
    font-family: 'Cambria', Georgia, serif;
    font-size: 20pt;
    font-weight: bold;
    color: #0f0f23;
    margin-top: 24pt;
    margin-bottom: 8pt;
    border-bottom: 2pt solid #d1d5db;
    padding-bottom: 4pt;
  }
  h2 {
    font-family: 'Cambria', Georgia, serif;
    font-size: 16pt;
    font-weight: bold;
    color: #0f0f23;
    margin-top: 18pt;
    margin-bottom: 6pt;
  }
  h3 {
    font-size: 13pt;
    font-weight: bold;
    color: #0f0f23;
    margin-top: 14pt;
    margin-bottom: 4pt;
  }
  h4 {
    font-size: 11pt;
    font-weight: bold;
    color: #555;
    margin-top: 10pt;
    margin-bottom: 3pt;
  }
  p { margin-bottom: 6pt; }
  ul, ol { margin-bottom: 6pt; padding-left: 24pt; }
  li { margin-bottom: 2pt; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0 12pt;
    font-size: 10pt;
  }
  th {
    background: #1e293b;
    color: #fff;
    font-weight: bold;
    text-align: left;
    padding: 5pt 8pt;
    border: 1pt solid #1e293b;
  }
  td {
    padding: 4pt 8pt;
    border: 1pt solid #d1d5db;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f9fafb; }
  blockquote {
    border-left: 3pt solid #2563eb;
    margin: 8pt 0;
    padding: 4pt 12pt;
    color: #555;
    font-style: italic;
  }
  hr { border: none; border-top: 1pt solid #d1d5db; margin: 12pt 0; }
  code {
    font-family: 'Consolas', monospace;
    font-size: 9.5pt;
    background: #f1f5f9;
    padding: 1pt 3pt;
  }
  .viability-section {
    margin-top: 24pt;
    padding: 12pt;
    background: #fef9ee;
    border: 2pt solid #d97706;
  }
  .viability-section h2 {
    color: #92400e;
    margin-top: 0;
  }
  .doc-title {
    text-align: center;
    padding-bottom: 12pt;
    margin-bottom: 18pt;
    border-bottom: 3pt solid #0f0f23;
  }
  .doc-title h1 { border-bottom: none; margin-top: 0; font-size: 22pt; }
  .doc-subtitle {
    font-size: 10pt;
    color: #555;
    margin-top: 6pt;
  }
</style>
</head>
<body>

<div class="doc-title">
  <h1>${escapeHtml(title)}</h1>
  <div class="doc-subtitle">Generated by Chapterhouse Council &mdash; ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
</div>

${mainHtml}

${councilReportHtml ? `
<div class="viability-section">
  <h2>Council Assessment Reports</h2>
  ${councilReportHtml}
</div>
` : ""}

</body>
</html>`;

  const blob = new Blob(["\ufeff", wordHtml], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/\.(md|html)$/, ".doc");
  a.click();
  URL.revokeObjectURL(url);
}
