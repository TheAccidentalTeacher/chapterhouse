/**
 * docx-builder.ts
 *
 * Programmatic .docx generation using the `docx` npm library.
 * Replaces html-to-docx for professional, print-ready Word documents.
 *
 * RULES (from Claude.ai SKILL.md — hard-won gotcha prevention):
 *   1. Page size MUST be US Letter: width 12240, height 15840 (DXA)
 *   2. 1440 DXA = 1 inch. All spacing math flows from this.
 *   3. Column widths must be set on BOTH table AND each cell.
 *   4. Never use WidthType.PERCENTAGE — breaks Google Docs. Always DXA.
 *   5. Use ShadingType.CLEAR not SOLID — SOLID produces black backgrounds.
 *   6. PageBreak must be inside a Paragraph — standalone is invalid XML.
 *   7. Never use \n in text runs — create separate Paragraph elements.
 *   8. Bullets require numbering.config definition, not unicode characters.
 *   9. Hex colors are 6-digit without #.
 *
 * Content width calculation:
 *   Page: 12240 DXA (8.5")
 *   Margins: 1080 DXA each side (0.75")
 *   Content width: 12240 - 2160 = 10080 DXA (7")
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  LevelFormat,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  type IParagraphOptions,
  type ITableCellBorders,
  ExternalHyperlink,
  Tab,
  TabStopPosition,
  TabStopType,
} from "docx";

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_WIDTH = 12240; // 8.5" in DXA
const PAGE_HEIGHT = 15840; // 11" in DXA
const MARGIN = 1080; // 0.75" in DXA
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 10080 DXA = 7"

// Chapterhouse brand colors (gold/amber theme)
const COLORS = {
  primary: "C87800", // Amber/gold
  primaryLight: "FFF8E7", // Very light amber
  primaryMedium: "FFE8B0", // Medium amber
  accent: "1A5276", // Deep blue for contrast
  accentLight: "EBF5FB", // Light blue
  heading: "1A1A1A", // Near-black
  body: "2D2D2D", // Dark gray
  muted: "666666", // Medium gray
  border: "D4D4D4", // Light gray border
  borderAccent: "C87800", // Amber border
  white: "FFFFFF",
  tableHeader: "1A5276", // Deep blue for table headers
  tableHeaderText: "FFFFFF", // White text on headers
  tableStripe: "F8F9FA", // Very light gray for alternating rows
};

// Standard border for tables
const STANDARD_BORDER: ITableCellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
};

const NO_BORDER: ITableCellBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

// ── Markdown Parser ──────────────────────────────────────────────────────────

interface MdBlock {
  type: "h1" | "h2" | "h3" | "paragraph" | "bullet" | "numbered" | "blockquote" | "hr" | "table" | "code";
  text: string;
  items?: string[]; // for lists
  rows?: string[][]; // for tables
  level?: number; // for nested bullets
}

/**
 * Parse markdown content into structural blocks.
 * This is intentionally simple — handles the markdown patterns
 * Claude actually produces in Doc Studio, not every edge case.
 */
function parseMarkdown(content: string): MdBlock[] {
  const lines = content.split("\n");
  const blocks: MdBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: trimmed.slice(2).trim() });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(trimmed)) {
      blocks.push({ type: "hr", text: "" });
      i++;
      continue;
    }

    // Table (detect by pipe character starting a line)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      // Parse table: first row is header, second is separator (skip), rest are data
      const rows = tableLines
        .filter((l) => !/^[|\s:-]+$/.test(l)) // skip separator rows
        .map((l) =>
          l
            .split("|")
            .slice(1, -1) // remove leading/trailing empty from split
            .map((cell) => cell.trim())
        );
      blocks.push({ type: "table", text: "", rows });
      continue;
    }

    // Code block (fenced)
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++; // skip opening fence
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join("\n") });
      continue;
    }

    // Bullet list
    if (/^[-*+]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s/.test(lines[i])) {
        // Capture indent level for sub-bullets
        items.push(lines[i].replace(/^\s*[-*+]\s/, "").trim());
        i++;
      }
      blocks.push({ type: "bullet", text: "", items });
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s/, "").trim());
        i++;
      }
      blocks.push({ type: "numbered", text: "", items });
      continue;
    }

    // Regular paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("```") &&
      !/^[-*_]{3,}\s*$/.test(lines[i].trim()) &&
      !/^[-*+]\s/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }

  return blocks;
}

// ── Inline Formatting Parser ──────────────────────────────────────────────────

interface InlineSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  link?: string;
}

/**
 * Parse inline markdown formatting: **bold**, *italic*, [links](url)
 */
function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  // Pattern: **bold**, *italic*, [text](url), or plain text
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[(.+?)\]\((.+?)\))|([^*[]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // Bold
      segments.push({ text: match[2], bold: true });
    } else if (match[4]) {
      // Italic
      segments.push({ text: match[4], italic: true });
    } else if (match[6] && match[7]) {
      // Link
      segments.push({ text: match[6], link: match[7] });
    } else if (match[8]) {
      // Plain text
      segments.push({ text: match[8] });
    }
  }

  if (segments.length === 0) {
    segments.push({ text });
  }

  return segments;
}

/**
 * Convert inline segments to TextRun array
 */
function inlineToRuns(
  text: string,
  baseOpts: { size?: number; color?: string; font?: string } = {}
): (TextRun | ExternalHyperlink)[] {
  const segments = parseInline(text);
  const font = baseOpts.font || "Calibri";
  const size = baseOpts.size || 22; // 11pt
  const color = baseOpts.color || COLORS.body;

  return segments.map((seg) => {
    if (seg.link) {
      return new ExternalHyperlink({
        children: [
          new TextRun({
            text: seg.text,
            font,
            size,
            color: COLORS.accent,
            underline: { type: "single" },
          }),
        ],
        link: seg.link,
      });
    }
    return new TextRun({
      text: seg.text,
      font,
      size,
      color,
      bold: seg.bold || false,
      italics: seg.italic || false,
    });
  });
}

// ── Element Builders ─────────────────────────────────────────────────────────

function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: inlineToRuns(text, {
      size: 36, // 18pt
      color: COLORS.heading,
      font: "Calibri",
    }),
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderAccent, space: 4 },
    },
    children: inlineToRuns(text, {
      size: 28, // 14pt
      color: COLORS.accent,
      font: "Calibri",
    }),
  });
}

function heading3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: inlineToRuns(text, {
      size: 24, // 12pt
      color: COLORS.heading,
      font: "Calibri",
    }),
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: inlineToRuns(text, { size: 22, color: COLORS.body }),
  });
}

function spacer(pts: number = 6): Paragraph {
  return new Paragraph({
    spacing: { before: pts * 20, after: 0 },
    children: [],
  });
}

function divider(): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.border, space: 4 },
    },
    children: [],
  });
}

function pageBreak(): Paragraph {
  // RULE 6: PageBreak must be inside a Paragraph
  return new Paragraph({ children: [new PageBreak()] });
}

/**
 * Callout / shaded box — single-cell table with colored background and left border.
 * Used for blockquotes, highlights, warnings.
 */
function shadeBox(
  children: Paragraph[],
  opts: { fill?: string; borderColor?: string } = {}
): Table {
  const fill = opts.fill || COLORS.primaryLight;
  const borderColor = opts.borderColor || COLORS.borderAccent;

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE, size: 0 },
              bottom: { style: BorderStyle.NONE, size: 0 },
              // RULE 5: ShadingType.CLEAR not SOLID
              left: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
              right: { style: BorderStyle.NONE, size: 0 },
            },
            shading: { fill, type: ShadingType.CLEAR },
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 160, right: 120 },
            children,
          }),
        ],
      }),
    ],
  });
}

/**
 * Build a proper table from parsed markdown rows.
 * First row is treated as header with dark background.
 */
function buildTable(rows: string[][]): Table {
  if (!rows.length) return new Table({ rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph("")] })] })] });

  const colCount = rows[0].length;
  const colWidth = Math.floor(CONTENT_WIDTH / colCount);
  const columnWidths = Array(colCount).fill(colWidth);
  // Adjust last column to absorb rounding
  columnWidths[colCount - 1] = CONTENT_WIDTH - colWidth * (colCount - 1);

  const tableRows = rows.map((row, rowIdx) => {
    const isHeader = rowIdx === 0;
    const isStripe = rowIdx > 0 && rowIdx % 2 === 0;

    const cells = row.map((cellText, colIdx) =>
      new TableCell({
        borders: STANDARD_BORDER,
        // RULE 3: width on BOTH table AND each cell
        width: { size: columnWidths[colIdx], type: WidthType.DXA },
        // RULE 5: ShadingType.CLEAR
        shading: {
          fill: isHeader ? COLORS.tableHeader : isStripe ? COLORS.tableStripe : COLORS.white,
          type: ShadingType.CLEAR,
        },
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: inlineToRuns(cellText, {
              size: 20, // 10pt for tables
              color: isHeader ? COLORS.tableHeaderText : COLORS.body,
              font: "Calibri",
            }),
          }),
        ],
      })
    );

    // Pad short rows with empty cells
    while (cells.length < colCount) {
      cells.push(
        new TableCell({
          borders: STANDARD_BORDER,
          width: { size: columnWidths[cells.length], type: WidthType.DXA },
          shading: {
            fill: isHeader ? COLORS.tableHeader : COLORS.white,
            type: ShadingType.CLEAR,
          },
          children: [new Paragraph("")],
        })
      );
    }

    return new TableRow({ children: cells });
  });

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    // RULE 3: columnWidths on the table
    columnWidths,
    rows: tableRows,
  });
}

/**
 * Build a code block with monospace font and gray background.
 */
function codeBlock(text: string): Table {
  // RULE 7: No \n in text runs — separate Paragraphs per line
  const codeLines = text.split("\n").map(
    (line) =>
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: line || " ", // empty lines need at least a space
            font: "Consolas",
            size: 18, // 9pt
            color: COLORS.body,
          }),
        ],
      })
  );

  return shadeBox(codeLines, { fill: "F5F5F5", borderColor: COLORS.border });
}

// ── Structured Document Block Types ─────────────────────────────────────────
//
// These types define the structured JSON format for building documents.
// Any caller (Doc Studio, chat, API) can produce these blocks and get
// professional Word output. The markdown parser also converts to these
// blocks internally — ONE rendering engine for everything.

export type DocBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet_list"; items: string[] }
  | { type: "numbered_list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; text: string; style?: "info" | "warning" | "success" | "tip" }
  | { type: "code"; text: string; language?: string }
  | { type: "divider" }
  | { type: "page_break" }
  | { type: "spacer"; points?: number }
  | { type: "label_value"; pairs: { label: string; value: string }[] }
  | { type: "fill_line"; label: string; lineWidth?: number }
  | { type: "checklist"; items: { text: string; checked?: boolean }[] }
  | { type: "two_column"; left: string; right: string };

export interface DocBlockDocument {
  title: string;
  subtitle?: string;
  docType?: string;
  date?: string;
  blocks: DocBlock[];
}

// Callout style → color mapping
const CALLOUT_STYLES: Record<string, { fill: string; border: string }> = {
  info: { fill: COLORS.accentLight, border: COLORS.accent },
  warning: { fill: "FEF3CD", border: "D4A017" },
  success: { fill: "D4EDDA", border: "28A745" },
  tip: { fill: COLORS.primaryLight, border: COLORS.borderAccent },
};

// ── Block Renderer ─────────────────────────────────────────────────────────

/**
 * Render a single DocBlock into docx elements.
 * Returns elements and a flag if a new numbered list config is needed.
 */
function renderBlock(
  block: DocBlock,
  numberedListCounter: { count: number }
): (Paragraph | Table)[] {
  switch (block.type) {
    case "heading":
      if (block.level === 1) return [heading1(block.text)];
      if (block.level === 2) return [heading2(block.text)];
      return [heading3(block.text)];

    case "paragraph":
      return [bodyParagraph(block.text)];

    case "bullet_list":
      return block.items.map(
        (item) =>
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { before: 30, after: 30 },
            children: inlineToRuns(item, { size: 22, color: COLORS.body }),
          })
      );

    case "numbered_list": {
      numberedListCounter.count++;
      const ref = `numbered-${numberedListCounter.count}`;
      return block.items.map(
        (item) =>
          new Paragraph({
            numbering: { reference: ref, level: 0 },
            spacing: { before: 30, after: 30 },
            children: inlineToRuns(item, { size: 22, color: COLORS.body }),
          })
      );
    }

    case "table": {
      const allRows = [block.headers, ...block.rows];
      return [spacer(4), buildTable(allRows), spacer(4)];
    }

    case "callout": {
      const style = CALLOUT_STYLES[block.style || "tip"] || CALLOUT_STYLES.tip;
      const lines = block.text.split("\n");
      return [
        shadeBox(
          lines.map(
            (line) =>
              new Paragraph({
                spacing: { before: 20, after: 20 },
                children: inlineToRuns(line, { size: 22, color: COLORS.muted }),
              })
          ),
          { fill: style.fill, borderColor: style.border }
        ),
      ];
    }

    case "code":
      return [spacer(4), codeBlock(block.text), spacer(4)];

    case "divider":
      return [divider()];

    case "page_break":
      return [pageBreak()];

    case "spacer":
      return [spacer(block.points || 6)];

    case "label_value": {
      // Render as a clean two-column mini-table (no header row)
      const rows = block.pairs.map((p) => [p.label, p.value]);
      const labelWidth = Math.floor(CONTENT_WIDTH * 0.3);
      const valueWidth = CONTENT_WIDTH - labelWidth;
      const tableRows = rows.map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                borders: NO_BORDER,
                width: { size: labelWidth, type: WidthType.DXA },
                margins: { top: 30, bottom: 30, left: 60, right: 60 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: label,
                        font: "Calibri",
                        size: 20,
                        color: COLORS.muted,
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: NO_BORDER,
                width: { size: valueWidth, type: WidthType.DXA },
                margins: { top: 30, bottom: 30, left: 60, right: 60 },
                children: [
                  new Paragraph({
                    children: inlineToRuns(value, { size: 20, color: COLORS.body }),
                  }),
                ],
              }),
            ],
          })
      );
      return [
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [labelWidth, valueWidth],
          rows: tableRows,
        }),
      ];
    }

    case "fill_line": {
      // "Name: _______________" style for worksheets/forms
      const lineLen = block.lineWidth || 40;
      const underscores = "_".repeat(lineLen);
      return [
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text: `${block.label}: `,
              font: "Calibri",
              size: 22,
              color: COLORS.body,
              bold: true,
            }),
            new TextRun({
              text: underscores,
              font: "Calibri",
              size: 22,
              color: COLORS.border,
            }),
          ],
        }),
      ];
    }

    case "checklist":
      return block.items.map(
        (item) =>
          new Paragraph({
            spacing: { before: 30, after: 30 },
            indent: { left: 360 },
            children: [
              new TextRun({
                text: item.checked ? "☑ " : "☐ ",
                font: "Segoe UI Symbol",
                size: 22,
                color: COLORS.body,
              }),
              ...inlineToRuns(item.text, { size: 22, color: COLORS.body }),
            ],
          })
      );

    case "two_column": {
      const halfWidth = Math.floor(CONTENT_WIDTH / 2);
      return [
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [halfWidth, CONTENT_WIDTH - halfWidth],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: NO_BORDER,
                  width: { size: halfWidth, type: WidthType.DXA },
                  margins: { top: 40, bottom: 40, left: 60, right: 120 },
                  verticalAlign: VerticalAlign.TOP,
                  children: block.left
                    .split("\n")
                    .map(
                      (line) =>
                        new Paragraph({
                          spacing: { before: 20, after: 20 },
                          children: inlineToRuns(line, { size: 22, color: COLORS.body }),
                        })
                    ),
                }),
                new TableCell({
                  borders: NO_BORDER,
                  width: { size: CONTENT_WIDTH - halfWidth, type: WidthType.DXA },
                  margins: { top: 40, bottom: 40, left: 120, right: 60 },
                  verticalAlign: VerticalAlign.TOP,
                  children: block.right
                    .split("\n")
                    .map(
                      (line) =>
                        new Paragraph({
                          spacing: { before: 20, after: 20 },
                          children: inlineToRuns(line, { size: 22, color: COLORS.body }),
                        })
                    ),
                }),
              ],
            }),
          ],
        }),
      ];
    }

    default:
      return [];
  }
}

// ── Document Assembly (shared engine) ───────────────────────────────────────

/**
 * Assemble a complete docx Document from title metadata and docx element children.
 * Shared by both buildDocxFromBlocks() and markdownToDocx().
 */
function assembleDocument(
  title: string,
  docType: string | undefined,
  date: string | undefined,
  subtitle: string | undefined,
  docBlocks: DocBlock[],
): { doc: Document; } {
  const children: (Paragraph | Table)[] = [];
  const numberedListCounter = { count: 0 };

  // Title page header
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: "CHAPTERHOUSE",
          font: "Calibri",
          size: 16,
          color: COLORS.muted,
          allCaps: true,
          characterSpacing: 160,
        }),
      ],
    })
  );

  // Document title
  children.push(
    new Paragraph({
      spacing: { before: 80, after: subtitle ? 40 : 200 },
      children: [
        new TextRun({
          text: title || "Untitled Document",
          font: "Calibri",
          size: 44,
          color: COLORS.heading,
          bold: true,
        }),
      ],
    })
  );

  // Optional subtitle
  if (subtitle) {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 160 },
        children: [
          new TextRun({
            text: subtitle,
            font: "Calibri",
            size: 24,
            color: COLORS.muted,
            italics: true,
          }),
        ],
      })
    );
  }

  // Date and type metadata
  const today = date || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const metaText = docType ? `${docType.toUpperCase()} — ${today}` : today;
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 40 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 3,
          color: COLORS.borderAccent,
          space: 8,
        },
      },
      children: [
        new TextRun({
          text: metaText,
          font: "Calibri",
          size: 18,
          color: COLORS.muted,
        }),
      ],
    })
  );

  children.push(spacer(12));

  // Render all blocks through the shared renderer
  for (const block of docBlocks) {
    const elements = renderBlock(block, numberedListCounter);
    children.push(...elements);
  }

  // Build numbered list configs dynamically
  const numberedConfigs = [];
  for (let n = 1; n <= numberedListCounter.count; n++) {
    numberedConfigs.push({
      reference: `numbered-${n}`,
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.START,
          style: {
            paragraph: { indent: { left: 720, hanging: 360 } },
            run: { font: "Calibri", size: 22 },
          },
        },
      ],
    });
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
            {
              level: 1,
              format: LevelFormat.BULLET,
              text: "\u25E6",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 1440, hanging: 360 } },
              },
            },
          ],
        },
        ...numberedConfigs,
      ],
    },
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { font: "Calibri", size: 22, color: COLORS.body },
          paragraph: { spacing: { line: 276 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Chapterhouse",
                    font: "Calibri",
                    size: 16,
                    color: COLORS.muted,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page ", font: "Calibri", size: 16, color: COLORS.muted }),
                  new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: COLORS.muted }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return { doc };
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Build a .docx from structured JSON blocks.
 * This is the PRIMARY rendering path — produces rich Word output that
 * markdown alone cannot express (callouts, checklists, fill-lines,
 * two-column layouts, colored tables, label-value pairs).
 *
 * Use this when the caller can produce structured blocks (API, chat artifacts).
 */
export async function buildDocxFromBlocks(input: DocBlockDocument): Promise<Buffer> {
  const { doc } = assembleDocument(
    input.title,
    input.docType,
    input.date,
    input.subtitle,
    input.blocks
  );
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

/**
 * Convert markdown content to a professional .docx buffer.
 * Parses markdown into DocBlock[] then renders through the shared block engine.
 * This means markdown and structured JSON produce identical output quality.
 *
 * @param title - Document title (shown as H1 on first page)
 * @param content - Raw markdown content from documents table
 * @param docType - Optional doc type ID for type-specific styling
 * @returns Buffer containing valid .docx file
 */
export async function markdownToDocx(
  title: string,
  content: string,
  docType?: string
): Promise<Buffer> {
  const mdBlocks = parseMarkdown(content);
  const docBlocks = mdBlocksToDocBlocks(mdBlocks);
  const { doc } = assembleDocument(title, docType, undefined, undefined, docBlocks);
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

/**
 * Convert parsed MdBlock[] to DocBlock[] — bridges the markdown parser
 * to the shared block rendering engine.
 */
function mdBlocksToDocBlocks(mdBlocks: MdBlock[]): DocBlock[] {
  return mdBlocks.map((mb): DocBlock => {
    switch (mb.type) {
      case "h1": return { type: "heading", level: 1, text: mb.text };
      case "h2": return { type: "heading", level: 2, text: mb.text };
      case "h3": return { type: "heading", level: 3, text: mb.text };
      case "paragraph": return { type: "paragraph", text: mb.text };
      case "bullet": return { type: "bullet_list", items: mb.items || [] };
      case "numbered": return { type: "numbered_list", items: mb.items || [] };
      case "blockquote": return { type: "callout", text: mb.text, style: "info" };
      case "hr": return { type: "divider" };
      case "code": return { type: "code", text: mb.text };
      case "table": {
        const rows = mb.rows || [];
        return {
          type: "table",
          headers: rows[0] || [],
          rows: rows.slice(1),
        };
      }
      default: return { type: "paragraph", text: mb.text };
    }
  });
}
