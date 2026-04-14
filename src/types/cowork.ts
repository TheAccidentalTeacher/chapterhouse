// src/types/cowork.ts
// Shared TypeScript interfaces for Chapterhouse Cowork Upgrade (Phases 20–28)

/** Phase 20A — Document export tracking */
export interface ExportRecord {
  format: 'docx' | 'md' | 'pdf';
  exported_at: string;  // ISO 8601
  exported_by: string;  // user_id
}

/** Phase 21A — Document outline structure */
export interface OutlineSection {
  id: string;           // nanoid or uuid
  title: string;
  guidance: string;     // AI-generated section brief
  sort_order: number;
}

export interface DocumentOutline {
  sections: OutlineSection[];
  generated_at: string;
  model: string;        // which model generated it
}

/** Phase 23B — Watch URL tracking */
export interface WatchUrl {
  id: string;
  url: string;
  label: string;
  check_interval: 'daily' | 'weekly' | 'monthly';
  last_checked_at: string | null;
  last_content_hash: string | null;
  is_active: boolean;
  created_at: string;
}

/** Phase 22B — Unified search result */
export interface SearchResult {
  id: string;
  type: 'task' | 'research' | 'opportunity' | 'thread' | 'brief' | 'document';
  title: string;
  snippet: string;
  updated_at: string;
  url: string;          // internal route to navigate to
}

/** Phase 25A — Social engagement data */
export interface EngagementData {
  reach?: number;
  clicks?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  fetched_at: string;
}

/** Phase 20B — Cost tracking entry */
export interface CostEntry {
  trace_id: string;
  name: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  timestamp: string;
}

/** Phase 28B — Workflow step definition */
export interface WorkflowStep {
  id: string;
  step_type:
    | 'council_query'
    | 'intel_fetch'
    | 'social_generate'
    | 'doc_generate'
    | 'enrich'
    | 'schedule_buffer';
  params: Record<string, unknown>;
  output_key: string;
}

/** Phase 28E — Target audience */
export interface TargetAudience {
  id: string;
  name: string;
  description?: string;
  demographics: Record<string, unknown>;
  pain_points: string[];
  motivations: string[];
  preferred_tone?: string;
  brand_voice_id?: string;
}
