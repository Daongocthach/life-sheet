import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-messaging-sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id"
};

// Kiểm tra xem có cấu hình thật hay không
const isMock = firebaseConfig.apiKey === "mock-api-key" || !import.meta.env.VITE_FIREBASE_API_KEY;

let appInstance = null;
let dbInstance = null;
let authInstance = null;

if (!isMock) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    dbInstance = getDatabase(appInstance);
    authInstance = getAuth(appInstance);
  } catch (error) {
    console.error("Lỗi khi kết nối Firebase:", error);
  }
}

export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;
export const isFirebaseConfigured = !isMock && dbInstance !== null && authInstance !== null;
