import { foodRepository } from '../repositories/foodRepository';
import { FoodEntry } from '../../../types';
import { estimateMacros } from '../../../utils/macroCalculator';

export const foodService = {
  subscribeFoodEntries(onUpdate: (entries: FoodEntry[]) => void): () => void {
    return foodRepository.subscribeFoodEntries(onUpdate);
  },

  async addFoodEntry(entry: Omit<FoodEntry, 'id'>): Promise<void> {
    if (!entry.name.trim()) {
      throw new Error("Tên thực phẩm không được để trống");
    }
    return foodRepository.addFoodEntry(entry);
  },

  async addFoodEntryWithAutoMacros(
    entry: Omit<FoodEntry, 'id' | 'protein' | 'carbs' | 'fat' | 'calories'> & { grams: number }
  ): Promise<void> {
    const baseName = entry.name.replace(/^\d+g\s+/i, '');
    const macros = estimateMacros(baseName, entry.grams);

    const finalEntry: Omit<FoodEntry, 'id'> = {
      meal: entry.meal,
      name: `${entry.grams}g ${baseName}`,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      calories: macros.calories,
      price: entry.price,
      date: entry.date
    };

    return foodRepository.addFoodEntry(finalEntry);
  },

  async deleteFoodEntry(id: string): Promise<void> {
    if (!id) throw new Error("ID thực phẩm không hợp lệ");
    return foodRepository.deleteFoodEntry(id);
  }
};
export default foodService;
