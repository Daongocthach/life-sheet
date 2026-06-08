import { create } from 'zustand';
import { FoodEntry } from '../types';
import { foodService } from '../features/food-diary/services/foodService';

export const mapDateToWeekdayStr = (dateStr: string): string => {
  if (!dateStr) return '2';
  const str = String(dateStr).trim();
  if (/^[2-8]$/.test(str)) return str;

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = d.getDay(); // 0 is Sunday, 1 is Monday, ...
      return day === 0 ? '8' : String(day + 1);
    }
  } catch (e) {}

  return '2'; // Fallback to Monday
};

interface FoodState {
  foodEntries: FoodEntry[];
  dailyCalorieGoal: number;
  macroGoals: {
    protein: number;
    carbs: number;
    fat: number;
  };
  initListeners: () => () => void;
  addFoodEntry: (entry: Omit<FoodEntry, 'id'>) => void;
  deleteFoodEntry: (id: string) => void;
  setFoodEntries: (entries: FoodEntry[]) => void;
  getTotalsForDate: (date: string) => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    cost: number;
  };
}

export const useFoodStore = create<FoodState>((set, get) => ({
  foodEntries: [],
  dailyCalorieGoal: 2200,
  macroGoals: {
    protein: 150,
    carbs: 200,
    fat: 60,
  },

  initListeners: () => {
    const unsub = foodService.subscribeFoodEntries((foodEntries) => {
      set({ foodEntries });
    });

    const handleStorageChange = () => {
      const local = localStorage.getItem('lifesheet_food_entries');
      if (local) set({ foodEntries: JSON.parse(local) });
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsub();
      window.removeEventListener('storage', handleStorageChange);
    };
  },

  addFoodEntry: (entry) => {
    const mappedDate = mapDateToWeekdayStr(entry.date);
    foodService.addFoodEntry({ ...entry, date: mappedDate }).catch(err => {
      console.error("Lỗi khi thêm thực phẩm qua service:", err);
    });
  },

  deleteFoodEntry: (id) => {
    foodService.deleteFoodEntry(id).catch(err => {
      console.error("Lỗi khi xóa thực phẩm qua service:", err);
    });
  },

  setFoodEntries: (entries) => set({ foodEntries: entries }),

  getTotalsForDate: (date) => {
    const { foodEntries } = get();
    const dayEntries = foodEntries.filter((e) => e.date === date);
    
    return dayEntries.reduce(
      (totals, e) => {
        totals.calories += e.calories;
        totals.protein += e.protein;
        totals.carbs += e.carbs;
        totals.fat += e.fat;
        totals.cost += e.price;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 }
    );
  },
}));
