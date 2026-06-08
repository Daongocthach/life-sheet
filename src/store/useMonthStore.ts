import { create } from 'zustand';

interface MonthState {
  selectedMonth: string; // "YYYY-MM" format or "all"
  setSelectedMonth: (month: string) => void;
}

const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const useMonthStore = create<MonthState>((set) => ({
  selectedMonth: getCurrentMonth(),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
}));

export default useMonthStore;
