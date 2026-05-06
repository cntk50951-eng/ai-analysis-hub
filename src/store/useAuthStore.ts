// ==========================================
// 認證狀態 Store (Firebase)
// ==========================================

import { create } from 'zustand';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';
import { checkAdminAndSetDebug, useDebugStore } from './useDebugStore';
import type { User } from '../types';

const ADMIN_EMAIL = 'cntk50951@gmail.com';

interface AuthStateInterface {
  // 狀態
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isGuest: boolean;

  // Actions
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  enterAsGuest: () => void;
  initAuthListener: () => void;
  setUser: (user: User | null) => void;
  setError: (error: string) => void;
  syncUserToBackend: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthStateInterface>((set, get) => ({
  // 初始狀態
  user: null,
  isLoading: false,
  error: null,
  isGuest: false,

  // Google 登錄
  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || undefined,
        isPremium: false,
        premiumTier: 'free',
      };

      set({ user, isLoading: false, isGuest: false });
      
      // 檢查是否為管理員並設置調試模式
      checkAdminAndSetDebug(user.email);
      
      // 同步用戶到後端
      get().syncUserToBackend(user);
    } catch (error: any) {
      set({ 
        error: error.message || '登錄失敗', 
        isLoading: false 
      });
      throw error;
    }
  },

  // 遊客模式進入
  enterAsGuest: () => {
    set({ isGuest: true, user: null });
  },

  // 登出
  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut(auth);
      set({ user: null, isLoading: false, isGuest: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // 同步用戶到後端，並獲取 premium/debug 狀態
  syncUserToBackend: async (user: User) => {
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user }),
      });
      
      if (res.ok) {
        // 獲取最新的用戶狀態（含 premium_tier 和 debug_mode）
        const getRes = await fetch(`/api/v1/users?uid=${user.uid}`);
        if (getRes.ok) {
          const data = await getRes.json();
          if (data.success && data.data) {
            const dbUser = data.data;
            set({
              user: {
                ...user,
                isPremium: dbUser.premium_tier === 'pro',
                premiumTier: dbUser.premium_tier || 'free',
              },
            });
            // 同步 debug_visibility_mode 從數據庫
            if (dbUser.debug_visibility_mode) {
              useDebugStore.getState().setDebugVisibilityMode(dbUser.debug_visibility_mode);
            }
            // 管理員：從數據庫同步 debug_mode
            if (dbUser.email === ADMIN_EMAIL && dbUser.debug_mode !== undefined) {
              useDebugStore.getState().setAdmin(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('同步用戶到後端失敗:', error);
    }
  },

  // 初始化認證監聽器
  initAuthListener: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || undefined,
          isPremium: false,
          premiumTier: 'free',
        };

        set({ user, isLoading: false, isGuest: false });
        
        // 檢查是否為管理員並設置調試模式
        checkAdminAndSetDebug(user.email);
        
        // 同步並獲取用戶狀態
        get().syncUserToBackend(user);
      } else {
        set({ user: null, isLoading: false });
      }
    });
  },

  // 手動設置用戶 (用於 Mock)
  setUser: (user) => set({ user }),

  // 設置錯誤
  setError: (error) => set({ error }),
}));

// 判斷是否為管理員
export function isAdminEmail(email: string | undefined): boolean {
  return email === ADMIN_EMAIL;
}