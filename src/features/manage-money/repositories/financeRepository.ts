import {
  ref,
  set,
  push,
  remove,
  onValue,
  off,
  get,
  update
} from 'firebase/database';
import { db, auth, isFirebaseConfigured } from '../../../services/firebase';
import { Transaction, Budget } from '../../../types';

const LOCAL_STORAGE_BUDGETS_KEY = 'lifesheet_budgets';
const LOCAL_STORAGE_TRANSACTIONS_KEY = 'lifesheet_transactions';

const defaultBudgets: Budget[] = [
  { category: 'Ăn uống sinh hoạt', limit: 5000000 },
  { category: 'Thể hình (Gym/Supps)', limit: 3000000 },
  { category: 'Chi phí cố định', limit: 4000000 },
  { category: 'Học tập/Công việc', limit: 2000000 },
];

const getUserId = () => auth?.currentUser?.uid || 'guest';

export const financeRepository = {
  // 1. BUDGETS
  subscribeBudgets(onUpdate: (budgets: Budget[]) => void): () => void {
    if (!isFirebaseConfigured || !db) {
      // LocalStorage Fallback
      const local = localStorage.getItem(LOCAL_STORAGE_BUDGETS_KEY);
      if (local) {
        onUpdate(JSON.parse(local));
      } else {
        localStorage.setItem(LOCAL_STORAGE_BUDGETS_KEY, JSON.stringify([]));
        onUpdate([]);
      }
      return () => {};
    }

    const budgetsRef = ref(db, `users/${getUserId()}/budgets`);
    const unsubscribe = onValue(budgetsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        onUpdate([]);
      } else {
        const list: Budget[] = Object.values(data);
        onUpdate(list);
      }
    }, (error) => {
      console.error("Lỗi khi tải budgets từ Realtime DB:", error);
    });

    return () => off(budgetsRef, 'value', unsubscribe);
  },

  async saveBudgetLimit(category: string, limit: number, month?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_BUDGETS_KEY);
      if (local) {
        const budgets: Budget[] = JSON.parse(local);
        const updated = budgets.map(b => (b.category === category && (!month || !b.month || b.month === month)) ? { ...b, limit } : b);
        localStorage.setItem(LOCAL_STORAGE_BUDGETS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      }
      return;
    }
    const userId = getUserId();
    const budgetsRef = ref(db, `users/${userId}/budgets`);
    const snapshot = await get(budgetsRef);
    const data = snapshot.val();
    if (data) {
      const key = Object.keys(data).find(k => data[k].category === category && (!month || !data[k].month || data[k].month === month));
      if (key) {
        await update(ref(db, `users/${userId}/budgets/${key}`), { limit });
      }
    }
  },

  async addBudgetCategory(category: string, limit: number, month?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_BUDGETS_KEY);
      const budgets: Budget[] = local ? JSON.parse(local) : defaultBudgets;
      if (budgets.some(b => b.category === category && b.month === month)) return;
      
      const updated = [...budgets, { category, limit, month }];
      localStorage.setItem(LOCAL_STORAGE_BUDGETS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return;
    }
    const userId = getUserId();
    const budgetsRef = ref(db, `users/${userId}/budgets`);
    const snapshot = await get(budgetsRef);
    const data = snapshot.val();
    if (data) {
      const exists = Object.values(data).some((b: any) => b.category === category && b.month === month);
      if (exists) return;
    }
    const newRef = push(budgetsRef);
    await set(newRef, { category, limit, month });
  },

  async deleteBudgetCategory(category: string, month?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_BUDGETS_KEY);
      if (local) {
        const budgets: Budget[] = JSON.parse(local);
        const updated = budgets.filter(b => !(b.category === category && (!month || !b.month || b.month === month)));
        localStorage.setItem(LOCAL_STORAGE_BUDGETS_KEY, JSON.stringify(updated));
        
        // Cập nhật giao dịch tương ứng
        const txsLocal = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
        if (txsLocal) {
          const txs: Transaction[] = JSON.parse(txsLocal);
          const updatedTxs = txs.map(t => (t.category === category && (!month || t.date.startsWith(month))) ? { ...t, category: 'Khác' } : t);
          localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updatedTxs));
        }
        window.dispatchEvent(new Event('storage'));
      }
      return;
    }

    const userId = getUserId();
    // Xóa ngân sách
    const budgetsRef = ref(db, `users/${userId}/budgets`);
    const snapshot = await get(budgetsRef);
    const data = snapshot.val();
    if (data) {
      const key = Object.keys(data).find(k => data[k].category === category && (!month || !data[k].month || data[k].month === month));
      if (key) {
        await remove(ref(db, `users/${userId}/budgets/${key}`));
      }
    }

    // Cập nhật giao dịch thuộc hạng mục bị xóa
    const txRef = ref(db, `users/${userId}/transactions`);
    const txSnapshot = await get(txRef);
    const txData = txSnapshot.val();
    if (txData) {
      const updates: any = {};
      Object.keys(txData).forEach((k) => {
        if (txData[k].category === category && (!month || txData[k].date.startsWith(month))) {
          updates[`/users/${userId}/transactions/${k}/category`] = 'Khác';
        }
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    }
  },

  async renameBudgetCategory(oldCategory: string, newCategory: string, month?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_BUDGETS_KEY);
      if (local) {
        const budgets: Budget[] = JSON.parse(local);
        const updated = budgets.map(b => (b.category === oldCategory && (!month || !b.month || b.month === month)) ? { ...b, category: newCategory } : b);
        localStorage.setItem(LOCAL_STORAGE_BUDGETS_KEY, JSON.stringify(updated));
        
        // Đồng bộ giao dịch
        const txsLocal = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
        if (txsLocal) {
          const txs: Transaction[] = JSON.parse(txsLocal);
          const updatedTxs = txs.map(t => (t.category === oldCategory && (!month || t.date.startsWith(month))) ? { ...t, category: newCategory } : t);
          localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updatedTxs));
        }
        window.dispatchEvent(new Event('storage'));
      }
      return;
    }

    const userId = getUserId();
    // Cập nhật tên trong Budgets
    const budgetsRef = ref(db, `users/${userId}/budgets`);
    const snapshot = await get(budgetsRef);
    const data = snapshot.val();
    if (data) {
      const key = Object.keys(data).find(k => data[k].category === oldCategory && (!month || !data[k].month || data[k].month === month));
      if (key) {
        await update(ref(db, `users/${userId}/budgets/${key}`), { category: newCategory });
      }
    }

    // Đồng bộ các giao dịch có tên cũ
    const txRef = ref(db, `users/${userId}/transactions`);
    const txSnapshot = await get(txRef);
    const txData = txSnapshot.val();
    if (txData) {
      const updates: any = {};
      Object.keys(txData).forEach((k) => {
        if (txData[k].category === oldCategory && (!month || txData[k].date.startsWith(month))) {
          updates[`/users/${userId}/transactions/${k}/category`] = newCategory;
        }
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    }
  },


  // 2. TRANSACTIONS
  subscribeTransactions(onUpdate: (txs: Transaction[]) => void): () => void {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
      if (local) {
        onUpdate(JSON.parse(local));
      } else {
        localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify([]));
        onUpdate([]);
      }
      return () => {};
    }

    const txRef = ref(db, `users/${getUserId()}/transactions`);
    const unsubscribe = onValue(txRef, (snapshot) => {
      const data = snapshot.val();
      const txs: Transaction[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          txs.push({ ...data[key], id: key } as Transaction);
        });
      }
      // Sắp xếp ngày giảm dần
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(txs);
    }, (error) => {
      console.error("Lỗi khi tải transactions từ Realtime DB:", error);
    });

    return () => off(txRef, 'value', unsubscribe);
  },

  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
      const txs: Transaction[] = local ? JSON.parse(local) : [];
      const newTx: Transaction = {
        ...tx,
        id: Math.random().toString(36).substring(2, 9)
      };
      const updated = [newTx, ...txs];
      localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return;
    }
    const txRef = ref(db, `users/${getUserId()}/transactions`);
    const newRef = push(txRef);
    await set(newRef, tx);
  },

  async deleteTransaction(id: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
      if (local) {
        const txs: Transaction[] = JSON.parse(local);
        const updated = txs.filter(t => t.id !== id);
        localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      }
      return;
    }
    await remove(ref(db, `users/${getUserId()}/transactions/${id}`));
  },

  async updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id'>>): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
      if (local) {
        const txs: Transaction[] = JSON.parse(local);
        const updated = txs.map(t => t.id === id ? { ...t, ...updates } : t);
        localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      }
      return;
    }
    const txRef = ref(db, `users/${getUserId()}/transactions/${id}`);
    await update(txRef, updates);
  }
};
export default financeRepository;
