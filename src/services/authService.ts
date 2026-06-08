import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

export interface UserProfile {
  email: string;
  isMock: boolean;
}

// Chế độ Offline tài khoản mẫu
const MOCK_CREDENTIALS = {
  email: 'admin@lifesheet.vn',
  password: 'admin123',
};

const LOCAL_STORAGE_KEY = 'lifesheet_auth_user';

export const authService = {
  /**
   * Đăng nhập bằng Email và Password
   */
  async login(email: string, password: string): Promise<UserProfile> {
    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        return {
          email: user.email || email,
          isMock: false,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Đăng nhập Firebase thất bại.', { cause: error });
      }
    } else {
      // Chế độ Offline/Mock
      if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
        const user = { email, isMock: true };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
        return user;
      } else {
        throw new Error('Sai tài khoản hoặc mật khẩu ở chế độ offline.');
      }
    }
  },

  /**
   * Đăng xuất khỏi hệ thống
   */
  async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  },

  /**
   * Đăng ký lắng nghe sự thay đổi trạng thái đăng nhập
   */
  subscribeAuthState(callback: (user: UserProfile | null) => void): () => void {
    if (isFirebaseConfigured && auth) {
      return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          callback({
            email: firebaseUser.email || '',
            isMock: false,
          });
        } else {
          callback(null);
        }
      });
    } else {
      // Chế độ Offline/Mock
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          callback(JSON.parse(stored));
        } catch {
          callback(null);
        }
      } else {
        callback(null);
      }
      // Trả về hàm unsub rỗng
      return () => {};
    }
  }
};
export default authService;
