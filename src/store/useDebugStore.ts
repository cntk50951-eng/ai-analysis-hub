// ==========================================
// 調試模式 Store
// 支持：管理員 UI 開關 / Ctrl+Shift+D 快捷鍵 / URL 參數 ?debug=true
// debugVisibilityMode: 'all' = 所有功能可視, 'subscription' = 僅訂閱可視
// 開關狀態存儲在數據庫，由管理員帳戶 cntk50951@gmail.com 控制
// ==========================================

import { create } from 'zustand';

const ADMIN_EMAIL = 'cntk50951@gmail.com';

// ========== 上線開關：設為 false 即可完全禁用 debug ==========
const ALLOW_DEBUG = true;
// =============================================================

const isDevelopment = import.meta.env.DEV;

// 檢查 URL 參數
function checkUrlDebug(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === 'true';
}

export type DebugVisibilityMode = 'all' | 'subscription';

interface DebugState {
  isDebugMode: boolean;
  canToggleDebug: boolean;
  isAdmin: boolean;
  debugVisibilityMode: DebugVisibilityMode;
  mockPremium: boolean;
  mockAuthUser: { name: string; email: string; isPremium: boolean } | null;
  useMockData: boolean;
  mockApiLatency: number;
  mockApiError: boolean;
  showBlurDebug: boolean;
  showPaywallPreview: boolean;
  showComplianceHighlight: boolean;

  toggleDebug: () => void;
  toggleMockPremium: () => void;
  setMockApiLatency: (ms: number) => void;
  toggleMockApiError: () => void;
  toggleBlurDebug: () => void;
  togglePaywallPreview: () => void;
  toggleComplianceHighlight: () => void;
  toggleDebugVisibility: () => void;
  setDebugVisibilityMode: (mode: DebugVisibilityMode) => void;
  setAdmin: (isAdmin: boolean) => void;
  resetAll: () => void;
}

const initialDebug = ALLOW_DEBUG && (isDevelopment || checkUrlDebug());

export const useDebugStore = create<DebugState>((set) => ({
  isDebugMode: initialDebug,
  canToggleDebug: ALLOW_DEBUG,
  isAdmin: false,
  debugVisibilityMode: 'subscription' as DebugVisibilityMode,
  mockPremium: false,
  mockAuthUser: null,
  useMockData: true,
  mockApiLatency: 500,
  mockApiError: false,
  showBlurDebug: false,
  showPaywallPreview: false,
  showComplianceHighlight: false,

  toggleDebug: () => {
    if (!ALLOW_DEBUG) {
      console.warn('⚠️ Debug mode is disabled');
      return;
    }
    set((state) => ({ isDebugMode: !state.isDebugMode }));
  },

  toggleMockPremium: () => set((state) => ({ mockPremium: !state.mockPremium })),
  setMockApiLatency: (ms) => set({ mockApiLatency: ms }),
  toggleMockApiError: () => set((state) => ({ mockApiError: !state.mockApiError })),
  toggleBlurDebug: () => set((state) => ({ showBlurDebug: !state.showBlurDebug })),
  togglePaywallPreview: () => set((state) => ({ showPaywallPreview: !state.showPaywallPreview })),
  toggleComplianceHighlight: () => set((state) => ({ showComplianceHighlight: !state.showComplianceHighlight })),

  toggleDebugVisibility: () => set((state) => ({
    debugVisibilityMode: state.debugVisibilityMode === 'all' ? 'subscription' : 'all',
  })),

  setDebugVisibilityMode: (mode) => set({ debugVisibilityMode: mode }),

  setAdmin: (isAdmin) => set({ isAdmin }),

  resetAll: () => set({
    isDebugMode: initialDebug,
    mockPremium: false,
    mockAuthUser: null,
    useMockData: false,
    mockApiLatency: 500,
    mockApiError: false,
    showBlurDebug: false,
    showPaywallPreview: false,
    showComplianceHighlight: false,
  }),
}));

// 快捷鍵監聽（Ctrl+Shift+D/P/R）
if (typeof window !== 'undefined' && ALLOW_DEBUG) {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'd':
          e.preventDefault();
          useDebugStore.getState().toggleDebug();
          console.log('🔧 Debug mode toggled');
          break;
        case 'p':
          e.preventDefault();
          useDebugStore.getState().toggleMockPremium();
          console.log('💎 Premium mock toggled');
          break;
        case 'r':
          e.preventDefault();
          useDebugStore.getState().resetAll();
          console.log('🔄 Debug settings reset');
          break;
      }
    }
  });
}

// 根據用戶 email 判斷是否為管理員，並設置 debug 模式
export function checkAdminAndSetDebug(email: string | undefined | null) {
  const isAdmin = email === ADMIN_EMAIL;
  useDebugStore.getState().setAdmin(isAdmin);
  if (isAdmin) {
    // 管理員自動啟用調試模式
    useDebugStore.getState().toggleDebug?.();
  }
  return isAdmin;
}