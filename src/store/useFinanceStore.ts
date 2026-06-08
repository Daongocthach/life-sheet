import { create } from 'zustand';
import { Transaction, Budget } from '../types';
import { financeService } from '../features/manage-money/services/financeService';
import { useMonthStore } from './useMonthStore';
import { matchCategorySmartly } from '../utils';

interface FinanceState {
  budgets: Budget[];
  transactions: Transaction[];
  hideAmounts: boolean;
  toggleHideAmounts: () => void;
  initListeners: () => () => void; // Trả về hàm unsubscribe
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void;
  updateBudgetLimit: (category: string, limit: number, month?: string) => void;
  addBudgetCategory: (category: string, limit: number, month?: string) => void;
  deleteBudgetCategory: (category: string, month?: string) => void;
  updateBudgetCategoryName: (oldCategory: string, newCategory: string, month?: string) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  getSpentByCategory: (category: string) => number;
  copyBudgetsFromMonth: (sourceMonth: string, targetMonth: string) => void;
  initializeDefaultBudgets: (month: string) => void;
}


export const useFinanceStore = create<FinanceState>((set, get) => ({
  budgets: [],
  transactions: [],
  hideAmounts: localStorage.getItem('lifesheet_hide_amounts') === 'true',
  toggleHideAmounts: () => {
    const nextVal = !get().hideAmounts;
    localStorage.setItem('lifesheet_hide_amounts', String(nextVal));
    set({ hideAmounts: nextVal });
  },
  
  // Khởi chạy các listener lắng nghe từ Service
  initListeners: () => {
    const unsubBudgets = financeService.subscribeBudgets((budgets) => {
      const sanitized = budgets.map(b => ({
        ...b,
        limit: typeof b.limit === 'number' ? b.limit : parseInt(String(b.limit).replace(/[^\d]/g, ''), 10) || 0
      }));
      set({ budgets: sanitized });
    });
    
    const unsubTransactions = financeService.subscribeTransactions((transactions) => {
      const sanitized = transactions.map(t => ({
        ...t,
        amount: typeof t.amount === 'number' ? t.amount : parseInt(String(t.amount).replace(/[^\d]/g, ''), 10) || 0
      }));
      set({ transactions: sanitized });
    });

    const handleStorageChange = () => {
      const budgetsLocal = localStorage.getItem('lifesheet_budgets');
      const txLocal = localStorage.getItem('lifesheet_transactions');
      if (budgetsLocal) {
        const parsed = JSON.parse(budgetsLocal);
        const sanitized = parsed.map((b: any) => ({
          ...b,
          limit: typeof b.limit === 'number' ? b.limit : parseInt(String(b.limit).replace(/[^\d]/g, ''), 10) || 0
        }));
        set({ budgets: sanitized });
      }
      if (txLocal) {
        const parsed = JSON.parse(txLocal);
        const sanitized = parsed.map((t: any) => ({
          ...t,
          amount: typeof t.amount === 'number' ? t.amount : parseInt(String(t.amount).replace(/[^\d]/g, ''), 10) || 0
        }));
        set({ transactions: sanitized });
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubBudgets();
      unsubTransactions();
      window.removeEventListener('storage', handleStorageChange);
    };
  },

  addTransaction: (transaction) => {
    const { budgets } = get();
    // Match category to existing budgets (handling typos/substrings/custom names)
    let matchedCategory = transaction.category;
    if (transaction.type === 'expense') {
      const txMonth = transaction.date ? transaction.date.substring(0, 7) : 'all';
      // Lọc ra các ngân sách thuộc tháng của giao dịch này
      let targetMonthBudgets = budgets.filter(b => b.month === txMonth);
      if (targetMonthBudgets.length === 0 && txMonth !== 'all') {
        const selectedMonth = useMonthStore.getState().selectedMonth;
        targetMonthBudgets = budgets.filter(b => b.month === selectedMonth);
      }
      
      const budgetCategories = targetMonthBudgets.map(b => b.category);
      matchedCategory = matchCategorySmartly(transaction.category, budgetCategories);
    }
    
    // Ensure amount is parsed as integer number
    const amountVal = (transaction as any).amount;
    const cleanAmount = typeof amountVal === 'number'
      ? amountVal
      : parseInt(String(amountVal).replace(/[^\d]/g, ''), 10) || 0;

    financeService.addTransaction({
      ...transaction,
      category: matchedCategory,
      amount: cleanAmount,
    }).catch(err => {
      console.error("Lỗi khi thêm giao dịch qua service:", err);
    });
  },
  
  deleteTransaction: (id) => {
    financeService.deleteTransaction(id).catch(err => {
      console.error("Lỗi khi xóa giao dịch qua service:", err);
    });
  },
  
  updateTransaction: (id, updates) => {
    const { budgets } = get();
    const updatedFields = { ...updates };
    
    if (updates.category !== undefined) {
      const targetType = updates.type !== undefined ? updates.type : 'expense';
      let matchedCategory = updates.category;
      
      if (targetType === 'expense') {
        const txMonth = updates.date ? updates.date.substring(0, 7) : useMonthStore.getState().selectedMonth;
        let targetMonthBudgets = budgets.filter(b => b.month === txMonth);
        if (targetMonthBudgets.length === 0 && txMonth !== 'all') {
          targetMonthBudgets = budgets.filter(b => b.month === useMonthStore.getState().selectedMonth);
        }
        const budgetCategories = targetMonthBudgets.map(b => b.category);
        matchedCategory = matchCategorySmartly(updates.category, budgetCategories);
      }
      updatedFields.category = matchedCategory;
    }
    
    if (updates.amount !== undefined) {
      const amountVal = updates.amount;
      updatedFields.amount = typeof amountVal === 'number'
        ? amountVal
        : parseInt(String(amountVal).replace(/[^\d]/g, ''), 10) || 0;
    }
    
    financeService.updateTransaction(id, updatedFields).catch(err => {
      console.error("Lỗi khi cập nhật giao dịch qua service:", err);
    });
  },
  
  updateBudgetLimit: (category, limit, month) => {
    financeService.updateBudgetLimit(category, limit, month).catch(err => {
      console.error("Lỗi khi cập nhật hạn mức qua service:", err);
    });
  },
  
  addBudgetCategory: (category, limit, month) => {
    financeService.addBudgetCategory(category, limit, month).catch(err => {
      console.error("Lỗi khi thêm hạng mục qua service:", err);
    });
  },
  
  deleteBudgetCategory: (category, month) => {
    financeService.deleteBudgetCategory(category, month).catch(err => {
      console.error("Lỗi khi xóa hạng mục qua service:", err);
    });
  },
  
  updateBudgetCategoryName: (oldCategory, newCategory, month) => {
    financeService.updateBudgetCategoryName(oldCategory, newCategory, month).catch(err => {
      console.error("Lỗi khi đổi tên hạng mục qua service:", err);
    });
  },
  
  setTransactions: (transactions) => set({ transactions }),
  setBudgets: (budgets) => set({ budgets }),
  
  getSpentByCategory: (category) => {
    const { transactions } = get();
    const selectedMonth = useMonthStore.getState().selectedMonth;
    return transactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        
        // Lọc giao dịch theo tháng được chọn
        if (selectedMonth !== 'all') {
          if (!t.date.startsWith(selectedMonth)) return false;
        }
        
        // Exact match
        if (t.category === category) return true;
        
        // Case-insensitive exact match
        const tCatLower = t.category.toLowerCase();
        const catLower = category.toLowerCase();
        if (tCatLower === catLower) return true;
        
        // Substring matching
        if (tCatLower.includes(catLower) || catLower.includes(tCatLower)) return true;
        
        // Handle common variations (Vietnamese accents/abbreviations)
        if (category === 'Ăn uống sinh hoạt' && (tCatLower.includes('ăn uống') || tCatLower.includes('sinh hoạt') || tCatLower.includes('ăn sáng') || tCatLower.includes('ăn trưa') || tCatLower.includes('ăn tối'))) return true;
        if (category === 'Thể hình (Gym/Supps)' && (tCatLower.includes('gym') || tCatLower.includes('supp') || tCatLower.includes('thể hình') || tCatLower.includes('tạ'))) return true;
        if (category === 'Chi phí cố định' && (tCatLower.includes('cố định') || tCatLower.includes('điện') || tCatLower.includes('nước') || tCatLower.includes('nhà') || tCatLower.includes('trọ'))) return true;
        if (category === 'Học tập/Công việc' && (tCatLower.includes('học') || tCatLower.includes('sách') || tCatLower.includes('làm việc') || tCatLower.includes('công việc'))) return true;
 
        return false;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  },

  copyBudgetsFromMonth: (sourceMonth, targetMonth) => {
    const { budgets } = get();
    const sourceBudgets = budgets.filter(b => b.month === sourceMonth);
    sourceBudgets.forEach(b => {
      get().addBudgetCategory(b.category, b.limit, targetMonth);
    });
  },

  initializeDefaultBudgets: (month) => {
    const defaultBudgets = [
      { category: 'Ăn uống sinh hoạt', limit: 5000000 },
      { category: 'Thể hình (Gym/Supps)', limit: 3000000 },
      { category: 'Chi phí cố định', limit: 4000000 },
      { category: 'Học tập/Công việc', limit: 2000000 },
    ];
    defaultBudgets.forEach(b => {
      get().addBudgetCategory(b.category, b.limit, month);
    });
  },
}));

