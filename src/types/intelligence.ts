// ==========================================
// Weekly Intelligence Hub — 類型定義
// ==========================================

export interface Evidence {
  id: string;
  type: 'news' | 'data';
  source: string;
  title?: string;
  date?: string;
  url?: string;
  indicator?: string;
  value?: string;
  trend?: 'up' | 'down' | 'flat';
  unit?: string;
}

export interface LogicStep {
  step: number;
  title: string;
  summary: string;
  detail: string;
  evidence_ids: string[];
  icon: string;
}

export interface Conclusion {
  summary: string;
  key_tags: string[];
  risk_factors: string[];
}

export interface AnalysisChain {
  version: string;
  logic_chain: LogicStep[];
  conclusion: Conclusion;
  evidence_list: Evidence[];
  disclaimer: string;
}

export interface AIAnalysis {
  id: number;
  model_name: string;
  model_provider: string;
  model_icon: string;
  analysis_chain: AnalysisChain;
  confidence_score: number;
  status: string;
  created_at: string;
}

export interface WeeklyTopic {
  id: number;
  week_start: string;
  week_end: string;
  title: string;
  description: string;
  cover_image_url?: string;
  status: string;
  market: string;
  tags: string[];
  analysis_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface TopicDetail {
  topic: WeeklyTopic;
  analyses: AIAnalysis[];
  tags: string[];
}

export interface UserInteractions {
  bookmarked: boolean;
  rated: number | null;
  note: string | null;
}

export interface ViewRecordPayload {
  session_id: string;
  user_id?: string | null;
  referrer?: string;
  duration_seconds?: number;
}
