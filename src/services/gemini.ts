import { matchCategorySmartly } from '../utils/categoryMatcher';

export interface ParseResult {
  type: 'finance' | 'food' | 'workout' | 'budget' | 'unknown';
  action: 'add' | 'update' | 'delete' | 'unknown';
  payload: any;
  reply: string;
}

// Regex fallback parser for local testing
const parseLocalCommand = (text: string, activeCategories?: string[]): ParseResult | null => {
  const normalized = text.toLowerCase().trim();

  const amountPatterns = [
    /(\d+(?:\.\d+)?)\s*(triệu|tr)\b/i,
    /(\d+)\s*m\s*(\d+)?\b/i,
    /(\d+(?:\.\d+)?)\s*k\b/i,
    /(\d+(?:\.\d+)?)\s*(nghìn|ngàn)\b/i,
    /(\d{1,3}(?:\.\d{3})+)\b/,
    /(\d+)\s*(?:đ|đồng|dong|vnd)?\b/i
  ];

  const findAmount = (sourceText: string) => {
    for (const pattern of amountPatterns) {
      const match = sourceText.match(pattern);
      if (match && match.index !== undefined) {
        const rawVal = match[1];
        const amount = (() => {
          if (pattern === amountPatterns[0]) {
            return parseFloat(rawVal.replace(',', '.')) * 1000000;
          }
          if (pattern === amountPatterns[1]) {
            const trieu = parseInt(rawVal) * 1000000;
            const tram = match[2] ? parseInt(match[2].padEnd(3, '0')) * 1000 : 0;
            return trieu + tram;
          }
          if (pattern === amountPatterns[2]) {
            return parseFloat(rawVal.replace(',', '.')) * 1000;
          }
          if (pattern === amountPatterns[3]) {
            return parseFloat(rawVal.replace(',', '.')) * 1000;
          }
          if (pattern === amountPatterns[4]) {
            return parseInt(rawVal.replace(/\./g, ''));
          }
          return parseInt(rawVal);
        })();

        return {
          amount,
          matchStart: match.index,
          matchEnd: match.index + match[0].length,
        };
      }
    }

    return null;
  };

  const cleanCommandPrefix = (input: string) => {
    return input
      .replace(/^\s*(thêm|tạo|ghi|nhập|log|đăng|add)\s+/gi, '')
      .replace(/^\s*(chi tiêu|chi phí|tiêu|thu nhập|giao dịch|mua)\s+/gi, '')
      .replace(/^\s*(là|cho|về|vào)\s+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const buildFinanceCategory = (beforeAmount: string, afterAmount: string) => {
    const beforeClean = cleanCommandPrefix(beforeAmount);
    const afterClean = cleanCommandPrefix(afterAmount);
    const categorySeed = beforeClean || afterClean;

    if (activeCategories && activeCategories.length > 0) {
      const directBefore = activeCategories.find(cat => beforeClean.toLowerCase().includes(cat.toLowerCase()));
      if (directBefore) return directBefore;

      const directAfter = activeCategories.find(cat => afterClean.toLowerCase().includes(cat.toLowerCase()));
      if (directAfter) return directAfter;

      const smartBefore = matchCategorySmartly(beforeClean || afterClean, activeCategories);
      if (smartBefore) return smartBefore;
    }

    const seed = categorySeed.toLowerCase();
    if (seed.includes('ăn') || seed.includes('uống') || seed.includes('bữa') || seed.includes('chợ') || seed.includes('siêu thị')) {
      return 'Ăn uống sinh hoạt';
    }
    if (seed.includes('gym') || seed.includes('tạ') || seed.includes('whey') || seed.includes('supp') || seed.includes('tập')) {
      return 'Thể hình (Gym/Supps)';
    }
    if (seed.includes('điện') || seed.includes('nước') || seed.includes('nhà') || seed.includes('trọ') || seed.includes('wifi')) {
      return 'Chi phí cố định';
    }
    if (seed.includes('học') || seed.includes('sách') || seed.includes('khóa học') || seed.includes('làm việc') || seed.includes('công việc')) {
      return 'Học tập/Công việc';
    }

    return categorySeed || 'Ăn uống sinh hoạt';
  };

  // 1. FINANCE: "thêm chi tiêu 15k bữa sáng" hoặc "chi tiêu 3 triệu gửi về nhà"
  if (normalized.includes('chi tiêu') || normalized.includes('tiêu') || normalized.includes('thu nhập') || normalized.includes('mua') || normalized.includes('giao dịch')) {
    const isExpense = !normalized.includes('thu nhập');
    const amountInfo = findAmount(text);
    const amount = amountInfo?.amount || 0;
    const matchStart = amountInfo?.matchStart ?? -1;
    const matchEnd = amountInfo?.matchEnd ?? -1;

    const textBeforeAmount = matchStart !== -1 ? text.substring(0, matchStart).trim() : text;
    const textAfterAmount = matchEnd !== -1 ? text.substring(matchEnd).trim() : '';

    const category = buildFinanceCategory(textBeforeAmount, textAfterAmount);

    let note = textAfterAmount
      .replace(/^\s*(cho|với|vì|do|là|của|cho khoản|do khoản)\s+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!note) {
      note = isExpense ? 'Chi tiêu tự động' : 'Thu nhập tự động';
    }

    return {
      type: 'finance',
      action: 'add',
      payload: {
        type: isExpense ? 'expense' : 'income',
        amount: amount || 50000,
        category,
        notes: note,
        date: new Date().toISOString()
      },
      reply: `Đã ghi nhận giao dịch thành công: **${isExpense ? 'Chi tiêu' : 'Thu nhập'}** cho **${note}** với số tiền **${new Intl.NumberFormat('vi-VN').format(amount || 50000)} đ** vào hạng mục *${category}*.`
    };
  }

  // 1.5. BUDGET: "thêm ngân sách mua sắm 2 triệu" hoặc "ngân sách du lịch 5tr"
  if (normalized.includes('ngân sách')) {
    const amountPatterns = [
      /(\d+(?:\.\d+)?)\s*(triệu|tr)\b/i,
      /(\d+)\s*m\s*(\d+)?\b/i,
      /(\d+(?:\.\d+)?)\s*k\b/i,
      /(\d+(?:\.\d+)?)\s*(nghìn|ngàn)\b/i,
      /(\d{1,3}(?:\.\d{3})+)\b/,
      /(\d+)\s*(?:đ|đồng|dong|vnd)?\b/i
    ];

    let limit = 0;
    let matchEnd = -1;
    let matchStart = -1;

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        const rawVal = match[1];
        matchStart = match.index;
        matchEnd = match.index + match[0].length;

        if (pattern === amountPatterns[0]) {
          limit = parseFloat(rawVal.replace(',', '.')) * 1000000;
        } else if (pattern === amountPatterns[1]) {
          const trieu = parseInt(rawVal) * 1000000;
          const tram = match[2] ? parseInt(match[2].padEnd(3, '0')) * 1000 : 0;
          limit = trieu + tram;
        } else if (pattern === amountPatterns[2]) {
          limit = parseFloat(rawVal.replace(',', '.')) * 1000;
        } else if (pattern === amountPatterns[3]) {
          limit = parseFloat(rawVal.replace(',', '.')) * 1000;
        } else if (pattern === amountPatterns[4]) {
          limit = parseInt(rawVal.replace(/\./g, ''));
        } else {
          limit = parseInt(rawVal);
        }
        break;
      }
    }

    let category = '';
    const idxBudget = normalized.indexOf('ngân sách');
    if (idxBudget !== -1) {
      const startSearch = idxBudget + 'ngân sách'.length;
      if (matchStart !== -1 && matchStart > startSearch) {
        category = text.substring(startSearch, matchStart).trim();
      } else if (matchEnd !== -1) {
        category = text.substring(matchEnd).trim();
      }
    }
    
    category = category.replace(/^\s*(của|cho|thêm)\s+/gi, '').trim();
    category = category.replace(/\s+/g, ' ').trim();
    
    if (!category) {
      category = 'Khác';
    }

    // Capitalize first letter of category
    category = category.charAt(0).toUpperCase() + category.slice(1);

    return {
      type: 'budget',
      action: 'add',
      payload: {
        category,
        limit: limit || 1000000,
        month: new Date().toISOString().substring(0, 7)
      },
      reply: `Đã cập nhật/thêm hạng mục ngân sách: **${category}** với hạn mức **${new Intl.NumberFormat('vi-VN').format(limit || 1000000)} đ**.`
    };
  }

  // 2. FOOD DIARY: "Bữa trưa nay ăn 150g phi-lê cá basa nướng hết 15 nghìn"
  // Lệnh dạng: (ăn|bữa sáng|bữa trưa|bữa tối|bữa phụ) [gram]g [tên món] [tiền]
  if (normalized.includes('ăn') || normalized.includes('bữa sáng') || normalized.includes('bữa trưa') || normalized.includes('bữa tối') || normalized.includes('bữa phụ')) {
    let meal: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch';
    if (normalized.includes('sáng')) meal = 'breakfast';
    if (normalized.includes('tối')) meal = 'dinner';
    if (normalized.includes('phụ') || normalized.includes('xế')) meal = 'snack';

    // Gram
    let grams = 100;
    const gramMatch = normalized.match(/(\d+)\s*g/i);
    if (gramMatch) {
      grams = parseInt(gramMatch[1]);
    }

    // Giá tiền
    let price = 0;
    const priceMatch = normalized.match(/(?:hết|giá|tốn|mất)\s*(\d+)\s*(?:k|nghìn|ngàn|đ)?/i) || normalized.match(/(\d+)\s*(?:k|nghìn|ngàn)\b/i);
    if (priceMatch) {
      const val = parseInt(priceMatch[1]);
      price = val < 1000 ? val * 1000 : val;
    }

    // Tên món ăn sạch
    let foodName = text;
    foodName = foodName.replace(/bữa sáng|bữa trưa|bữa tối|bữa phụ|ăn|nay|hôm nay|hết|giá|tốn|mất/gi, '').trim();
    foodName = foodName.replace(/\d+\s*g/gi, '').trim();
    foodName = foodName.replace(/(\d+(?:\.\d+)?)\s*(m|k|triệu|tr|nghìn|ngàn|đ|đồng|vnd|vạn)/gi, '').trim();
    foodName = foodName.replace(/\b\d{4,}\b/g, '').trim();
    foodName = foodName.replace(/\s+/g, ' ').trim();
    
    if (!foodName) foodName = 'Thực phẩm dinh dưỡng';

    return {
      type: 'food',
      action: 'add',
      payload: {
        meal,
        name: `${grams}g ${foodName}`,
        protein: 0, // Sẽ tính sau ở store bằng utils
        carbs: 0,
        fat: 0,
        calories: 0,
        price,
        date: new Date().toISOString().split('T')[0]
      },
      reply: `Đã ghi nhận vào **${meal === 'breakfast' ? 'Bữa Sáng' : meal === 'lunch' ? 'Bữa Trưa' : meal === 'dinner' ? 'Bữa Tối' : 'Bữa Phụ'}**: **${grams}g ${foodName}** với giá trị **${new Intl.NumberFormat('vi-VN').format(price)} đ**.`
    };
  }

  // 3. WORKOUT DIARY: "Set 4 bài cuốn tạ tay trước ghi nhận lên được 15kg làm 10 reps"
  // Lệnh dạng: set [số] [bài tập] [khối lượng]kg [reps] reps
  if (normalized.includes('set') || normalized.includes('tập') || normalized.includes('bài')) {
    let setIndex = 1;
    const setMatch = normalized.match(/set\s*(\d+)/i);
    if (setMatch) setIndex = parseInt(setMatch[1]);

    let weight = 10;
    const weightMatch = normalized.match(/(\d+)\s*kg/i);
    if (weightMatch) weight = parseInt(weightMatch[1]);

    let reps = 12;
    const repsMatch = normalized.match(/(\d+)\s*(?:reps|rep|lần|cái)/i);
    if (repsMatch) reps = parseInt(repsMatch[1]);

    let exerciseName = text;
    exerciseName = exerciseName.replace(/set\s*\d+|set/gi, '').trim();
    exerciseName = exerciseName.replace(/\d+\s*kg/gi, '').trim();
    exerciseName = exerciseName.replace(/\d+\s*(?:reps|rep|lần|cái)/gi, '').trim();
    exerciseName = exerciseName.replace(/ghi nhận|ghi|lên được|lên|làm|thực hiện/gi, '').trim();
    exerciseName = exerciseName.replace(/^\s*(?:bài|tập)\s+/gi, '');
    exerciseName = exerciseName.replace(/\s+/g, ' ').trim();

    if (!exerciseName) exerciseName = 'Bài tập gym';

    return {
      type: 'workout',
      action: 'update',
      payload: {
        exerciseName,
        setIndex,
        weight,
        reps,
        done: true
      },
      reply: `Ghi nhận hiệp tập: **Set ${setIndex}** bài **${exerciseName}** với mức tạ **${weight}kg** thực hiện **${reps} reps** thành công! ✓ *Bắt đầu bộ đếm thời gian nghỉ 60s.*`
    };
  }

  return null;
};

export const parseNaturalLanguage = async (text: string, activeCategories?: string[]): Promise<ParseResult> => {
  // Trợ lý cục bộ xử lý trực tiếp không cần API Key
  const fallback = parseLocalCommand(text, activeCategories);
  if (fallback) return fallback;
  
  return {
    type: 'unknown',
    action: 'unknown',
    payload: null,
    reply: "Tôi không hiểu lệnh này. Vui lòng thử viết rõ ràng hơn, ví dụ:\n- **Tài chính**: 'tiêu ăn trưa 45k', 'tiêu mua whey 2M350'\n- **Dinh dưỡng**: 'bữa trưa ăn 150g ức gà hết 30k'\n- **Tập luyện**: 'set 4 bài cuốn tạ 15kg 12 reps'"
  };
};
