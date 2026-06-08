import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, RotateCw, ChevronDown, ChevronUp, Calendar, ChevronLeft, ChevronRight, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { useFoodStore } from '../../../store/useFoodStore';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { estimateMacros } from '../../../utils/macroCalculator';
import { formatCurrency } from '../../../utils/formatCurrency';
import { confirmDelete } from '../../../utils/confirm';
import { MacrosDashboard } from './MacrosDashboard';

const resolveDateFromExcelRow = (val: any): string | null => {
  if (!val) return null;
  const str = String(val).trim();
  
  if (/^[2-8]$/.test(str)) {
    return str;
  }

  const norm = str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');

  if (norm.includes('hai') || norm.includes('t2') || norm === '2' || norm.includes('mon')) return '2';
  if (norm.includes('ba') || norm.includes('t3') || norm === '3' || norm.includes('tue')) return '3';
  if (norm.includes('tu') || norm.includes('t4') || norm === '4' || norm.includes('wed')) return '4';
  if (norm.includes('nam') || norm.includes('t5') || norm === '5' || norm.includes('thu')) return '5';
  if (norm.includes('sau') || norm.includes('t6') || norm === '6' || norm.includes('fri')) return '6';
  if (norm.includes('bay') || norm.includes('t7') || norm === '7' || norm.includes('sat')) return '7';
  if (norm.includes('nhat') || norm.includes('cn') || norm === 'cn' || norm === '8' || norm.includes('sun')) return '8';

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = d.getDay();
      return day === 0 ? "8" : String(day + 1);
    }
  }

  const ddmmyyyyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const d = parseInt(ddmmyyyyMatch[1]);
    const m = parseInt(ddmmyyyyMatch[2]);
    const y = parseInt(ddmmyyyyMatch[3]);
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) {
      const day = dt.getDay();
      return day === 0 ? "8" : String(day + 1);
    }
  }

  return null;
};

const resolveMealFromExcelRow = (val: any): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
  if (!val) return 'lunch';
  const norm = String(val).trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (norm.includes('sang') || norm.includes('breakfast') || norm === 'sáng') return 'breakfast';
  if (norm.includes('trua') || norm.includes('lunch') || norm === 'trưa') return 'lunch';
  if (norm.includes('toi') || norm.includes('dinner') || norm === 'tối') return 'dinner';
  if (norm.includes('phu') || norm.includes('snack') || norm.includes('vat') || norm === 'phụ') return 'snack';
  
  return 'lunch';
};

// Helper to get Monday's YYYY-MM-DD date string of a given Date
const getMondayOfDate = (d: Date): string => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, ...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const dateVal = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${dateVal}`;
};

export const FoodDiaryTable: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { foodEntries, addFoodEntry, deleteFoodEntry } = useFoodStore();
  const { hideAmounts } = useFinanceStore();

  // State for checkbox selection (across the entire week)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // State for Accordion collapsible days (indexes 0 to 6 representing Mon-Sun)
  // Expand today's day of the week by default
  const [expandedIndices, setExpandedIndices] = useState<number[]>(() => {
    const todayIndex = (new Date().getDay() + 6) % 7;
    return [todayIndex];
  });

  // State for Add Meal Modal
  const [isOpen, setIsOpen] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [targetDayLabel, setTargetDayLabel] = useState('');
  const [meal, setMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [foodName, setFoodName] = useState('');
  const [grams, setGrams] = useState('150');
  const [price, setPrice] = useState('');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = () => {
    setIsRefreshing(true);
    const unsub = useFoodStore.getState().initListeners();
    setTimeout(() => {
      unsub();
      setIsRefreshing(false);
    }, 800);
  };

  const handleDownloadSampleExcel = () => {
    try {
      const data = [
        {
          'Thứ / Ngày': 'Thứ Hai',
          'Bữa ăn': 'Bữa Sáng',
          'Tên thực phẩm': 'Ức gà áp chảo',
          'Định lượng (g)': 150,
          'Giá tiền (đ)': 25000
        },
        {
          'Thứ / Ngày': 'Thứ Hai',
          'Bữa ăn': 'Bữa Trưa',
          'Tên thực phẩm': 'Cơm trắng',
          'Định lượng (g)': 200,
          'Giá tiền (đ)': 5000
        },
        {
          'Thứ / Ngày': 'Thứ Hai',
          'Bữa ăn': 'Bữa Trưa',
          'Tên thực phẩm': 'Cá hồi nướng',
          'Định lượng (g)': 150,
          'Giá tiền (đ)': 45000
        },
        {
          'Thứ / Ngày': 'Thứ Ba',
          'Bữa ăn': 'Bữa Tối',
          'Tên thực phẩm': 'Bò xào bông cải',
          'Định lượng (g)': 150,
          'Giá tiền (đ)': 35000
        },
        {
          'Thứ / Ngày': 'Thứ Tư',
          'Bữa ăn': 'Bữa Phụ',
          'Tên thực phẩm': 'Chuối tiêu',
          'Định lượng (g)': 120,
          'Giá tiền (đ)': 6000
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(data);
      worksheet['!cols'] = [
        { wch: 15 }, // Thứ / Ngày
        { wch: 15 }, // Bữa ăn
        { wch: 25 }, // Tên thực phẩm
        { wch: 15 }, // Định lượng (g)
        { wch: 15 }  // Giá tiền (đ)
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Thực Đơn');
      XLSX.writeFile(workbook, `mau_thuc_don_tuan.xlsx`);
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể tạo và tải file mẫu.',
        icon: 'error'
      });
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetName = workbook.SheetNames.find(name => name.includes("Thực Đơn") || name.toLowerCase().includes("food") || name.toLowerCase().includes("menu") || name.toLowerCase().includes("meal")) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        if (jsonData.length === 0) {
          Swal.fire({
            title: 'Lỗi',
            text: 'File Excel không có dữ liệu.',
            icon: 'error'
          });
          return;
        }

        let importedCount = 0;

        jsonData.forEach((row) => {
          const dateRaw = row['Thứ / Ngày'] || row['Thứ/Ngày'] || row['Ngày'] || row['Date'] || row['Day'] || row['Thứ'];
          const date = resolveDateFromExcelRow(dateRaw);
          if (!date) return;

          const mealRaw = row['Bữa ăn'] || row['Bữa Ăn'] || row['Meal'] || row['Bữa'];
          const meal = resolveMealFromExcelRow(mealRaw);

          const foodNameRaw = row['Tên thực phẩm'] || row['Tên món'] || row['Food Name'] || row['Name'] || row['Món ăn'] || row['Thực phẩm'];
          if (!foodNameRaw) return;
          const foodName = String(foodNameRaw).trim();

          const gramsRaw = row['Định lượng (g)'] || row['Định lượng'] || row['Grams'] || row['Weight'] || row['Khối lượng'] || row['gram'];
          const grams = typeof gramsRaw === 'number' ? gramsRaw : parseInt(String(gramsRaw).replace(/[^\d]/g, ''), 10) || 150;

          const priceRaw = row['Giá tiền (đ)'] || row['Giá tiền'] || row['Giá'] || row['Price'] || row['Cost'] || row['Giá tiền (đ)'];
          const price = typeof priceRaw === 'number' ? priceRaw : parseInt(String(priceRaw).replace(/[^\d]/g, ''), 10) || 0;

          const macros = estimateMacros(foodName, grams);

          addFoodEntry({
            meal,
            name: `${grams}g ${foodName}`,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
            calories: macros.calories,
            price,
            date
          });
          importedCount++;
        });

        Swal.fire({
          title: 'Nhập Excel thành công!',
          text: `Đã thêm mới thành công ${importedCount} món ăn vào thực đơn tuần này.`,
          icon: 'success',
          confirmButtonColor: 'var(--primary)',
        });
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: 'Lỗi',
          text: 'Đã xảy ra lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng.',
          icon: 'error'
        });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const todayDayStr = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? '8' : String(day + 1);
  }, []);

  // Calculate the 7 days array of the static week
  const daysOfWeek = useMemo(() => {
    const isVi = i18n.language.startsWith('vi');
    const dayNamesVi = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    const dayNamesEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortNamesVi = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const shortNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const dayNames = isVi ? dayNamesVi : dayNamesEn;
    const shortNames = isVi ? shortNamesVi : shortNamesEn;
    
    return Array.from({ length: 7 }, (_, i) => ({
      dateStr: String(i + 2), // '2' to '8'
      dayName: dayNames[i],
      shortDate: shortNames[i]
    }));
  }, [i18n.language]);

  // Toggle accordion cards
  const handleToggleDay = (index: number) => {
    setExpandedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleAllDays = () => {
    if (expandedIndices.length === 7) {
      setExpandedIndices([]);
    } else {
      setExpandedIndices([0, 1, 2, 3, 4, 5, 6]);
    }
  };

  // Selection toggles
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Deletions
  const handleDeleteFood = (id: string, name: string) => {
    confirmDelete(
      'Xóa món ăn khỏi thực đơn?',
      `Bạn có chắc chắn muốn xóa "${name}" khỏi thực đơn không?`,
      () => {
        deleteFoodEntry(id);
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    confirmDelete(
      'Xóa các món ăn đã chọn?',
      `Bạn có chắc chắn muốn xóa ${selectedIds.length} món ăn đã chọn không?`,
      () => {
        selectedIds.forEach(id => deleteFoodEntry(id));
        setSelectedIds([]);
      }
    );
  };

  // Modal actions
  const handleOpenAddModal = (dateStr: string, dayLabel: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop click from bubbling and toggling accordion card
    setTargetDate(dateStr);
    setTargetDayLabel(dayLabel);
    setFoodName('');
    setGrams('150');
    setPrice('');
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || !grams) return;

    const parsedGrams = parseInt(grams);
    const parsedPrice = parseInt(price) || 0;

    const macros = estimateMacros(foodName, parsedGrams);

    addFoodEntry({
      meal,
      name: `${parsedGrams}g ${foodName}`,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      calories: macros.calories,
      price: parsedPrice,
      date: targetDate
    });

    // Reset Form & Close
    setFoodName('');
    setGrams('150');
    setPrice('');
    setIsOpen(false);
  };

  const mealOptions = [
    { value: 'breakfast', label: t('food.meals.breakfast') },
    { value: 'lunch', label: t('food.meals.lunch') },
    { value: 'dinner', label: t('food.meals.dinner') },
    { value: 'snack', label: t('food.meals.snack') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Week Navigation & Selector Bar */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '16px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={20} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            {t('food.title')}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Trash2 size={16} />
              Xóa đã chọn ({selectedIds.length})
            </button>
          )}

          <button
            onClick={toggleAllDays}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', border: '1.5px solid var(--slate-300)' }}
          >
            {expandedIndices.length === 7 ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
          </button>

          <button
            type="button"
            onClick={handleDownloadSampleExcel}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1.5px solid var(--slate-300)' }}
            title="Tải file Excel mẫu thực đơn"
          >
            <Download size={16} />
            Tải file mẫu
          </button>

          <label
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1.5px solid var(--slate-300)' }}
            title="Nhập thực đơn từ file Excel"
          >
            <Upload size={16} />
            Nhập Excel
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
              style={{ display: 'none' }}
            />
          </label>

          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1.5px solid var(--slate-300)' }}
            title="Làm mới dữ liệu"
          >
            <RotateCw size={16} className={isRefreshing ? 'spin-animation' : ''} style={{ color: 'var(--slate-600)' }} />
          </button>
        </div>
      </div>

      {/* 2. Weekly Totals & Averages Dashboard */}
      <MacrosDashboard />

      {/* 3. Collapsible Accordion List of Days */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {daysOfWeek.map((day, idx) => {
          const isToday = day.dateStr === todayDayStr;
          const isExpanded = expandedIndices.includes(idx);
          const dayEntries = foodEntries.filter(e => e.date === day.dateStr);
          
          const dayTotals = dayEntries.reduce(
            (acc, e) => {
              acc.calories += e.calories;
              acc.protein += e.protein;
              acc.carbs += e.carbs;
              acc.fat += e.fat;
              acc.cost += e.price;
              return acc;
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 }
          );

          return (
            <div 
              key={day.dateStr}
              className="glass-card" 
              style={{ 
                padding: '0', 
                overflow: 'hidden', 
                border: isToday ? '2.5px solid var(--primary)' : '1.5px solid var(--border-light)',
                boxShadow: isToday ? '0 4px 20px rgba(124, 58, 237, 0.15)' : 'var(--shadow-sm)'
              }}
            >
              {/* Accordion Header */}
              <div 
                onClick={() => handleToggleDay(idx)}
                style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  backgroundColor: isToday ? 'rgba(124, 58, 237, 0.02)' : '#ffffff',
                  userSelect: 'none',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isToday && (
                      <span 
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--primary)',
                          display: 'inline-block' 
                        }} 
                      />
                    )}
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: isToday ? 'var(--primary)' : 'var(--slate-800)' }}>
                      {day.dayName}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--slate-400)', fontWeight: 500 }}>
                      ({day.shortDate})
                    </span>
                    {isToday && (
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: 'var(--primary-light)', 
                          color: 'var(--primary)', 
                          fontSize: '0.7rem', 
                          padding: '2px 6px',
                          border: 'none',
                          fontWeight: 600
                        }}
                      >
                        Hôm nay
                      </span>
                    )}
                  </div>

                  {/* Daily summary values */}
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.825rem', color: 'var(--slate-500)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ borderLeft: '1.5px solid var(--slate-200)', height: '12px', display: 'inline-block', margin: '0 4px' }} />
                    <span style={{ fontWeight: 600, color: 'var(--amber)' }}>
                      {Math.round(dayTotals.calories)} kcal
                    </span>
                    <span style={{ color: 'var(--slate-300)' }}>|</span>
                    <span>P: <strong style={{ color: 'var(--primary)' }}>{Math.round(dayTotals.protein)}g</strong></span>
                    <span style={{ color: 'var(--slate-300)' }}>|</span>
                    <span>C: <strong style={{ color: '#2563eb' }}>{Math.round(dayTotals.carbs)}g</strong></span>
                    <span style={{ color: 'var(--slate-300)' }}>|</span>
                    <span>F: <strong style={{ color: '#ca8a04' }}>{Math.round(dayTotals.fat)}g</strong></span>
                    {dayTotals.cost > 0 && (
                      <>
                        <span style={{ color: 'var(--slate-300)' }}>|</span>
                        <span style={{ fontWeight: 650, color: 'var(--success)' }}>
                          {formatCurrency(dayTotals.cost)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={(e) => handleOpenAddModal(day.dateStr, `${day.dayName} (${day.shortDate})`, e)}
                    className="btn btn-primary"
                    style={{ 
                      padding: '4px 12px', 
                      fontSize: '0.75rem', 
                      borderRadius: '6px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={12} />
                    Thêm món
                  </button>
                  <div style={{ color: 'var(--slate-400)', display: 'flex', alignItems: 'center' }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid var(--border-light)' }}>
                  <div className="modern-table-container" style={{ marginTop: '16px' }}>
                    <table className="modern-table table-w-lg">
                      <thead>
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={dayEntries.length > 0 && dayEntries.every(e => selectedIds.includes(e.id))}
                              onChange={(e) => {
                                const dayIds = dayEntries.map(ent => ent.id);
                                if (e.target.checked) {
                                  setSelectedIds(prev => Array.from(new Set([...prev, ...dayIds])));
                                } else {
                                  setSelectedIds(prev => prev.filter(id => !dayIds.includes(id)));
                                }
                              }}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          </th>
                          <th style={{ width: '110px' }}>{t('food.meal')}</th>
                          <th>{t('food.food_name')}</th>
                          <th style={{ width: '170px' }}>{t('food.macros_nap')}</th>
                          <th style={{ width: '90px', textAlign: 'right' }}>{t('food.cal')}</th>
                          <th style={{ width: '110px', textAlign: 'right' }}>{t('food.price')}</th>
                          <th style={{ width: '90px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayEntries.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '20px', fontSize: '0.85rem' }}>
                              Chưa có thực đơn nào được lên lịch cho ngày này. Click "Thêm món" ở trên!
                            </td>
                          </tr>
                        ) : (
                          dayEntries.map((e) => (
                            <tr key={e.id}>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(e.id)}
                                  onChange={() => handleToggleSelect(e.id)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                              </td>
                              <td>
                                <span className="badge badge-meal">
                                  {t(`food.meals.${e.meal}`)}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{e.name}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                                  <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px' }}>
                                    P: {e.protein}g
                                  </span>
                                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', color: '#2563eb', padding: '2px 6px', borderRadius: '4px' }}>
                                    C: {e.carbs}g
                                  </span>
                                  <span style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)', color: '#ca8a04', padding: '2px 6px', borderRadius: '4px' }}>
                                    F: {e.fat}g
                                  </span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--amber)' }} className="tabular-nums">
                                {e.calories} kcal
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }} className="tabular-nums">
                                {formatCurrency(e.price)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  onClick={() => handleDeleteFood(e.id, e.name)}
                                  className="btn-icon"
                                  title="Xóa món ăn"
                                  style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.15)', width: '28px', height: '28px' }}
                                  onMouseEnter={(el) => {
                                    el.currentTarget.style.backgroundColor = 'var(--error-light)';
                                  }}
                                  onMouseLeave={(el) => {
                                    el.currentTarget.style.backgroundColor = '#ffffff';
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual Input Dialog / Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(2, 6, 23, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '90%',
              maxWidth: '450px',
              padding: '24px',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-main)' }}>
              Lên thực đơn: {targetDayLabel}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Meal Select */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)', display: 'block', marginBottom: '6px' }}>
                  {t('food.meal')}
                </label>
                <select
                  value={meal}
                  onChange={(e) => setMeal(e.target.value as any)}
                  className="form-input"
                  style={{ appearance: 'auto' }}
                >
                  {mealOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Food Name */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)', display: 'block', marginBottom: '6px' }}>
                  {t('food.food_name')}
                </label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="Ví dụ: Phi-lê cá basa nướng, Ức gà áp chảo..."
                  className="form-input"
                  required
                />
              </div>

              {/* Grams weight */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)', display: 'block', marginBottom: '6px' }}>
                  Định lượng (gram)
                </label>
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  placeholder="150"
                  className="form-input"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)', display: 'block', marginBottom: '6px' }}>
                  Giá tiền (nếu mua bên ngoài)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ví dụ: 15000"
                  className="form-input"
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
