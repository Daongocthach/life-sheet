import { financeRepository } from '../repositories/financeRepository';
import { Transaction, Budget } from '../../../types';

export const financeService = {
  subscribeBudgets(onUpdate: (budgets: Budget[]) => void): () => void {
    return financeRepository.subscribeBudgets(onUpdate);
  },

  subscribeTransactions(onUpdate: (txs: Transaction[]) => void): () => void {
    return financeRepository.subscribeTransactions(onUpdate);
  },

  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<void> {
    if (tx.amount <= 0) {
      throw new Error("Số tiền giao dịch phải lớn hơn 0");
    }
    return financeRepository.addTransaction(tx);
  },

  async deleteTransaction(id: string): Promise<void> {
    if (!id) throw new Error("ID giao dịch không hợp lệ");
    return financeRepository.deleteTransaction(id);
  },

  async updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id'>>): Promise<void> {
    if (!id) throw new Error("ID giao dịch không hợp lệ");
    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error("Số tiền giao dịch phải lớn hơn 0");
    }
    return financeRepository.updateTransaction(id, updates);
  },

  async updateBudgetLimit(category: string, limit: number, month?: string): Promise<void> {
    if (limit < 0) {
      throw new Error("Hạn mức ngân sách không được nhỏ hơn 0");
    }
    return financeRepository.saveBudgetLimit(category, limit, month);
  },

  async addBudgetCategory(category: string, limit: number, month?: string): Promise<void> {
    const trimmed = category.trim();
    if (!trimmed) {
      throw new Error("Tên hạng mục mới không được để trống");
    }
    if (limit < 0) {
      throw new Error("Hạn mức ngân sách không được nhỏ hơn 0");
    }
    return financeRepository.addBudgetCategory(trimmed, limit, month);
  },

  async deleteBudgetCategory(category: string, month?: string): Promise<void> {
    if (!category) throw new Error("Hạng mục xóa không hợp lệ");
    return financeRepository.deleteBudgetCategory(category, month);
  },

  async updateBudgetCategoryName(oldCategory: string, newCategory: string, month?: string): Promise<void> {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      throw new Error("Tên hạng mục mới không được để trống");
    }
    return financeRepository.renameBudgetCategory(oldCategory, trimmed, month);
  }

};
export default financeService;
