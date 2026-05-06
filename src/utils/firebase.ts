// ==========================================
// Firebase 配置
// ==========================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 导出 Auth 實例和 Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 強制每次登錄都顯示帳戶選擇器，避免緩存導致無法切換帳戶
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
