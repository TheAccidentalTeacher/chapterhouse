# Shopify Strategy — The Somers Homeschool Hub

> *This is a living document. It captures every decision, tool plan, and build strategy related to the Shopify infrastructure for the Somers Homeschool Hub. It grows as the project grows. The Brand Whisperer writes, Scott builds, Anna approves the vibe.*

---

## What Shopify Is in This Business

Shopify is Layer 1 — the storefront and the cash register. It's the thing that exists on day one, generates revenue during peak homeschool season (June–August), and gives the whole operation a professional front door. Everything else — the digital workshop, the back rooms, eventually the platform — grows behind it.

The store is not *just* a store. It's also the first impression of who Scott and Anna are, the first experience a homeschool mom has with this brand, and the launchpad for Digital Products (Layer 2) and the platform play (Layer 4). Build it right.

---

## Theme

**Chosen:** Kidu (or similar paid OS 2.0 theme oriented toward books/education)

**Architecture:** Shopify Online Store 2.0 — this matters because:
- Supports custom sections and blocks in the theme editor
- Supports metaobjects (structured custom data)
- Supports app blocks for third-party integrations
- All custom tools described below plug into this architecture

**The theme is the coat. The tools live in the walls.**

---

## The API Layer — What Shopify Exposes

Every tool we build talks to one or more of these:

| API | What It Controls | Our Use |
|-----|-----------------|---------|
| **GraphQL Admin API** | Everything in the store backend | Bulk imports, metafields, product management, order watching |
| **REST Admin API** | Legacy — being phased out, still functional | Fallback where GraphQL isn't supported |
| **Storefront API** | Cart, products, checkout — for frontend | If we ever go headless; not needed now |
| **Webhooks** | Real-time event push (orders, customers, inventory) | Digital delivery automation, order tagging |
| **Shopify Functions** | Custom WebAssembly logic running inside Shopify's backend at checkout | Discount logic, cart transforms, delivery customization — future use |
| **Bulk Operations API** | Async processing of massive datasets | Catalog-scale metafield writes, large imports |
| **ShopifyQL** | Analytics query language | Future: custom reporting tool |

---

## The Legal + Ethical Framework for Curriculum Guides

*(See also: the penguin conversation, which is now canonical.)*

**The core principle:** Creating original educational companion content around published books is completely legal. You are not reproducing the book. You are creating your own original work — discussion questions, project frameworks, research prompts, activities — that families use *alongside* the book.

**The five pathways:**

1. **You own the rights** — Build unlimited curriculum for your own books (e.g., Scott's own titles). Zero friction. Start here.

2. **Fair Use** — U.S. copyright law (17 U.S.C. § 107) protects limited quotation in educational commentary. Quote a passage to anchor a discussion question. Don't reproduce chapters.

3. **Companion Guide Model** — No permission required. Reference the book by title, author, characters, and plot events. All curriculum content is your original writing. SparkNotes does this. CliffsNotes does this. Every teacher's guide in existence does this.

4. **Author Licensing** — For indie authors, reach out directly. Most say yes for free. Some want a small royalty. Some will *pay you* to build curriculum because it drives their book sales. This is a business development play, not just a legal strategy.

5. **Public Domain** — Pre-1928 books are fully open. Reproduce, quote, remix freely. A goldmine for classics-based curriculum.

**The ethical floor (above legal minimum):**
- Always attribute clearly and link to purchase the book (ideally from your store)
- Never make the guide a substitute for reading — make it a reason to read more deeply
- Don't put words in authors' mouths beyond what the text supports

---

## The Business Model This Creates

```
Customer buys: Book — $14.99
Customer also buys: Scott's Curriculum Guide for that book — $9.99
─────────────────────────────────────────────
Total cart: $24.98
Scott's cost to produce the guide: ~$0 (AI-assisted, 2 hours)
Margin on the guide: ~95%
```

Scale across 200+ books. Nobody else in the homeschool market does this at scale.

---

## Tools to Build — Master List

### Category 1: Tools That Work From Outside (Python / Node.js scripts via Admin API)

#### 1. Bulk Product Importer
- **What it does:** Reads a CSV (ISBN, title, author, price, description, tags, grade level, subject, faith/secular flag) and mass-creates products in Shopify via the Admin GraphQL API
- **Why we need it:** Shopify's native CSV import is too limited for a catalog of this scale and complexity
- **Key features:** Sets all metafields at import time, creates variants (formats: paperback/hardcover/digital), assigns to collections automatically
- **Build stack:** Python + `ShopifyAPI` library + `pandas`
- **Priority:** HIGH — needed before launch

#### 2. Metafield Manager
- **What it does:** Writes structured custom data to every product
- **Metafields we need:**

| Metafield | Type | Purpose |
|-----------|------|---------|
| `grade_level` | String (range) | "K–2", "3–5", "6–8", "9–12", "Adult" |
| `subject` | List | Math, History, Language Arts, Science, etc. |
| `faith_flag` | Enum | "faith-based", "secular", "both" |
| `allotment_eligible` | Boolean | Alaska state allotment money compatible |
| `reading_level` | String | Lexile score or grade equivalent |
| `series_name` | String | Series title if applicable |
| `series_number` | Integer | Position in series |
| `curriculum_style` | List | Classical, Charlotte Mason, Unschooling-friendly, etc. |
| `has_curriculum_guide` | Boolean | True if Scott has built a guide for this book |
| `curriculum_guide_id` | Product ID | Links to the matching guide product |

- **Build stack:** Python + Admin GraphQL API
- **Priority:** HIGH — needed before launch

#### 3. Digital Product Delivery Automation
- **What it does:** Listens for `orders/paid` webhooks, triggers branded delivery email with download links for any digital products in the order
- **Why we need it:** Shopify's native digital delivery is functional but generic. First impressions matter.
- **Build stack:** Python + Flask webhook listener + SendGrid or Mailgun (email)
- **Priority:** HIGH — needed by first digital sale

#### 4. Curriculum Bundle Builder
- **What it does:** Watches for new curriculum guide uploads, finds the matching book product, auto-creates a bundle product at a slight discount
- **Example output:** "Leviathan Rising + Alaska Marine Ecology Curriculum Guide — Bundle: $22.99 (save $2)"
- **Build stack:** Python + Admin GraphQL API
- **Priority:** MEDIUM — before launch if possible, week 2 if not

#### 5. Ingram Spark Catalog Sync
- **What it does:** Periodically pulls Ingram Spark data feed, checks against Shopify catalog, flags/updates products that have gone out of print or changed price
- **Why we need it:** Selling a book Ingram no longer carries = unhappy customers = refunds = bad look
- **Build stack:** Python + Ingram Spark data API + Admin GraphQL API
- **Priority:** MEDIUM — first month post-launch

---

### Category 2: Tools That Live Inside the Theme (Liquid + JavaScript)

These are custom theme sections and blocks. They drop into any OS 2.0 theme cleanly without breaking anything.

#### 6. Alaska Allotment Eligible Filter + Badge
- **What it does:** Filter toggle on collection pages showing only allotment-eligible products; badge on product cards
- **Visual:** "✓ Allotment Eligible" badge on product thumbnails
- **Why it matters:** This is a competitive differentiator unique to the Alaska market. No other store does this cleanly.
- **Build:** Custom Liquid section + metafield read
- **Priority:** HIGH — this is a flagship feature

#### 7. Faith / Secular / Both Filter
- **What it does:** Three-way filter toggle on collection pages reading from `faith_flag` metafield
- **Why it matters:** The brand promise: every kind of homeschooler feels welcome. The filter makes it real. Non-faith families browse freely. Faith families find what they need. Nobody feels ambushed.
- **Build:** Custom Liquid section + metafield read
- **Priority:** HIGH — launch day feature

#### 8. Grade Level Quick-Nav
- **What it does:** Visual grade band selector — click "Grades 3–5" and the collection filters instantly
- **Placement:** Homepage hero section and collection page sidebar
- **Build:** Custom Liquid section + URL parameter filtering
- **Priority:** HIGH — major UX feature for the primary customer (mom who knows her kid's grade)

#### 9. "Also Get the Curriculum Guide" Upsell Block
- **What it does:** On product pages for books with a matching curriculum guide, a block appears: *"Scott built a full curriculum unit for this book"* with an add-to-cart button
- **How it works:** Reads the `has_curriculum_guide` and `curriculum_guide_id` metafields to link products
- **Revenue impact:** Every book with a guide is now a dual-SKU opportunity. Zero additional traffic needed.
- **Build:** Custom Liquid product block + metaobject relationship
- **Priority:** HIGH — should be live by first curriculum guide upload

#### 10. Book Series Navigator
- **What it does:** On series book product pages, displays all books in the series, which ones the store carries, and what comes next
- **Build:** Custom Liquid section reading `series_name` and `series_number` metafields, filtered collection query
- **Priority:** MEDIUM — important for series books but not day-one critical

---

### Category 3: AI-Powered Tools (Scott's Workshop)

These are Scott's competitive moat. Nobody else in the homeschool market is building at this layer.

#### 11. AI Curriculum Guide Generator
- **What it does:** Takes book title, author, grade level, subject focus, and any custom angle — outputs a full formatted curriculum guide document
- **Workflow:** Scott feeds it inputs → AI drafts → Scott edits the 20% that makes it genuinely good → exported to PDF → uploaded to Shopify as digital product
- **Build stack:** Python + OpenAI API (GPT-4o) + document generation (WeasyPrint or ReportLab for PDF)
- **Cost to run:** Pennies per guide
- **Output value:** $9.99 digital product with 95% margin
- **Priority:** HIGH — Scott should be building guides before launch

#### 12. AI Product Description Generator
- **What it does:** Takes book metadata (title, author, grade level, subjects, series info) and generates product descriptions in brand voice
- **Why we need it:** 500 books with publisher boilerplate vs. 500 books with curated, voice-consistent descriptions that actually convert. The SEO difference alone is significant.
- **Build stack:** Python + OpenAI API + batch processing via Admin GraphQL API
- **Priority:** HIGH — run this before launch to seed the catalog

#### 13. SEO Metadata Bulk Writer
- **What it does:** AI-generates meta titles and meta descriptions for every product and collection page, bulk-applies via Admin API
- **Build stack:** Python + OpenAI API + Admin GraphQL API
- **Priority:** MEDIUM — run before launch ideally, first month definitely

---

## Build Order (Given the Timeline)

Scott's contract ends May 24, 2026. Revenue needs to be meaningful by August. Peak homeschool buying is June–August. This is the sequence:

| Phase | Tool | Reason |
|-------|------|--------|
| **Pre-launch (now–May)** | Bulk Importer + Metafield Manager | Catalog must be structured correctly from day one |
| **Pre-launch** | AI Product Description Generator | Don't launch with publisher boilerplate |
| **Pre-launch** | AI Curriculum Guide Generator | Build 10–20 guides before launch; they're your highest-margin products |
| **Launch-ready** | Alaska Allotment Filter + Badge | Flagship differentiator |
| **Launch-ready** | Faith/Secular Filter | Core brand promise, must be live |
| **Launch-ready** | Grade Level Quick-Nav | Major UX feature |
| **Launch-ready** | Curriculum Guide Upsell Block | Revenue multiplier from day one |
| **Week 1–2 post-launch** | Digital Product Delivery Automation | Needs to work before first digital sale |
| **Month 1** | Bundle Builder | Once you have 5+ guides, bundles make sense |
| **Month 1** | SEO Metadata Bulk Writer | Compound SEO benefit starts accruing |
| **Month 2** | Ingram Sync | Catalog hygiene at scale |
| **Month 2** | Book Series Navigator | Nice UX win as catalog grows |
| **Month 3+** | ShopifyQL Analytics CLI | Data nerd tools for when you're optimizing |

---

## The Tech Stack

```
Python 3.11+
├── shopify-api (official Shopify Python library)
├── openai (GPT-4o for AI tools)
├── pandas (CSV/spreadsheet processing)
├── flask or fastapi (webhook listener for digital delivery)
├── weasyprint or reportlab (PDF generation for curriculum guides)
└── python-dotenv (API key management)

Shopify Theme (Liquid)
├── Custom sections (.liquid files)
├── Metaobjects (via Shopify Admin)
└── Theme blocks (OS 2.0 architecture)

GitHub
└── Version control for all scripts and theme customizations
```

---

## Open Questions / Next Decisions

- [ ] Confirm theme selection (Kidu or alternative)
- [ ] Set up Shopify Partner account and development store for testing
- [ ] Decide on Ingram Spark integration method (CSV export vs. data feed API)
- [ ] Determine initial curriculum guide format (PDF only, or also Google Docs / printable?)
- [ ] Build the first curriculum guide as proof of concept (start with Scott's own book)
- [ ] Define the complete metafield schema before first import (changing it later is painful)

---

*Last updated: March 2, 2026 — This document evolves with every build decision.*
