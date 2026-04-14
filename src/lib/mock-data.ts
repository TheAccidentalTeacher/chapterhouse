export const quickActions = [
  "Run Daily Brief",
  "Research a source",
  "Create product concept",
  "Draft campaign",
  "Add watch item",
];

export const activeAlerts = [
  {
    title: "Shopify Editions recap needs review",
    detail: "Three platform changes may affect merchandising and email capture.",
    severity: "High",
  },
  {
    title: "Homeschool summer sale trend rising",
    detail: "Five competitor signals point to early June promo pressure.",
    severity: "Medium",
  },
  {
    title: "Daily brief env setup incomplete",
    detail: "App shell is running, but provider secrets still need app-level mapping.",
    severity: "Low",
  },
];

export const recentWork = [
  "Chapterhouse MVP build checklist drafted",
  "Documentation renamed and pushed to GitHub",
  "Core workflow and UI specs established",
];

export const pinnedDocs = [
  "README.md",
  "docs/specs/chapterhouse-product-spec.md",
  "docs/specs/chapterhouse-workflow-spec.md",
  "docs/specs/chapterhouse-ui-spec.md",
];

export const todayTasks = [
  "Stand up Supabase project",
  "Map app env vars to hosted secrets",
  "Seed first Daily Brief sample payload",
];

export const dailyBriefSections = [
  {
    title: "Urgent Changes",
    items: [
      {
        headline: "Email capture and discount timing need a June test plan",
        whyItMatters:
          "Competitor patterns suggest summer-sale expectations begin earlier than assumed.",
        score: "High",
        sources: 4,
      },
    ],
  },
  {
    title: "Shopify / Ecommerce",
    items: [
      {
        headline: "Merchandising focus should start with bundles and guide-driven discovery",
        whyItMatters:
          "It aligns the storefront with the curriculum-guides strategy already defined in the docs.",
        score: "High",
        sources: 3,
      },
      {
        headline: "Search and filtering copy needs Alaska-allotment clarity",
        whyItMatters:
          "Purchase confidence rises when eligibility rules are explicit.",
        score: "Medium",
        sources: 2,
      },
    ],
  },
  {
    title: "Opportunities",
    items: [
      {
        headline: "Use Scott-owned titles as the first curriculum guide proof-of-concept",
        whyItMatters:
          "Zero rights friction means faster time to revenue and cleaner test loops.",
        score: "High",
        sources: 5,
      },
    ],
  },
];

export const documentLibrary = [
  {
    name: "README.md",
    role: "Project map",
    status: "Core",
  },
  {
    name: "docs/specs/chapterhouse-product-spec.md",
    role: "Product definition",
    status: "Core",
  },
  {
    name: "docs/specs/chapterhouse-data-model-spec.md",
    role: "Schema direction",
    status: "Core",
  },
  {
    name: "docs/specs/chapterhouse-workflow-spec.md",
    role: "Operational loops",
    status: "Core",
  },
  {
    name: "docs/specs/chapterhouse-ui-spec.md",
    role: "Screen structure",
    status: "Core",
  },
  {
    name: "docs/specs/chapterhouse-technical-architecture-spec.md",
    role: "Infrastructure direction",
    status: "Core",
  },
];

export const reviewQueueItems = [
  {
    title: "Approve Daily Brief section ordering",
    owner: "Scott",
    status: "Ready for review",
  },
  {
    title: "Verify source-ingestion RSS shortlist",
    owner: "Anna",
    status: "Needs decision",
  },
];
