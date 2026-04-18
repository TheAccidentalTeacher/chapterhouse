#!/usr/bin/env node
// Build a self-contained HTML index of all lineup-*.md files.
// Output: docs/agents/agents-index.html (open directly in browser)
// Re-run any time files are added or edited.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = __dirname;
const OUTPUT = path.join(AGENTS_DIR, "agents-index.html");

const CATEGORY_RANGES = [
  { min: 1, max: 36, label: "TV & Film Classics", color: "#e08a3c" },
  { min: 37, max: 72, label: "Historical Voices", color: "#c97a4f" },
  { min: 73, max: 103, label: "Video Games", color: "#7ab3e0" },
  { min: 104, max: 134, label: "Literature & Anime", color: "#b576d4" },
  { min: 135, max: 165, label: "Genre Worlds", color: "#5fb88f" },
  { min: 166, max: 196, label: "Game Worlds & Communities", color: "#3c9eb8" },
  { min: 197, max: 222, label: "Animation, Comics & Sci-Fi", color: "#d4a80e" },
];

function categoryFor(num) {
  return CATEGORY_RANGES.find((c) => num >= c.min && num <= c.max) ?? {
    label: "Uncategorized",
    color: "#888",
  };
}

function parseLineup(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const filename = path.basename(filePath);

  // Title: "# Lineup 001 — The Newsroom Bullpen"
  const titleMatch = raw.match(/^#\s*Lineup\s+(\d+)\s*[—-]\s*(.+?)\s*$/m);
  if (!titleMatch) return null;
  const number = parseInt(titleMatch[1], 10);
  const name = titleMatch[2].trim();

  // Tagline (first blockquote line after title)
  const taglineMatch = raw.match(/^>\s*(.+?)\s*$/m);
  const tagline = taglineMatch ? taglineMatch[1] : "";

  // Table rows: | N | Role | Character | Why |
  const passes = [];
  const tableRowRegex = /^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;
  let m;
  while ((m = tableRowRegex.exec(raw)) !== null) {
    passes.push({
      pass: parseInt(m[1], 10),
      role: m[2].trim(),
      character: m[3].trim(),
      why: m[4].trim(),
    });
  }

  // Content Superpower
  const superpowerMatch = raw.match(/\*\*Content Superpower:\*\*\s*(.+?)(?:\n\n|\n\*\*|$)/s);
  const superpower = superpowerMatch ? superpowerMatch[1].trim().replace(/\s+/g, " ") : "";

  // Influencer DNA
  const influencerMatch = raw.match(/\*\*Influencer DNA:\*\*\s*(.+?)(?:\n\n|\n\*\*|$)/s);
  const influencer = influencerMatch ? influencerMatch[1].trim().replace(/\s+/g, " ") : "";

  const cat = categoryFor(number);

  return {
    number,
    slug: filename.replace(/\.md$/, ""),
    name,
    tagline,
    passes,
    superpower,
    influencer,
    category: cat.label,
    categoryColor: cat.color,
    rawMarkdown: raw,
  };
}

function loadAll() {
  const files = fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => /^lineup-\d+.+\.md$/.test(f))
    .sort();

  const lineups = [];
  for (const f of files) {
    const parsed = parseLineup(path.join(AGENTS_DIR, f));
    if (parsed && parsed.passes.length === 6) {
      lineups.push(parsed);
    } else {
      console.warn(`Skipping (parse failed or wrong pass count): ${f}`);
    }
  }
  return lineups;
}

function escapeForScript(json) {
  // Prevent </script> injection inside the inline JSON
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function buildHtml(lineups) {
  const dataJson = escapeForScript(JSON.stringify(lineups));
  const categoriesJson = escapeForScript(JSON.stringify(CATEGORY_RANGES));
  const builtAt = new Date().toISOString();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Council Lineup Index — ${lineups.length} teams</title>
<style>
  :root {
    --bg: #0e0b02;
    --bg-elev: #1a1505;
    --bg-card: #221a08;
    --bg-card-hover: #2a2009;
    --border: #3a2d10;
    --gold: #d4a80e;
    --gold-dim: #8b5e00;
    --text: #f0e8cc;
    --text-dim: #a89d7a;
    --text-faint: #6b6450;
    --accent: #e8b923;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  a { color: var(--gold); text-decoration: none; }
  a:hover { text-decoration: underline; }

  header { position: sticky; top: 0; z-index: 50; background: var(--bg-elev); border-bottom: 1px solid var(--border); padding: 16px 24px; }
  .title { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
  .title h1 { margin: 0; color: var(--gold); font-size: 20px; font-weight: 600; letter-spacing: 0.02em; }
  .title .stats { color: var(--text-dim); font-size: 13px; }
  .title .built { color: var(--text-faint); font-size: 11px; margin-left: auto; font-family: ui-monospace, "SF Mono", Menlo, monospace; }

  .controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
  .search {
    flex: 1 1 320px; min-width: 240px;
    background: var(--bg); border: 1px solid var(--border); color: var(--text);
    padding: 10px 14px; font-size: 14px; border-radius: 6px;
    transition: border-color 0.15s;
  }
  .search:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 2px rgba(212, 168, 14, 0.15); }

  select, button {
    background: var(--bg); border: 1px solid var(--border); color: var(--text);
    padding: 9px 12px; font-size: 13px; border-radius: 6px; cursor: pointer;
    font-family: inherit;
  }
  button:hover, select:hover { border-color: var(--gold-dim); }
  button.primary { background: var(--gold); color: #1a1505; border-color: var(--gold); font-weight: 600; }
  button.primary:hover { background: var(--accent); }

  .chips { display: flex; gap: 6px; flex-wrap: wrap; padding: 12px 24px 0; background: var(--bg-elev); border-bottom: 1px solid var(--border); }
  .chip {
    background: var(--bg); border: 1px solid var(--border); color: var(--text-dim);
    padding: 5px 11px; font-size: 12px; border-radius: 999px; cursor: pointer;
    transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px;
    margin-bottom: 12px;
  }
  .chip:hover { border-color: var(--gold-dim); color: var(--text); }
  .chip.active { background: var(--gold); color: #1a1505; border-color: var(--gold); font-weight: 600; }
  .chip .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--cat); }
  .chip.active .dot { background: #1a1505; }

  main { padding: 20px 24px 80px; max-width: 1600px; margin: 0 auto; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
  .grid.list { grid-template-columns: 1fr; }

  .card {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px;
    padding: 14px 16px; cursor: pointer; transition: all 0.15s;
    position: relative; overflow: hidden;
  }
  .card:hover { background: var(--bg-card-hover); border-color: var(--gold-dim); transform: translateY(-1px); }
  .card.pinned { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold); }

  .card-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
  .card-num { color: var(--gold); font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 12px; font-weight: 600; flex-shrink: 0; }
  .card-name { color: var(--text); font-size: 15px; font-weight: 600; line-height: 1.3; flex: 1; }
  .card-pin { background: none; border: none; color: var(--text-faint); cursor: pointer; font-size: 16px; padding: 0; line-height: 1; flex-shrink: 0; }
  .card-pin:hover { color: var(--gold); }
  .card.pinned .card-pin { color: var(--gold); }

  .card-cat { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-dim); margin-bottom: 8px; }
  .card-cat .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cat); }

  .card-tagline { color: var(--text-dim); font-size: 13px; font-style: italic; margin-bottom: 10px; line-height: 1.4; }
  .card-super { color: var(--text); font-size: 12px; line-height: 1.5; margin-bottom: 8px; }
  .card-super strong { color: var(--gold-dim); }
  .card-chars { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
  .char-chip { background: rgba(212, 168, 14, 0.08); border: 1px solid var(--border); color: var(--text-dim); font-size: 10px; padding: 2px 7px; border-radius: 3px; }

  /* List view layout */
  .grid.list .card { padding: 10px 14px; }
  .grid.list .card-tagline { display: none; }
  .grid.list .card-super { display: none; }
  .grid.list .card-chars { display: none; }
  .grid.list .card-cat { display: inline-flex; margin-bottom: 0; margin-left: 12px; }
  .grid.list .card-header { margin-bottom: 0; align-items: center; }

  /* Empty state */
  .empty { text-align: center; padding: 80px 20px; color: var(--text-dim); }
  .empty h2 { color: var(--gold); margin: 0 0 8px; font-size: 18px; }

  /* Modal */
  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: none; z-index: 100; padding: 20px; overflow-y: auto; }
  .modal-bg.active { display: block; }
  .modal {
    background: var(--bg-elev); border: 1px solid var(--gold-dim); border-radius: 12px;
    max-width: 900px; margin: 40px auto; padding: 28px 32px; position: relative;
  }
  .modal-close { position: absolute; top: 14px; right: 18px; background: none; border: none; color: var(--text-dim); font-size: 28px; cursor: pointer; padding: 0; line-height: 1; }
  .modal-close:hover { color: var(--gold); }
  .modal h2 { color: var(--gold); margin: 0 0 4px; font-size: 22px; }
  .modal .modal-num { color: var(--text-dim); font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 13px; }
  .modal .modal-tagline { color: var(--text); font-style: italic; font-size: 15px; margin: 12px 0 20px; padding-left: 14px; border-left: 3px solid var(--gold-dim); }

  .pass-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  .pass-table th { background: var(--bg-card); color: var(--gold-dim); text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--border); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .pass-table td { padding: 11px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
  .pass-table tr:last-child td { border-bottom: none; }
  .pass-table .pass-num { color: var(--gold); font-family: ui-monospace, "SF Mono", Menlo, monospace; width: 30px; }
  .pass-table .pass-role { color: var(--text); font-weight: 600; width: 110px; }
  .pass-table .pass-char { color: var(--accent); font-weight: 500; width: 180px; }
  .pass-table .pass-why { color: var(--text-dim); }

  .modal-meta { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 20px; }
  .meta-block { background: var(--bg-card); border-left: 3px solid var(--gold-dim); padding: 12px 16px; border-radius: 4px; }
  .meta-block strong { color: var(--gold); display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .meta-block span { color: var(--text); font-size: 13px; line-height: 1.5; }

  .modal-actions { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }

  /* Pinboard sidebar */
  .pinboard { position: fixed; top: 0; right: 0; bottom: 0; width: 360px; background: var(--bg-elev); border-left: 1px solid var(--gold-dim); transform: translateX(100%); transition: transform 0.2s; z-index: 90; display: flex; flex-direction: column; }
  .pinboard.open { transform: translateX(0); }
  .pinboard-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .pinboard-header h3 { margin: 0; color: var(--gold); font-size: 15px; }
  .pinboard-list { flex: 1; overflow-y: auto; padding: 10px 16px; }
  .pin-item { background: var(--bg-card); border: 1px solid var(--border); border-radius: 4px; padding: 8px 10px; margin-bottom: 8px; font-size: 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .pin-item .pin-name { flex: 1; color: var(--text); }
  .pin-item button { padding: 2px 8px; font-size: 11px; }
  .pinboard-actions { padding: 14px 16px; border-top: 1px solid var(--border); display: flex; gap: 8px; flex-wrap: wrap; }
  .pinboard-toggle { position: fixed; bottom: 24px; right: 24px; background: var(--gold); color: #1a1505; border: none; padding: 12px 18px; border-radius: 999px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.4); z-index: 80; }
  .pinboard-toggle:hover { background: var(--accent); }
  .pinboard-toggle .badge { background: #1a1505; color: var(--gold); padding: 2px 7px; border-radius: 999px; margin-left: 6px; font-size: 11px; }

  /* Highlight on search match */
  mark { background: rgba(212, 168, 14, 0.3); color: var(--text); padding: 1px 2px; border-radius: 2px; }

  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 5px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--gold-dim); }
</style>
</head>
<body>
<header>
  <div class="title">
    <h1>⚔ Council Lineup Index</h1>
    <span class="stats" id="stats"></span>
    <span class="built">Built ${builtAt}</span>
  </div>
  <div class="controls">
    <input class="search" id="search" type="search" placeholder="Search names, characters, superpowers, taglines, influencer DNA..." autocomplete="off" />
    <select id="sort">
      <option value="num-asc">Number ↑</option>
      <option value="num-desc">Number ↓</option>
      <option value="name-asc">Name A–Z</option>
      <option value="name-desc">Name Z–A</option>
    </select>
    <button id="view-toggle" title="Toggle grid/list view">▦ Grid</button>
    <button id="clear">Clear filters</button>
  </div>
</header>

<div class="chips" id="chips"></div>

<main>
  <div id="grid" class="grid"></div>
  <div id="empty" class="empty" style="display:none;">
    <h2>No lineups match your filters</h2>
    <p>Try clearing the search or category filters.</p>
  </div>
</main>

<button class="pinboard-toggle" id="pin-toggle">📌 Mission Roster <span class="badge" id="pin-count">0</span></button>

<aside class="pinboard" id="pinboard">
  <div class="pinboard-header">
    <h3>Mission Roster</h3>
    <button id="pin-close">✕</button>
  </div>
  <div class="pinboard-list" id="pinboard-list">
    <p style="color: var(--text-faint); font-size: 13px; text-align: center; padding: 20px 0;">Pin lineups from the grid to build a team for a task. Stays in your browser localStorage.</p>
  </div>
  <div class="pinboard-actions">
    <button id="export-md" class="primary">Copy as Markdown</button>
    <button id="export-json">Copy JSON</button>
    <button id="clear-pins">Clear all</button>
  </div>
</aside>

<div class="modal-bg" id="modal-bg">
  <div class="modal" id="modal"></div>
</div>

<script>
const LINEUPS = JSON.parse(${JSON.stringify(dataJson)});
const CATEGORIES = JSON.parse(${JSON.stringify(categoriesJson)});

const state = {
  search: "",
  category: "all",
  sort: "num-asc",
  view: "grid",
  pinned: JSON.parse(localStorage.getItem("agents-pinned") || "[]"),
};

const $ = (id) => document.getElementById(id);
const grid = $("grid");
const empty = $("empty");
const stats = $("stats");
const chipsEl = $("chips");

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const safe = query.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
  return escaped.replace(new RegExp("(" + safe + ")", "gi"), "<mark>$1</mark>");
}

function lineupMatchesSearch(l, q) {
  if (!q) return true;
  const lq = q.toLowerCase();
  if (l.name.toLowerCase().includes(lq)) return true;
  if (l.tagline.toLowerCase().includes(lq)) return true;
  if (l.superpower.toLowerCase().includes(lq)) return true;
  if (l.influencer.toLowerCase().includes(lq)) return true;
  if (l.category.toLowerCase().includes(lq)) return true;
  for (const p of l.passes) {
    if (p.character.toLowerCase().includes(lq)) return true;
    if (p.why.toLowerCase().includes(lq)) return true;
    if (p.role.toLowerCase().includes(lq)) return true;
  }
  return false;
}

function getFiltered() {
  let result = LINEUPS.filter((l) => {
    if (state.category !== "all" && l.category !== state.category) return false;
    if (!lineupMatchesSearch(l, state.search)) return false;
    return true;
  });
  result.sort((a, b) => {
    if (state.sort === "num-asc") return a.number - b.number;
    if (state.sort === "num-desc") return b.number - a.number;
    if (state.sort === "name-asc") return a.name.localeCompare(b.name);
    if (state.sort === "name-desc") return b.name.localeCompare(a.name);
    return 0;
  });
  return result;
}

function renderChips() {
  const counts = { all: LINEUPS.length };
  for (const l of LINEUPS) counts[l.category] = (counts[l.category] || 0) + 1;

  const allChip = '<button class="chip ' + (state.category === "all" ? "active" : "") + '" data-cat="all">All <span style="opacity:.7">' + counts.all + '</span></button>';
  const catChips = CATEGORIES.map(c =>
    '<button class="chip ' + (state.category === c.label ? "active" : "") + '" data-cat="' + escapeHtml(c.label) + '" style="--cat: ' + c.color + '"><span class="dot"></span>' + escapeHtml(c.label) + ' <span style="opacity:.7">' + (counts[c.label] || 0) + '</span></button>'
  ).join("");
  chipsEl.innerHTML = allChip + catChips;

  chipsEl.querySelectorAll(".chip").forEach((el) => {
    el.addEventListener("click", () => {
      state.category = el.dataset.cat;
      render();
    });
  });
}

function renderCard(l) {
  const isPinned = state.pinned.includes(l.number);
  const charNames = l.passes.map(p => p.character.split(/[(,—-]/)[0].trim()).filter(Boolean);
  const charsHtml = charNames.map(c => '<span class="char-chip">' + escapeHtml(c) + '</span>').join("");
  return '<div class="card ' + (isPinned ? "pinned" : "") + '" data-num="' + l.number + '" style="--cat: ' + l.categoryColor + '">' +
    '<div class="card-header">' +
      '<span class="card-num">#' + String(l.number).padStart(3, "0") + '</span>' +
      '<span class="card-name">' + highlight(l.name, state.search) + '</span>' +
      '<button class="card-pin" data-pin="' + l.number + '" title="' + (isPinned ? "Unpin" : "Pin to roster") + '">' + (isPinned ? "★" : "☆") + '</button>' +
    '</div>' +
    '<div class="card-cat"><span class="dot"></span>' + escapeHtml(l.category) + '</div>' +
    '<div class="card-tagline">' + highlight(l.tagline, state.search) + '</div>' +
    '<div class="card-super"><strong>Superpower:</strong> ' + highlight(l.superpower, state.search) + '</div>' +
    '<div class="card-chars">' + charsHtml + '</div>' +
  '</div>';
}

function render() {
  const filtered = getFiltered();
  stats.textContent = filtered.length === LINEUPS.length
    ? LINEUPS.length + " lineups"
    : filtered.length + " of " + LINEUPS.length + " lineups";
  if (filtered.length === 0) {
    grid.innerHTML = "";
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
    grid.innerHTML = filtered.map(renderCard).join("");
  }
  grid.className = "grid " + (state.view === "list" ? "list" : "");
  bindCardEvents();
  renderPinboard();
}

function bindCardEvents() {
  grid.querySelectorAll(".card").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-pin]")) return;
      const num = parseInt(el.dataset.num, 10);
      openModal(num);
    });
  });
  grid.querySelectorAll("[data-pin]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const num = parseInt(el.dataset.pin, 10);
      togglePin(num);
    });
  });
}

function openModal(num) {
  const l = LINEUPS.find(x => x.number === num);
  if (!l) return;
  const isPinned = state.pinned.includes(l.number);
  const passRows = l.passes.map(p =>
    '<tr>' +
      '<td class="pass-num">' + p.pass + '</td>' +
      '<td class="pass-role">' + escapeHtml(p.role) + '</td>' +
      '<td class="pass-char">' + escapeHtml(p.character) + '</td>' +
      '<td class="pass-why">' + escapeHtml(p.why) + '</td>' +
    '</tr>'
  ).join("");
  $("modal").innerHTML =
    '<button class="modal-close" id="modal-close">&times;</button>' +
    '<h2>' + escapeHtml(l.name) + '</h2>' +
    '<div class="modal-num">Lineup #' + String(l.number).padStart(3, "0") + ' · ' + escapeHtml(l.category) + '</div>' +
    '<div class="modal-tagline">' + escapeHtml(l.tagline) + '</div>' +
    '<table class="pass-table">' +
      '<thead><tr><th>Pass</th><th>Role</th><th>Character</th><th>Why</th></tr></thead>' +
      '<tbody>' + passRows + '</tbody>' +
    '</table>' +
    '<div class="modal-meta">' +
      '<div class="meta-block"><strong>Content Superpower</strong><span>' + escapeHtml(l.superpower) + '</span></div>' +
      '<div class="meta-block"><strong>Influencer DNA</strong><span>' + escapeHtml(l.influencer) + '</span></div>' +
    '</div>' +
    '<div class="modal-actions">' +
      '<button class="primary" id="modal-pin">' + (isPinned ? "★ Pinned to roster" : "☆ Pin to roster") + '</button>' +
      '<button id="modal-copy-md">Copy as markdown</button>' +
      '<button id="modal-copy-prompt">Copy as 6-pass prompt</button>' +
    '</div>';
  $("modal-bg").classList.add("active");
  $("modal-close").onclick = closeModal;
  $("modal-pin").onclick = () => { togglePin(l.number); openModal(l.number); };
  $("modal-copy-md").onclick = () => {
    navigator.clipboard.writeText(l.rawMarkdown);
    $("modal-copy-md").textContent = "✓ Copied";
    setTimeout(() => $("modal-copy-md").textContent = "Copy as markdown", 1500);
  };
  $("modal-copy-prompt").onclick = () => {
    const prompt = buildPromptFromLineup(l);
    navigator.clipboard.writeText(prompt);
    $("modal-copy-prompt").textContent = "✓ Copied";
    setTimeout(() => $("modal-copy-prompt").textContent = "Copy as 6-pass prompt", 1500);
  };
}

function closeModal() { $("modal-bg").classList.remove("active"); }
$("modal-bg").addEventListener("click", (e) => { if (e.target.id === "modal-bg") closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

function buildPromptFromLineup(l) {
  let out = "# " + l.name + " — 6-Pass Council\\n";
  out += "> " + l.tagline + "\\n\\n";
  out += "Run the following six passes in sequence on the user's input. Each pass reads everything that came before it.\\n\\n";
  for (const p of l.passes) {
    out += "## Pass " + p.pass + " — " + p.role + " (" + p.character + ")\\n";
    out += p.why + "\\n\\n";
  }
  out += "**Content Superpower:** " + l.superpower + "\\n";
  out += "**Influencer DNA:** " + l.influencer + "\\n";
  return out;
}

function togglePin(num) {
  const idx = state.pinned.indexOf(num);
  if (idx >= 0) state.pinned.splice(idx, 1);
  else state.pinned.push(num);
  localStorage.setItem("agents-pinned", JSON.stringify(state.pinned));
  render();
}

function renderPinboard() {
  $("pin-count").textContent = state.pinned.length;
  const list = $("pinboard-list");
  if (state.pinned.length === 0) {
    list.innerHTML = '<p style="color: var(--text-faint); font-size: 13px; text-align: center; padding: 20px 0;">Pin lineups from the grid to build a team for a task. Stays in your browser localStorage.</p>';
    return;
  }
  list.innerHTML = state.pinned.map(num => {
    const l = LINEUPS.find(x => x.number === num);
    if (!l) return "";
    return '<div class="pin-item">' +
      '<span class="pin-name">#' + String(l.number).padStart(3, "0") + ' ' + escapeHtml(l.name) + '</span>' +
      '<button data-unpin="' + l.number + '">Remove</button>' +
    '</div>';
  }).join("");
  list.querySelectorAll("[data-unpin]").forEach(el => {
    el.onclick = () => togglePin(parseInt(el.dataset.unpin, 10));
  });
}

$("pin-toggle").onclick = () => $("pinboard").classList.toggle("open");
$("pin-close").onclick = () => $("pinboard").classList.remove("open");
$("clear-pins").onclick = () => {
  if (state.pinned.length === 0) return;
  if (!confirm("Clear all pinned lineups?")) return;
  state.pinned = [];
  localStorage.setItem("agents-pinned", "[]");
  render();
};

$("export-md").onclick = () => {
  if (state.pinned.length === 0) { alert("Pin some lineups first."); return; }
  const lineups = state.pinned.map(n => LINEUPS.find(x => x.number === n)).filter(Boolean);
  let out = "# Mission Roster (" + lineups.length + " lineups)\\n\\n";
  for (const l of lineups) {
    out += "---\\n\\n" + l.rawMarkdown + "\\n";
  }
  navigator.clipboard.writeText(out);
  $("export-md").textContent = "✓ Copied " + lineups.length + " to clipboard";
  setTimeout(() => $("export-md").textContent = "Copy as Markdown", 2000);
};

$("export-json").onclick = () => {
  if (state.pinned.length === 0) { alert("Pin some lineups first."); return; }
  const lineups = state.pinned.map(n => LINEUPS.find(x => x.number === n)).filter(Boolean);
  navigator.clipboard.writeText(JSON.stringify(lineups, null, 2));
  $("export-json").textContent = "✓ Copied " + lineups.length + " to clipboard";
  setTimeout(() => $("export-json").textContent = "Copy JSON", 2000);
};

$("search").addEventListener("input", (e) => { state.search = e.target.value.trim(); render(); });
$("sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
$("view-toggle").addEventListener("click", () => {
  state.view = state.view === "grid" ? "list" : "grid";
  $("view-toggle").textContent = state.view === "grid" ? "▦ Grid" : "≡ List";
  render();
});
$("clear").addEventListener("click", () => {
  state.search = "";
  state.category = "all";
  $("search").value = "";
  render();
});

renderChips();
render();
</script>
</body>
</html>
`;
}

const lineups = loadAll();
const html = buildHtml(lineups);
fs.writeFileSync(OUTPUT, html, "utf8");
console.log(`Built index with ${lineups.length} lineups → ${OUTPUT}`);
console.log(`File size: ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB`);
