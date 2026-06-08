import {
  ref,
  set,
  push,
  remove,
  onValue,
  off
} from 'firebase/database';
import { db, auth, isFirebaseConfigured } from '../../../services/firebase';
import { FoodEntry } from '../../../types';

const LOCAL_STORAGE_FOOD_KEY = 'lifesheet_food_entries';

const getUserId = () => auth?.currentUser?.uid || 'guest';

export const foodRepository = {
  subscribeFoodEntries(onUpdate: (entries: FoodEntry[]) => void): () => void {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_FOOD_KEY);
      onUpdate(local ? JSON.parse(local) : []);
      return () => {};
    }

    const foodRef = ref(db, `users/${getUserId()}/foodEntries`);
    const unsubscribe = onValue(foodRef, (snapshot) => {
      const data = snapshot.val();
      const entries: FoodEntry[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          entries.push({ ...data[key], id: key } as FoodEntry);
        });
      }
      // Sắp xếp ngày giảm dần
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(entries);
    }, (error) => {
      console.error("Lỗi khi tải food entries từ Realtime DB:", error);
    });

    return () => off(foodRef, 'value', unsubscribe);
  },

  async addFoodEntry(entry: Omit<FoodEntry, 'id'>): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_FOOD_KEY);
      const entries: FoodEntry[] = local ? JSON.parse(local) : [];
      const newEntry: FoodEntry = {
        ...entry,
        id: Math.random().toString(36).substring(2, 9)
      };
      const updated = [...entries, newEntry];
      localStorage.setItem(LOCAL_STORAGE_FOOD_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return;
    }
    const foodRef = ref(db, `users/${getUserId()}/foodEntries`);
    const newRef = push(foodRef);
    await set(newRef, entry);
  },

  async deleteFoodEntry(id: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      const local = localStorage.getItem(LOCAL_STORAGE_FOOD_KEY);
      if (local) {
        const entries: FoodEntry[] = JSON.parse(local);
        const updated = entries.filter(e => e.id !== id);
        localStorage.setItem(LOCAL_STORAGE_FOOD_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      }
      return;
    }
    await remove(ref(db, `users/${getUserId()}/foodEntries/${id}`));
  }
};
export default foodRepository;
