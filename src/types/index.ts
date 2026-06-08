export interface Transaction {
  id: string;
  date: string; // ISO string or format 'DD/MM/YYYY - HH:mm'
  type: 'income' | 'expense';
  amount: number;
  category: string;
  notes: string;
}

export interface Budget {
  category: string;
  limit: number;
  month?: string; // YYYY-MM
}

export interface FoodEntry {
  id: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
  calories: number;
  price: number;
  date: string; // YYYY-MM-DD
}

export interface WorkoutSet {
  id: string;
  weight: number; // kg
  reps: number;
  done: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  done?: boolean;
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD or standard display format
  routineName: string;
  exercises: Exercise[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string; // ISO string
}
