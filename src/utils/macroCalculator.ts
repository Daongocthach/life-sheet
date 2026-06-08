export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

/**
 * Ước tính dinh dưỡng (Protein, Carbs, Fat, Calories) cho một số thực phẩm phổ biến dựa trên gram.
 * Giá trị dinh dưỡng tính trên 100g.
 */
export const estimateMacros = (foodName: string, grams: number): Macros => {
  const nameLower = foodName.toLowerCase();
  let p: number;   // Đạm per 100g
  let c: number;   // Tinh bột per 100g
  let f: number;   // Béo per 100g
  let cal: number; // Calories per 100g

  if (nameLower.includes('cá basa') || nameLower.includes('cá phi lê') || nameLower.includes('cá hồi')) {
    p = 18;
    c = 0;
    f = 5;
    cal = 120;
  } else if (nameLower.includes('whey') || nameLower.includes('sữa bột protein')) {
    p = 80;
    c = 6;
    f = 3;
    cal = 370;
  } else if (nameLower.includes('ức gà') || nameLower.includes('thịt gà') || nameLower.includes('gà')) {
    p = 31;
    c = 0;
    f = 3.6;
    cal = 165;
  } else if (nameLower.includes('bò') || nameLower.includes('thịt bò')) {
    p = 26;
    c = 0;
    f = 12;
    cal = 220;
  } else if (nameLower.includes('trứng')) {
    // 1 quả trứng ~ 50g
    p = 13;
    c = 1.1;
    f = 11;
    cal = 155;
  } else if (nameLower.includes('cơm') || nameLower.includes('gạo')) {
    p = 2.7;
    c = 28;
    f = 0.3;
    cal = 130;
  } else if (nameLower.includes('khoai tây') || nameLower.includes('khoai lang')) {
    p = 1.6;
    c = 20;
    f = 0.1;
    cal = 86;
  } else if (nameLower.includes('chuối')) {
    p = 1.1;
    c = 23;
    f = 0.3;
    cal = 89;
  } else if (nameLower.includes('sữa tươi') || nameLower.includes('sữa')) {
    p = 3.2;
    c = 4.8;
    f = 3.2;
    cal = 62;
  } else {
    // Mặc định thực phẩm chung chung
    p = 10;
    c = 15;
    f = 3;
    cal = 120;
  }

  const factor = grams / 100;
  
  return {
    protein: Math.round(p * factor * 10) / 10,
    carbs: Math.round(c * factor * 10) / 10,
    fat: Math.round(f * factor * 10) / 10,
    calories: Math.round(cal * factor),
  };
};
