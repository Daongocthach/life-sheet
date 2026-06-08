import { create } from 'zustand';
import { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  highlightedTable: 'finance' | 'food' | 'workout' | null;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setLoading: (isLoading: boolean) => void;
  triggerHighlight: (table: 'finance' | 'food' | 'workout') => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: 'welcome',
      role: 'ai',
      content: 'chatbot.welcome', // Key translation hoặc content
      timestamp: new Date().toISOString(),
    },
  ],
  isLoading: false,
  highlightedTable: null,
  addMessage: (msg) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, newMsg],
    }));
  },
  clearMessages: () => set({ messages: [] }),
  setLoading: (isLoading) => set({ isLoading }),
  triggerHighlight: (table) => {
    set({ highlightedTable: table });
    // Reset sau 1.5 giây
    setTimeout(() => {
      set({ highlightedTable: null });
    }, 1500);
  },
}));
