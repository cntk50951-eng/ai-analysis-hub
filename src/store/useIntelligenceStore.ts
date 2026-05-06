import { create } from 'zustand';
import type { WeeklyTopic, TopicDetail, UserInteractions } from '../types/intelligence';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface IntelligenceState {
  topics: WeeklyTopic[];
  totalTopics: number;
  currentTopic: TopicDetail | null;
  userInteractions: Record<number, UserInteractions>;
  loading: boolean;
  error: string | null;

  fetchTopics: (params?: { market?: string; limit?: number; offset?: number; tag?: string }) => Promise<void>;
  fetchTopicDetail: (id: number) => Promise<void>;
  recordView: (topicId: number, payload: { session_id: string; user_id?: string | null; referrer?: string }) => Promise<void>;
  addTag: (topicId: number, tag: string, userId: string) => Promise<boolean>;
  toggleBookmark: (topicId: number, userId: string) => Promise<boolean>;
  fetchInteractions: (topicId: number, userId: string) => Promise<void>;
}

export const useIntelligenceStore = create<IntelligenceState>((set, get) => ({
  topics: [],
  totalTopics: 0,
  currentTopic: null,
  userInteractions: {},
  loading: false,
  error: null,

  fetchTopics: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const qs = new URLSearchParams();
      if (params.market) qs.set('market', params.market);
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      if (params.tag) qs.set('tag', params.tag);

      const res = await fetch(`${API_BASE}/api/v1/weekly-topics?${qs}`);
      const json = await res.json();
      if (json.success) {
        set({ topics: json.data.topics, totalTopics: json.data.total });
      } else {
        set({ error: json.error?.message || '獲取話題失敗' });
      }
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTopicDetail: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/v1/weekly-topics?id=${id}`);
      const json = await res.json();
      if (json.success) {
        set({ currentTopic: json.data });
      } else {
        set({ error: json.error?.message || '獲取話題詳情失敗' });
      }
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  recordView: async (topicId, payload) => {
    try {
      await fetch(`${API_BASE}/api/v1/weekly-topics?action=view&id=${topicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // 靜默失敗，不影響用戶體驗
      console.warn('View tracking failed:', e);
    }
  },

  addTag: async (topicId, tag, userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/weekly-topics?action=tag&id=${topicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, user_id: userId }),
      });
      const json = await res.json();
      return json.success;
    } catch (e) {
      console.warn('Add tag failed:', e);
      return false;
    }
  },

  toggleBookmark: async (topicId, userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/weekly-topics?action=interact&id=${topicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bookmark', value: 'true', user_id: userId }),
      });
      const json = await res.json();
      if (json.success) {
        const current = get().userInteractions[topicId] || { bookmarked: false, rated: null, note: null };
        set({
          userInteractions: {
            ...get().userInteractions,
            [topicId]: { ...current, bookmarked: json.data.bookmarked !== false },
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Toggle bookmark failed:', e);
      return false;
    }
  },

  fetchInteractions: async (topicId, userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/weekly-topics/interact?id=${topicId}&user_id=${userId}`);
      const json = await res.json();
      if (json.success) {
        set({
          userInteractions: {
            ...get().userInteractions,
            [topicId]: json.data,
          },
        });
      }
    } catch (e) {
      console.warn('Fetch interactions failed:', e);
    }
  },
}));
