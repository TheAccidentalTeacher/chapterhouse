'use client'

import { useState, useEffect } from 'react'

interface SidebarSection {
  title: string
  items: { label: string; id: string }[]
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Overview', id: 'overview' },
      { label: 'What Is Chapterhouse', id: 'whatisit' },
    ],
  },
  {
    title: 'Command Center',
    items: [
      { label: 'Chat & Council Mode', id: 'chat' },
      { label: 'Daily Brief', id: 'dailybrief' },
    ],
  },
  {
    title: 'Dream & Intelligence',
    items: [
      { label: 'Dreamer', id: 'dreamer' },
      { label: 'Intel', id: 'intel' },
      { label: 'Email Inbox', id: 'email' },
    ],
  },
  {
    title: 'Intelligence & Research',
    items: [
      { label: 'Research', id: 'research' },
      { label: 'Product Intelligence', id: 'opportunities' },
      { label: 'YouTube Intelligence', id: 'youtube' },
    ],
  },
  {
    title: 'Production',
    items: [
      { label: 'Content Studio', id: 'content' },
      { label: 'Review Queue', id: 'review' },
      { label: 'Tasks', id: 'tasks' },
      { label: 'Documents', id: 'documents' },
      { label: 'Context Brain', id: 'context' },
    ],
  },
  {
    title: 'AI & Automation',
    items: [
      { label: 'Job Runner', id: 'jobs' },
      { label: 'Curriculum Factory', id: 'curriculum' },
      { label: 'Council Chamber', id: 'council' },
      { label: 'Pipelines', id: 'pipelines' },
      { label: 'Social Media', id: 'social' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { label: 'Daily Workflow', id: 'workflow' },
      { label: 'Business Tracks', id: 'tracks' },
      { label: 'Advanced Features', id: 'advanced' },
      { label: 'Known Limitations', id: 'limitations' },
      { label: 'FAQ', id: 'faq' },
    ],
  },
]

export default function HelpPage() {
  const [activePage, setActivePage] = useState('overview')

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) setActivePage(hash)
  }, [])

  useEffect(() => {
    window.location.hash = activePage
  }, [activePage])

  const pages: Record<string, React.ReactNode> = {
    overview: <OverviewPage />,
    whatisit: <WhatIsItPage />,
    chat: <ChatPage />,
    dailybrief: <DailyBriefPage />,
    dreamer: <DreamerPage />,
    intel: <IntelPage />,
    email: <EmailPage />,
    research: <ResearchPage />,
    opportunities: <OpportunitiesPage />,
    youtube: <YouTubePage />,
    content: <ContentPage />,
    review: <ReviewPage />,
    tasks: <TasksPage />,
    documents: <DocumentsPage />,
    context: <ContextPage />,
    jobs: <JobsPage />,
    curriculum: <CurriculumPage />,
    council: <CouncilPage />,
    pipelines: <PipelinesPage />,
    social: <SocialPage />,
    workflow: <WorkflowPage />,
    tracks: <TracksPage />,
    advanced: <AdvancedPage />,
    limitations: <LimitationsPage />,
    faq: <FAQPage />,
  }

  return (
    <div className="flex min-h-screen bg-[#0e0b02]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#2d2d3d] overflow-y-auto sticky top-0 h-screen bg-[#0a0a0f] p-6">
        <div className="mb-8 pb-6 border-b border-[#2d2d3d]">
          <h1 className="text-lg font-bold text-[#D4A80E] mb-1">Chapterhouse</h1>
          <p className="text-xs text-gray-400">Help & Documentation</p>
        </div>

        {sidebarSections.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2 mb-3">
              {section.title}
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActivePage(item.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-all border-l-2 ${
                      activePage === item.id
                        ? 'bg-[#D4A80E]/10 text-[#D4A80E] border-l-[#D4A80E]'
                        : 'text-gray-400 border-l-transparent hover:text-[#D4A80E] hover:bg-[#D4A80E]/5'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12">
        <div className="max-w-2xl">{pages[activePage] || pages.overview}</div>
      </main>
    </div>
  )
}

// Page Components
function OverviewPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Chapterhouse Help Guide</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Plain-English guide to everything the app does, how to use it, and what to expect.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">What You Get</h2>
      <p className="text-gray-300 mb-4">
        This is the fully interactive help guide with proper pages and navigation. Click items in the sidebar to jump to any of the 21 screens.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">21 Screens, 6 Groups</h2>
      <table className="w-full text-sm mb-6 border border-[#2d2d3d] bg-[#1a1a24]">
        <thead>
          <tr className="bg-[#D4A80E]/10">
            <th className="px-4 py-3 text-left font-semibold text-[#D4A80E] border-b border-[#2d2d3d]">
              Group
            </th>
            <th className="px-4 py-3 text-left font-semibold text-[#D4A80E] border-b border-[#2d2d3d]">
              Screens
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-300">
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Command Center</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Chat, Daily Brief</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Dream & Intelligence</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Dreamer, Intel, Email Inbox</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Intelligence & Research</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Research, Product Intelligence, YouTube</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Production</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">
              Content Studio, Review Queue, Tasks, Documents, Context Brain
            </td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">AI & Automation</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">
              Job Runner, Curriculum Factory, Council Chamber, Pipelines, Social Media
            </td>
          </tr>
        </tbody>
      </table>

      <div className="bg-[#D4A80E]/5 border-l-4 border-[#D4A80E] p-4 rounded">
        <p className="text-gray-300">
          <strong className="text-[#D4A80E]">Start here:</strong> Click "What Is Chapterhouse" to get the full overview.
        </p>
      </div>
    </div>
  )
}

function WhatIsItPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">What Is Chapterhouse?</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Your private operating system for managing all three business tracks.
      </p>

      <p className="text-gray-300 mb-6">
        Chapterhouse is your private operating system — a website only you and Anna can access. It lives at{' '}
        <code className="bg-[#1a1a24] px-2 py-1 rounded text-[#D4A80E] text-sm">chapterhouse.vercel.app</code> and runs 24/7. Think of it as mission control: you read the morning news, talk to AI, save research, generate content, track tasks, manage dreams, collect intelligence, process email, manage context — all in one place.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Core Concept</h2>
      <p className="text-gray-300 mb-6">
        Chapterhouse serves as the command center for all three business tracks (NCHO, SomerSchool, BibleSaaS). Intelligence flows in from multiple sources. You decide what matters. AI agents automate the rest.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Quick Stats</h2>
      <ul className="space-y-2 text-gray-300 ml-4">
        <li>• <strong className="text-[#D4A80E]">Screens:</strong> 21 total</li>
        <li>• <strong className="text-[#D4A80E]">AI Models:</strong> GPT-5.4, Claude Sonnet 4.6, Claude Haiku 4.5, Gemini 2.5 Flash</li>
        <li>• <strong className="text-[#D4A80E]">Database:</strong> Supabase PostgreSQL (us-west-2)</li>
        <li>• <strong className="text-[#D4A80E]">Hosting:</strong> Vercel Pro + Railway</li>
      </ul>
    </div>
  )
}

function ChatPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Chat & Council Mode</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Talk to AI. Get advice from five voices at once.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">Solo Mode</h2>
      <p className="text-gray-300 mb-6">
        Type a question in the box at the bottom. The AI reads your daily brief, research, and founder memory automatically.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Council Mode</h2>
      <p className="text-gray-300 mb-4">Click the amber <strong>Council</strong> button. Your question goes to five members:</p>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• <span className="text-[#D4A80E]">Gandalf</span> — Creator/architect</li>
        <li>• <span className="text-blue-400">Lt. Commander Data</span> — Auditor/analyst</li>
        <li>• <span className="text-emerald-400">Polgara</span> — Content director</li>
        <li>• <span className="text-orange-500">Earl Harbinger</span> — Operations commander</li>
        <li>• <span className="text-gray-400">Beavis & Butthead</span> — Engagement stress-test</li>
      </ul>
    </div>
  )
}

function DailyBriefPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Daily Brief</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Your morning summary. Auto-generated at 7 AM Alaska time.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">What You Get</h2>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• 9 RSS news feeds (education, homeschool, edtech)</li>
        <li>• 11 GitHub repos you follow</li>
        <li>• 5 daily.dev feeds (For You, Popular, Anthropic, Security, Next.js)</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">⚡ Collisions Section</h2>
      <p className="text-gray-300">
        Items scoring high on 2+ business tracks appear with an amber ⚡ badge. These are cross-track opportunities.
      </p>
    </div>
  )
}

function DreamerPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Dreamer</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Your idea management system. Seeds → Active → Building → Shipped.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">The Kanban Board</h2>
      <p className="text-gray-300 mb-4">Four columns track ideas from raw seeds to shipped:</p>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• <strong className="text-[#D4A80E]">Seeds</strong> — Raw ideas (from chat, Intel, daily brief)</li>
        <li>• <strong className="text-[#D4A80E]">Active</strong> — Ideas you're seriously considering</li>
        <li>• <strong className="text-[#D4A80E]">Building</strong> — Projects currently in progress</li>
        <li>• <strong className="text-[#D4A80E]">Shipped</strong> — Completed and live</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Earl's AI Review</h2>
      <p className="text-gray-300">
        Click <strong>Get AI Review</strong> and Earl analyzes all your seeds, suggesting which to Promote, Dismiss, Hold, or Merge.
      </p>
    </div>
  )
}

function IntelPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Intel</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Intelligence analysis engine. Feed URLs, get signal from noise.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">Three Ways to Add Intel</h2>
      <ul className="space-y-3 text-gray-300 ml-4 mb-6">
        <li><strong className="text-[#D4A80E]">1. New Session (Manual)</strong> — Paste 1–20 URLs for instant analysis</li>
        <li><strong className="text-[#D4A80E]">2. Publishers Weekly</strong> — Paste raw Publishers Weekly email text</li>
        <li><strong className="text-[#D4A80E]">3. Auto-Fetch</strong> — Daily cron at 4 AM monitors 5 watch sources</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Impact Scoring</h2>
      <ul className="space-y-2 text-gray-300 ml-4">
        <li>• 🔴 <strong>Direct Impact</strong> — affects your business immediately</li>
        <li>• 🟡 <strong>Ecosystem Signal</strong> — market-level trends</li>
        <li>• 🟠 <strong>Community Signal</strong> — user/customer behavior</li>
        <li>• 🔵 <strong>Background</strong> — interesting but less urgent</li>
      </ul>
    </div>
  )
}

function EmailPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Email Inbox</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Auto-sync, auto-categorize, auto-ingest, draft replies.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">Two Views</h2>
      <ul className="space-y-3 text-gray-300 ml-4 mb-6">
        <li><strong className="text-[#D4A80E]">Live View</strong> — Raw inbox from connected accounts (Gmail, Mailcow)</li>
        <li><strong className="text-[#D4A80E]">AI View</strong> — Categorized and analyzed with urgency scores</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Auto-Processes (Every 3 Hours)</h2>
      <ol className="space-y-2 text-gray-300 ml-6 mb-6 list-decimal">
        <li>Sync — Fetch last 30 days, deduplicate</li>
        <li>Categorize — Claude auto-assigns category + urgency</li>
        <li>Auto-ingest — Newsletters → Research, Sales → Product Intel</li>
      </ol>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Draft Reply</h2>
      <p className="text-gray-300">Click any email, scroll to bottom, click <strong>Draft Reply</strong> for AI-generated responses you can edit.</p>
    </div>
  )
}

function ResearchPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Research</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Your brain's intake system.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">Five Ways to Add Research</h2>
      <ul className="space-y-3 text-gray-300 ml-4 mb-6">
        <li><strong className="text-[#D4A80E]">URL</strong> — Paste a web address. AI fetches and summarizes.</li>
        <li><strong className="text-[#D4A80E]">Paste text</strong> — Copy-paste any text. AI analyzes.</li>
        <li><strong className="text-[#D4A80E]">Quick note</strong> — Jot down a thought</li>
        <li><strong className="text-[#D4A80E]">Screenshot</strong> — Drag an image. AI vision reads it.</li>
        <li><strong className="text-[#D4A80E]">Auto-research</strong> — Type a topic. System searches and auto-saves.</li>
      </ul>

      <p className="text-gray-300">Everything you save automatically feeds into your chat context and opportunity analysis.</p>
    </div>
  )
}

function OpportunitiesPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Product Intelligence</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        AI-powered radar for opportunities.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">How to Use It</h2>
      <ol className="space-y-2 text-gray-300 ml-6 mb-6 list-decimal">
        <li>Click <strong>Run Opportunity Analysis</strong> (takes ~15 seconds)</li>
        <li>AI generates opportunities scored on three dimensions:
          <ul className="ml-6 mt-2 space-y-1" style={{ listStyle: 'none' }}>
            <li>• Store score — relevance to your Shopify store</li>
            <li>• Curriculum score — relevance to curriculum products</li>
            <li>• Content score — relevance to content/marketing</li>
          </ul>
        </li>
        <li>Scores range from A+ (very relevant) to C (low relevance)</li>
      </ol>

      <p className="text-gray-300"><strong>The more research you save, the better these suggestions get.</strong></p>
    </div>
  )
}

function YouTubePage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">YouTube Intelligence</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Turn any YouTube video into curriculum materials.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">How to Use It</h2>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• Paste a YouTube URL or search right from the page</li>
        <li>• System extracts transcript instantly or falls back to Gemini 2.5 Flash (~77 seconds)</li>
        <li>• Watch job status update in real time</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">8 Curriculum Tools</h2>
      <ul className="space-y-2 text-gray-300 ml-4">
        <li>• Quiz — Multiple choice + short answer questions</li>
        <li>• Lesson Plan — Full plan with objectives, activities, assessment</li>
        <li>• Vocabulary — Key terms with definitions</li>
        <li>• Discussion Questions — Open-ended questions for groups</li>
        <li>• DOK Projects — Depth of Knowledge projects</li>
        <li>• Graphic Organizers — Visual organization templates</li>
        <li>• Guided Notes — Fill-in-the-blank study guides</li>
      </ul>
    </div>
  )
}

function ContentPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Content Studio</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        AI-powered writing in your brand voice.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">Three Writing Modes</h2>
      <ul className="space-y-3 text-gray-300 ml-4 mb-6">
        <li><strong className="text-[#D4A80E]">Newsletter / Campaign</strong> — Topic → polished email</li>
        <li><strong className="text-[#D4A80E]">Curriculum Guide</strong> — Book title → discussion questions, unit study</li>
        <li><strong className="text-[#D4A80E]">Product Description</strong> — Product name → Shopify-ready copy</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">How to Use It</h2>
      <ol className="space-y-2 text-gray-300 ml-6 list-decimal">
        <li>Pick a tab</li>
        <li>Fill in the fields</li>
        <li>Click <strong>Generate</strong></li>
        <li>Click <strong>Copy</strong> to grab it</li>
      </ol>
    </div>
  )
}

function ReviewPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Review Queue</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Pending decisions before they move forward.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">What Shows Up Here</h2>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• Research items marked for review</li>
        <li>• Opportunities from Product Intelligence not acted on yet</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">What You Can Do</h2>
      <ul className="space-y-2 text-gray-300 ml-4">
        <li>• <strong className="text-[#D4A80E]">Save</strong> a research item (approves it)</li>
        <li>• <strong className="text-[#D4A80E]">Reject</strong> a research item (dismisses it)</li>
        <li>• <strong className="text-[#D4A80E]">Create task</strong> from an opportunity</li>
      </ul>
    </div>
  )
}

function TasksPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Tasks</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Your to-do list. Simple, focused, no fluff.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">How Tasks Get Created</h2>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• Click <strong>Add task</strong> and type manually</li>
        <li>• Click <strong>Convert to task</strong> from a daily brief item</li>
        <li>• Click <strong>Create task</strong> from a Review Queue opportunity</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Task Statuses</h2>
      <ul className="space-y-2 text-gray-300 ml-4">
        <li>• <strong className="text-[#D4A80E]">Open</strong> — Not started yet</li>
        <li>• <strong className="text-[#D4A80E]">In progress</strong> — You're working on it</li>
        <li>• <strong className="text-[#D4A80E]">Blocked</strong> — Stuck, waiting on something</li>
        <li>• <strong className="text-[#D4A80E]">Done</strong> — Finished</li>
        <li>• <strong className="text-[#D4A80E]">Canceled</strong> — Decided not to do it</li>
      </ul>
    </div>
  )
}

function DocumentsPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Documents</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Library of all your brand documents and reference files.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">How to Use It</h2>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• Scroll or search to find a document</li>
        <li>• Click any card to expand and read full content</li>
        <li>• Documents are read-only — they're source-of-truth files</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">What's In Here</h2>
      <p className="text-gray-300">
        Your persona, biography, brand personality guide, Shopify strategy, operating system doc, product specs, and more.
      </p>
    </div>
  )
}

function ContextPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Context Brain</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Four-layer memory system for AI conversations.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">Four Slots (Injected in Order)</h2>
      <ul className="space-y-3 text-gray-300 ml-4 mb-6">
        <li><strong className="text-[#D4A80E]">Core</strong> — Your permanent identity and locked decisions</li>
        <li><strong className="text-[#D4A80E]">Sessions</strong> — Most recent sessions summarized</li>
        <li><strong className="text-[#D4A80E]">Extended</strong> — Customer research, brand voice rules, competitors</li>
        <li><strong className="text-[#D4A80E]">Intelligence</strong> — Last 48 hours of Intel analysis</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">How to Use It</h2>
      <ol className="space-y-2 text-gray-300 ml-6 list-decimal">
        <li>Click <strong>Context Brain</strong> in sidebar</li>
        <li>Select a document</li>
        <li>Edit inline</li>
        <li>Click <strong>Save</strong></li>
        <li>Changes auto-inject into every AI call immediately</li>
      </ol>
    </div>
  )
}

function JobsPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Job Runner</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Dashboard for background AI jobs that run while you sleep.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">How to Use It</h2>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• Click <strong>Create Job</strong> to queue a new background AI task</li>
        <li>• Watch progress bars update live (Supabase Realtime)</li>
        <li>• Click any job to see full details, output, or error messages</li>
        <li>• Cancel running jobs if needed</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Behind the Scenes</h2>
      <p className="text-gray-300">
        Jobs are published to QStash, delivered to a Railway worker, processed, and updates appear in real time via Supabase.
      </p>
    </div>
  )
}

function CurriculumPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Curriculum Factory</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        5-pass AI pipeline using the Council of the Unserious.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">How to Use It</h2>
      <ol className="space-y-2 text-gray-300 ml-6 list-decimal">
        <li>Select a subject, grade level, and duration</li>
        <li>Optionally add standards alignment or additional context</li>
        <li>Click <strong>Generate</strong> for single or <strong>Batch</strong> for many at once</li>
      </ol>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">The 5-Pass Process</h2>
      <ol className="space-y-2 text-gray-300 ml-6 list-decimal">
        <li><strong className="text-[#D4A80E]">Gandalf</strong> drafts the initial scope & sequence</li>
        <li><strong className="text-blue-400">Lt. Commander Data</strong> audits against national standards</li>
        <li><strong className="text-emerald-400">Polgara</strong> synthesizes into production-ready version</li>
        <li><strong className="text-orange-500">Earl Harbinger</strong> assesses operational viability</li>
        <li><strong className="text-gray-400">Beavis & Butthead</strong> stress-test engagement</li>
      </ol>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">National Standards Auto-Alignment</h2>
      <p className="text-gray-300">
        Standards auto-detected from subject field. No manual input needed.
      </p>
    </div>
  )
}

function CouncilPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Council Chamber</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Purpose-built system for generating curriculum scope & sequences as a background job.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">How to Use It</h2>
      <ol className="space-y-2 text-gray-300 ml-6 list-decimal">
        <li>Select subject, grade, and duration</li>
        <li>Submit to start the job — it runs in the background</li>
        <li>Check the Job Runner page for progress</li>
        <li>Results appear when complete</li>
      </ol>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">How It Differs from Council Mode in Chat</h2>
      <p className="text-gray-300 mb-3">
        <strong className="text-[#D4A80E]">Chat Council Mode:</strong> Real-time, general-purpose, handles any topic.
      </p>
      <p className="text-gray-300">
        <strong className="text-[#D4A80E]">Council Chamber:</strong> Purpose-built for curriculum generation, runs as a background job.
      </p>
    </div>
  )
}

function PipelinesPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Pipelines</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Control panel for n8n automation workflows on Railway.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">How to Use It</h2>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• View all n8n workflows with current status (active/inactive)</li>
        <li>• See last run timestamp and result</li>
        <li>• Click <strong>Run now</strong> to manually trigger any workflow</li>
        <li>• Auto-refreshes every 30 seconds</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Requirements</h2>
      <p className="text-gray-300">
        n8n API key must be configured in environment variables.
      </p>
    </div>
  )
}

function SocialPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Social Media</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        AI-powered post generation, human review, and scheduling for all brands.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">Three Tabs</h2>

      <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">Review Queue</h3>
      <p className="text-gray-300 mb-4">
        Every AI-generated post lands here first. Nothing auto-publishes. Edit text, pick date/time, click Approve or Reject.
      </p>

      <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">Generate</h3>
      <p className="text-gray-300 mb-4">Create new posts on demand: toggle brands, platforms, set count.</p>

      <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">Accounts</h3>
      <p className="text-gray-300">Manage Buffer channel connections: sync from Buffer, map channels to brands.</p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Auto-Triggers</h2>
      <ul className="space-y-2 text-gray-300 ml-4">
        <li>• <strong className="text-[#D4A80E]">Weekly cron</strong> (Monday 5:00 AM UTC) — 18 posts</li>
        <li>• <strong className="text-[#D4A80E]">Shopify webhook</strong> — new product launch posts auto-generated</li>
      </ul>
    </div>
  )
}

function WorkflowPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Your Daily Workflow</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        How a typical day uses all of Chapterhouse.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">Morning (7 AM)</h2>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• Daily brief auto-generates</li>
        <li>• Email inbox auto-syncs and categorizes</li>
        <li>• Read the brief, check Email Action Banner</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Breakfast Review</h2>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• Open Dreamer — check Earl's AI suggestions</li>
        <li>• Check Context Brain — update founder memory if needed</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">During the Day</h2>
      <ul className="space-y-2 text-gray-300 ml-4 mb-6">
        <li>• Quick questions: Use Chat</li>
        <li>• Save discoveries: Use Research</li>
        <li>• Reply to mail: Use Email Inbox → Draft Reply</li>
        <li>• Deep brainstorming: Use Council Mode</li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">End of Day</h2>
      <ul className="space-y-2 text-gray-300 ml-4">
        <li>• Check Tasks — anything blocked or done?</li>
        <li>• Check Review Queue — pending decisions?</li>
        <li>• Check Dreamer — seeds ready to promote?</li>
      </ul>
    </div>
  )
}

function TracksPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">The Three Business Tracks</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Chapterhouse serves three concurrent businesses at once.
      </p>

      <table className="w-full text-sm mb-6 border border-[#2d2d3d] bg-[#1a1a24]">
        <thead>
          <tr className="bg-[#D4A80E]/10">
            <th className="px-4 py-3 text-left font-semibold text-[#D4A80E] border-b border-[#2d2d3d]">
              Track
            </th>
            <th className="px-4 py-3 text-left font-semibold text-[#D4A80E] border-b border-[#2d2d3d]">
              What It Does
            </th>
            <th className="px-4 py-3 text-left font-semibold text-[#D4A80E] border-b border-[#2d2d3d]">
              Deadline
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-300">
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">NCHO</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Shopify curriculum store</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Launch within 1 week</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">SomerSchool</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Homeschool SaaS platform</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Revenue by August 2026</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3">BibleSaaS</td>
            <td className="px-4 py-3">AI-powered Bible study</td>
            <td className="px-4 py-3">Beta phase</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function AdvancedPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Advanced Features</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        How the three business tracks work together.
      </p>

      <h2 className="text-2xl font-semibold text-gray-100 mt-6 mb-4">Auto-Ingestion Pipeline</h2>

      <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">Email</h3>
      <ul className="space-y-1 text-gray-300 ml-4 mb-6">
        <li>• Newsletters → Research queue</li>
        <li>• Sales inquiries → Product Intelligence opportunities</li>
        <li>• URLs from newsletters → auto-added to Research</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">Daily Brief + Intel</h3>
      <ul className="space-y-1 text-gray-300 ml-4 mb-6">
        <li>• High-collision items → auto-seed proposals to Dreamer</li>
        <li>• Competitor announcements → auto-flag in Product Intelligence</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">Context Brain</h3>
      <ul className="space-y-1 text-gray-300 ml-4">
        <li>• Push API syncs desktop files to cloud</li>
        <li>• Every new call pulls fresh context from all 4 slots</li>
      </ul>
    </div>
  )
}

function LimitationsPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">Known Limitations & Workarounds</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Constraints and how to work around them.
      </p>

      <table className="w-full text-sm mb-6 border border-[#2d2d3d] bg-[#1a1a24]">
        <thead>
          <tr className="bg-[#D4A80E]/10">
            <th className="px-4 py-3 text-left font-semibold text-[#D4A80E] border-b border-[#2d2d3d]">
              Limitation
            </th>
            <th className="px-4 py-3 text-left font-semibold text-[#D4A80E] border-b border-[#2d2d3d]">
              Workaround
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-300 text-sm">
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">YouTube transcripts — YouTube blocks cloud IPs</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Falls back to Gemini 2.5 Flash (~77 sec) — works 100%</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Email sync latency — Every 3 hours</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Check Gmail/Mailcow directly for real-time</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Some RSS feeds — 3 of 9 blocked</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Brief generates from working feeds</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">n8n Pipelines — Requires API key</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Add N8N_API_KEY to Vercel environment</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3">Draft replies — Cache 24 hours</td>
            <td className="px-4 py-3">Click Draft Reply again to regenerate if stale</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function FAQPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-[#D4A80E] mb-2">FAQ & Quick Reference</h1>
      <p className="text-sm text-gray-400 pb-6 border-b border-[#2d2d3d] mb-8">
        Common questions answered.
      </p>

      <table className="w-full text-sm mb-6 border border-[#2d2d3d] bg-[#1a1a24]">
        <thead>
          <tr className="bg-[#D4A80E]/10">
            <th className="px-4 py-3 text-left font-semibold text-[#D4A80E] border-b border-[#2d2d3d]">
              Question
            </th>
            <th className="px-4 py-3 text-left font-semibold text-[#D4A80E] border-b border-[#2d2d3d]">
              Answer
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-300 text-sm">
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Who can access this?</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Only scott@nextchapterhomeschool.com and anna@nextchapterhomeschool.com</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Where does it live?</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">chapterhouse.vercel.app</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Is my data private?</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Yes — stored in your private Supabase (PostgreSQL) in us-west-2</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">What AI models are used?</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">GPT-5.4, Claude Sonnet 4.6, Claude Haiku 4.5, Gemini 2.5 Flash</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">What's the monthly cost?</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">~$15–25 Vercel + ~$50–100 AI API usage</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3 border-b border-[#2d2d3d]">How do I sign out?</td>
            <td className="px-4 py-3 border-b border-[#2d2d3d]">Click the door icon (top right)</td>
          </tr>
          <tr className="hover:bg-[#D4A80E]/5">
            <td className="px-4 py-3">How do I teach it something?</td>
            <td className="px-4 py-3">Type /remember [fact] in Chat, or use Settings → Founder Memory</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-2xl font-semibold text-gray-100 mt-8 mb-4">Key Timestamps</h2>
      <ul className="space-y-2 text-gray-300 ml-4">
        <li>• <strong className="text-[#D4A80E]">Daily brief:</strong> 7 AM Alaska time</li>
        <li>• <strong className="text-[#D4A80E]">Email:</strong> Every 3 hours</li>
        <li>• <strong className="text-[#D4A80E]">Intel:</strong> 4 AM Alaska time</li>
        <li>• <strong className="text-[#D4A80E]">Digest:</strong> 12:30 AM UTC</li>
        <li>• <strong className="text-[#D4A80E]">Social:</strong> Monday 5 AM UTC</li>
      </ul>
    </div>
  )
}
