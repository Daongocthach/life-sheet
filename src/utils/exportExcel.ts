import * as XLSX from 'xlsx';
import { useFinanceStore } from '../store/useFinanceStore';
import { useFoodStore } from '../store/useFoodStore';
import { useWorkoutStore } from '../store/useWorkoutStore';

export const exportToExcel = () => {
  // Lấy dữ liệu từ các Zustand stores
  const { transactions, budgets, getSpentByCategory } = useFinanceStore.getState();
  const { foodEntries } = useFoodStore.getState();
  const { sessions } = useWorkoutStore.getState();

  // Tạo workbook mới
  const wb = XLSX.utils.book_new();

  // 1. Sheet Ngân Sách
  const budgetRows = budgets.map(b => {
    const spent = getSpentByCategory(b.category);
    return {
      'Hạng mục': b.category,
      'Hạn mức ngân sách (đ)': b.limit,
      'Đã chi tiêu (đ)': spent,
      'Còn lại (đ)': b.limit - spent
    };
  });
  const budgetWs = XLSX.utils.json_to_sheet(budgetRows);
  XLSX.utils.book_append_sheet(wb, budgetWs, "Hạn Mức Ngân Sách");

  // 2. Sheet Giao Dịch Tài Chính
  const transactionRows = transactions.map(t => ({
    'Ngày giờ': new Date(t.date).toLocaleString('vi-VN'),
    'Loại': t.type === 'expense' ? 'Chi tiêu' : 'Thu nhập',
    'Số tiền (đ)': t.amount,
    'Hạng mục áp dụng': t.category,
    'Chi tiết ghi chú': t.notes
  }));
  const txWs = XLSX.utils.json_to_sheet(transactionRows);
  XLSX.utils.book_append_sheet(wb, txWs, "Nhật Ký Giao Dịch");

  // 3. Sheet Thực Đơn (Food Diary)
  const weekdayMap: Record<string, string> = {
    '2': 'Thứ Hai',
    '3': 'Thứ Ba',
    '4': 'Thứ Tư',
    '5': 'Thứ Năm',
    '6': 'Thứ Sáu',
    '7': 'Thứ Bảy',
    '8': 'Chủ Nhật'
  };

  const foodRows = foodEntries.map(f => ({
    'Thứ': weekdayMap[f.date] || f.date,
    'Bữa ăn': f.meal === 'breakfast' ? 'Sáng' : f.meal === 'lunch' ? 'Trưa' : f.meal === 'dinner' ? 'Tối' : 'Phụ',
    'Tên thực phẩm & Định lượng': f.name,
    'Protein (g)': f.protein,
    'Carbohydrates (g)': f.carbs,
    'Fat (g)': f.fat,
    'Calories (kcal)': f.calories,
    'Chi phí (đ)': f.price
  }));
  const foodWs = XLSX.utils.json_to_sheet(foodRows);
  XLSX.utils.book_append_sheet(wb, foodWs, "Thực Đơn");

  // 4. Sheet Tập Luyện (Workout Diary)
  const workoutRows: any[] = [];
  sessions.forEach(s => {
    s.exercises.forEach(e => {
      e.sets.forEach((set, index) => {
        workoutRows.push({
          'Ngày tập': s.date,
          'Giáo án': s.routineName,
          'Bài tập': e.name,
          'Hiệp (Set)': index + 1,
          'Mức tạ (kg)': set.weight,
          'Số lần (Reps)': set.reps,
          'Trạng thái': set.done ? 'Hoàn thành ✓' : 'Chưa hoàn thành'
        });
      });
    });
  });
  const workoutWs = XLSX.utils.json_to_sheet(workoutRows);
  XLSX.utils.book_append_sheet(wb, workoutWs, "Nhật Ký Tập Luyện");

  // Xuất file tải xuống trình duyệt
  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `LifeSheet_Premium_Report_${todayStr}.xlsx`);
};
