/**
 * So khớp thông minh danh mục đã phân tách (từ AI/Regex) với danh sách danh mục ngân sách hiện có.
 * Hỗ trợ khớp chính xác, khớp một phần, và ánh xạ từ khóa thông dụng.
 */
export const matchCategorySmartly = (parsedCategory: string, budgetCategories: string[]): string => {
  const normParsed = parsedCategory.toLowerCase().trim();
  
  if (budgetCategories.length === 0) return parsedCategory;

  // 1. Khớp chính xác (không phân biệt hoa thường)
  const exact = budgetCategories.find(cat => cat.toLowerCase() === normParsed);
  if (exact) return exact;
  
  // 2. Khớp một phần (substring)
  const sub = budgetCategories.find(cat => 
    cat.toLowerCase().includes(normParsed) || 
    normParsed.includes(cat.toLowerCase())
  );
  if (sub) return sub;
  
  // 3. Khớp nâng cao theo từ khóa thông dụng (phòng trường hợp đổi tên)
  const keywordMappings: { [key: string]: string[] } = {
    'Ăn uống sinh hoạt': ['ăn', 'uống', 'sinh hoạt', 'thực phẩm', 'chợ', 'siêu thị', 'ăn vặt', 'food', 'eat', 'dinner', 'lunch', 'breakfast'],
    'Thể hình (Gym/Supps)': ['gym', 'supp', 'thể hình', 'tạ', 'tập', 'protein', 'whey', 'workout', 'fitness', 'cardio'],
    'Chi phí cố định': ['cố định', 'điện', 'nước', 'nhà', 'trọ', 'mạng', 'wifi', 'rent', 'bill', 'fixed'],
    'Học tập/Công việc': ['học', 'sách', 'khóa học', 'làm việc', 'công việc', 'work', 'study', 'course', 'book', 'office']
  };

  let matchedGroup: string | null = null;
  
  // Tìm nhóm gốc phù hợp nhất với danh mục phân tách được
  for (const [group, keywords] of Object.entries(keywordMappings)) {
    if (
      keywords.some(kw => normParsed.includes(kw)) || 
      group.toLowerCase().includes(normParsed) || 
      normParsed.includes(group.toLowerCase())
    ) {
      matchedGroup = group;
      break;
    }
  }

  if (matchedGroup) {
    const keywords = keywordMappings[matchedGroup];
    // Tìm trong danh mục ngân sách của người dùng xem có mục nào chứa từ khóa tương ứng không
    const matchByKeyword = budgetCategories.find(cat => {
      const catLower = cat.toLowerCase();
      return (
        keywords.some(kw => catLower.includes(kw)) || 
        catLower.includes(matchedGroup!.toLowerCase()) || 
        matchedGroup!.toLowerCase().includes(catLower)
      );
    });
    if (matchByKeyword) {
      return matchByKeyword;
    }
  }

  // 4. Khớp theo mức độ trùng lặp từ (Word overlap)
  const parsedWords = normParsed.split(/[\s/\-,()&]+/);
  let bestMatch: string | null = null;
  let maxOverlap = 0;
  
  budgetCategories.forEach(cat => {
    const catWords = cat.toLowerCase().split(/[\s/\-,()&]+/);
    const overlap = parsedWords.filter(w => w.length > 1 && catWords.includes(w)).length;
    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      bestMatch = cat;
    }
  });

  if (bestMatch && maxOverlap > 0) {
    return bestMatch;
  }

  // 5. Mặc định giữ nguyên danh mục gốc người dùng nhập/AI phân tách
  return parsedCategory;
};
