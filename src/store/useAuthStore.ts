import { create } from 'zustand';
import { authService, UserProfile } from '../services/authService';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Bắt đầu ở trạng thái Loading để check session
  authError: null,

  login: async (email, password) => {
    set({ isLoading: true, authError: null });
    try {
      const user = await authService.login(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error: any) {
      set({ authError: error.message || 'Đăng nhập thất bại', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      set({ isLoading: false });
    }
  },

  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: user !== null, 
      isLoading: false 
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  clearError: () => {
    set({ authError: null });
  }
}));
export default useAuthStore;
