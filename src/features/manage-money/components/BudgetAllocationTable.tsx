import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Pencil, Check, X, RotateCw, Copy, RefreshCw, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { useMonthStore } from '../../../store/useMonthStore';
import { formatCurrency } from '../../../utils/formatCurrency';
import { confirmDelete } from '../../../utils/confirm';


const formatNumberInput = (value: string): string => {
  const clean = value.replace(/[^\d]/g, '');
  if (!clean) return '';
  const num = parseInt(clean, 10);
  if (isNaN(num)) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const BudgetAllocationTable: React.FC = () => {
  const { t } = useTranslation();
  const { selectedMonth } = useMonthStore();
  const { 
    budgets, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transactions, // Destructure transactions to fix reactive spent/remaining updates
    getSpentByCategory, 
    updateBudgetLimit, 
    addBudgetCategory, 
    deleteBudgetCategory,
    updateBudgetCategoryName,
    copyBudgetsFromMonth,
    initializeDefaultBudgets,
    hideAmounts
  } = useFinanceStore();

  // State for checkbox selection
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const filteredBudgets = React.useMemo(() => {
    if (selectedMonth === 'all') return budgets;
    return budgets.filter(b => b.month === selectedMonth);
  }, [budgets, selectedMonth]);

  const totalLimit = filteredBudgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + getSpentByCategory(b.category), 0);
  const totalRemaining = totalLimit - totalSpent;

  // State sửa hạn mức
  const [editingLimitCategory, setEditingLimitCategory] = useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<string>('');

  // State sửa tên hạng mục
  const [editingNameCategory, setEditingNameCategory] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');

  // State sửa cả dòng (Row editing)
  const [editingRowCategory, setEditingRowCategory] = useState<string | null>(null);

  // State thêm hạng mục mới
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = () => {
    setIsRefreshing(true);
    const unsub = useFinanceStore.getState().initListeners();
    setTimeout(() => {
      unsub();
      setIsRefreshing(false);
    }, 800);
  };

  // Reset selection when month changes in render phase
  const [prevMonth, setPrevMonth] = useState(selectedMonth);
  if (selectedMonth !== prevMonth) {
    setPrevMonth(selectedMonth);
    setSelectedCategories([]);
  }

  const handleLimitDoubleClick = (category: string, currentLimit: number) => {
    setEditingLimitCategory(category);
    setEditLimitValue(formatNumberInput(currentLimit.toString()));
  };

  const handleLimitSave = (category: string) => {
    const val = parseInt(editLimitValue.replace(/[^\d]/g, ''));
    if (!isNaN(val) && val >= 0) {
      updateBudgetLimit(category, val, selectedMonth !== 'all' ? selectedMonth : undefined);
    }
    setEditingLimitCategory(null);
  };

  const handleNameDoubleClick = (category: string) => {
    setEditingNameCategory(category);
    setEditNameValue(category);
  };

  const handleNameSave = (oldCategory: string) => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed.toLowerCase() !== oldCategory.toLowerCase()) {
      updateBudgetCategoryName(oldCategory, trimmed, selectedMonth !== 'all' ? selectedMonth : undefined);
    }
    setEditingNameCategory(null);
  };

  const handleRowEditStart = (category: string, limit: number) => {
    setEditingRowCategory(category);
    setEditNameValue(category);
    setEditLimitValue(formatNumberInput(limit.toString()));
  };

  const handleRowSave = (oldCategory: string) => {
    const trimmedName = editNameValue.trim();
    const newLimit = parseInt(editLimitValue.replace(/[^\d]/g, '')) || 0;
    const m = selectedMonth !== 'all' ? selectedMonth : undefined;

    if (trimmedName && trimmedName.toLowerCase() !== oldCategory.toLowerCase()) {
      updateBudgetCategoryName(oldCategory, trimmedName, m);
      updateBudgetLimit(trimmedName, newLimit, m);
    } else {
      updateBudgetLimit(oldCategory, newLimit, m);
    }
    setEditingRowCategory(null);
  };

  const handleRowCancel = () => {
    setEditingRowCategory(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    const limit = parseInt(newCatLimit.replace(/[^\d]/g, ''), 10) || 0;
    if (!name) return;

    addBudgetCategory(name, limit, selectedMonth !== 'all' ? selectedMonth : undefined);
    setNewCatName('');
    setNewCatLimit('');
    setIsAdding(false);
  };

  const handleCopyRecentMonth = () => {
    const monthsWithBudgets = Array.from(new Set(budgets.map(b => b.month).filter(Boolean))) as string[];
    if (monthsWithBudgets.length === 0) {
      initializeDefaultBudgets(selectedMonth);
      return;
    }
    monthsWithBudgets.sort((a, b) => b.localeCompare(a));
    const sourceMonth = monthsWithBudgets[0];
    copyBudgetsFromMonth(sourceMonth, selectedMonth);
  };

  const handleDeleteCategory = (category: string) => {
    confirmDelete(
      'Xóa hạng mục ngân sách?',
      `Bạn có chắc chắn muốn xóa hạng mục "${category}"? Mọi chi tiêu trong hạng mục này của tháng này sẽ được chuyển sang hạng mục "Khác".`,
      () => {
        deleteBudgetCategory(category, selectedMonth !== 'all' ? selectedMonth : undefined);
        setSelectedCategories(prev => prev.filter(item => item !== category));
      }
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCategories(filteredBudgets.map(b => b.category));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleToggleSelect = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(item => item !== category) : [...prev, category]
    );
  };

  const handleBulkDelete = () => {
    if (selectedCategories.length === 0) return;
    confirmDelete(
      'Xóa các hạng mục đã chọn?',
      `Bạn có chắc chắn muốn xóa ${selectedCategories.length} hạng mục ngân sách đã chọn không? Các chi tiêu liên quan sẽ được chuyển sang hạng mục "Khác".`,
      () => {
        selectedCategories.forEach(category => 
          deleteBudgetCategory(category, selectedMonth !== 'all' ? selectedMonth : undefined)
        );
        setSelectedCategories([]);
      }
    );
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetName = workbook.SheetNames.find(name => name.includes("Ngân Sách") || name.toLowerCase().includes("budget")) || workbook.SheetNames[0];
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
        let updatedCount = 0;

        jsonData.forEach((row) => {
          const category = row['Hạng mục'] || row['Category'] || row['Hạng Mục'] || row['category'];
          const limitRaw = row['Hạn mức ngân sách (đ)'] || row['Limit'] || row['Hạn mức'] || row['limit'] || row['Hạn Mức'];

          if (!category) return;

          const limit = typeof limitRaw === 'number'
            ? limitRaw
            : parseInt(String(limitRaw).replace(/[^\d]/g, ''), 10) || 0;

          const m = selectedMonth !== 'all' ? selectedMonth : undefined;

          const exists = filteredBudgets.find(b => b.category.toLowerCase() === String(category).trim().toLowerCase());
          if (exists) {
            updateBudgetLimit(exists.category, limit, m);
            updatedCount++;
          } else {
            addBudgetCategory(String(category).trim(), limit, m);
            importedCount++;
          }
        });

        Swal.fire({
          title: 'Nhập Excel thành công!',
          text: `Đã thêm mới ${importedCount} và cập nhật ${updatedCount} hạng mục ngân sách cho tháng này.`,
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

  const handleDownloadSampleExcel = () => {
    try {
      // Dữ liệu mẫu khớp với cấu trúc cột được hỗ trợ trong code
      const data = [
        {
          'Hạng mục': 'Ăn uống sinh hoạt',
          'Hạn mức': 5000000
        },
        {
          'Hạng mục': 'Thể hình (Gym/Supps)',
          'Hạn mức': 1500000
        },
        {
          'Hạng mục': 'Chi phí cố định',
          'Hạn mức': 4000000
        },
        {
          'Hạng mục': 'Học tập/Công việc',
          'Hạn mức': 1000000
        },
        {
          'Hạng mục': 'Du lịch/Giải trí',
          'Hạn mức': 2000000
        }
      ];

      // Tạo worksheet từ JSON
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Định dạng độ rộng cột tự động
      worksheet['!cols'] = [
        { wch: 25 }, // Hạng mục
        { wch: 15 }  // Hạn mức
      ];

      // Tạo workbook và thêm worksheet vào
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ngân Sách');

      // Tải file xuống
      XLSX.writeFile(workbook, `mau_ngan_sach_${selectedMonth !== 'all' ? selectedMonth : 'template'}.xlsx`);
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể tạo và tải file mẫu.',
        icon: 'error'
      });
    }
  };

  const defaultCategories = ['Ăn uống sinh hoạt', 'Thể hình (Gym/Supps)', 'Chi phí cố định', 'Học tập/Công việc'];

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {t('finance.budget_allocation')}
            {selectedMonth !== 'all' && (
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-400)', marginLeft: '8px' }}>
                ({selectedMonth})
              </span>
            )}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {selectedCategories.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Trash2 size={16} />
              Xóa đã chọn ({selectedCategories.length})
            </button>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1.5px solid var(--slate-300)' }}
            title="Làm mới dữ liệu"
          >
            <RotateCw size={16} className={isRefreshing ? 'spin-animation' : ''} style={{ color: 'var(--slate-600)' }} />
          </button>
          {selectedMonth !== 'all' && (
            <>
              <button
                type="button"
                onClick={handleDownloadSampleExcel}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1.5px solid var(--slate-300)' }}
                title="Tải file Excel mẫu"
              >
                <Download size={16} />
                Tải file mẫu
              </button>
              <label
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1.5px solid var(--slate-300)' }}
                title="Nhập hạn mức từ file Excel"
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
            </>
          )}
          {!isAdding && selectedMonth !== 'all' && (
            <button
              onClick={() => setIsAdding(true)}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              Thêm
            </button>
          )}
        </div>
      </div>


      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ 
          flex: 1, 
          padding: '16px', 
          backgroundColor: 'var(--slate-50)', 
          borderRadius: '12px', 
          border: '1px solid var(--slate-100)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tổng ngân sách
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--slate-800)' }} className="tabular-nums">
            {formatCurrency(totalLimit)}
          </span>
        </div>
        <div style={{ 
          flex: 1, 
          padding: '16px', 
          backgroundColor: 'var(--slate-50)', 
          borderRadius: '12px', 
          border: '1px solid var(--slate-100)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tổng còn lại
          </span>
          <span 
            style={{ 
              fontSize: '1.4rem', 
              fontWeight: 700, 
              color: totalRemaining < 0 ? 'var(--error)' : 'var(--success)' 
            }} 
            className="tabular-nums"
          >
            {formatCurrency(totalRemaining)}
          </span>
        </div>
      </div>

      <div className="modern-table-container">
        <table className="modern-table table-w-md">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  disabled={filteredBudgets.length === 0}
                  checked={filteredBudgets.length > 0 && selectedCategories.length === filteredBudgets.length}
                  onChange={handleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </th>
              <th style={{ width: '180px' }}>{t('finance.category')}</th>
              <th style={{ width: '140px', textAlign: 'right' }}>{t('finance.budget_limit')}</th>
              <th style={{ width: '120px', textAlign: 'right' }}>{t('finance.spent')}</th>
              <th style={{ width: '120px', textAlign: 'right' }}>{t('finance.remaining')}</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredBudgets.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--slate-400)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--slate-400)' }}>
                      Chưa thiết lập ngân sách tháng này. Ví dụ: Ăn uống sinh hoạt (5.000.000đ), Cố định (4.000.000đ)... Nhấp "Thêm" để bắt đầu!
                    </span>
                    {selectedMonth !== 'all' && (
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.825rem', marginTop: '4px', alignItems: 'center' }}>
                        <button
                          onClick={handleCopyRecentMonth}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
                        >
                          <Copy size={12} />
                          Sao chép từ tháng trước
                        </button>
                        <button
                          onClick={() => initializeDefaultBudgets(selectedMonth)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
                        >
                          <RefreshCw size={12} />
                          Khởi tạo mặc định
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredBudgets.map((b) => {
                const spent = getSpentByCategory(b.category);
                const remaining = b.limit - spent;
                const isOverBudget = remaining < 0;
                const percent = b.limit > 0 ? Math.min((spent / b.limit) * 100, 100) : 0;
                
                // Biên dịch tên hạng mục mặc định
                let translateKey = '';
                if (b.category === 'Ăn uống sinh hoạt') translateKey = 'finance.categories.food';
                if (b.category === 'Thể hình (Gym/Supps)') translateKey = 'finance.categories.gym';
                if (b.category === 'Chi phí cố định') translateKey = 'finance.categories.fixed';
                if (b.category === 'Học tập/Công việc') translateKey = 'finance.categories.study';

                const isDefault = defaultCategories.includes(b.category) && translateKey !== '';
                const displayName = isDefault ? t(translateKey) : b.category;

                return (
                  <React.Fragment key={b.category}>
                    <tr>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(b.category)}
                          onChange={() => handleToggleSelect(b.category)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>
                      {/* Tên Hạng Mục (Có thể đúp click sửa) */}
                      <td style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                        {editingRowCategory === b.category ? (
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRowSave(b.category)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1.5px solid var(--primary)',
                              fontSize: '0.9rem',
                              outline: 'none',
                              width: '100%',
                            }}
                          />
                        ) : editingNameCategory === b.category ? (
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onBlur={() => handleNameSave(b.category)}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameSave(b.category)}
                            autoFocus
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--primary)',
                              fontSize: '0.9rem',
                              outline: 'none',
                            }}
                          />
                        ) : (
                          <span
                            onDoubleClick={() => handleNameDoubleClick(b.category)}
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px dashed var(--slate-300)',
                              paddingBottom: '2px',
                            }}
                            title="Click đúp để sửa tên hạng mục"
                          >
                            {displayName}
                          </span>
                        )}
                      </td>

                      {/* Ngân sách (Có thể đúp click sửa) */}
                      <td style={{ textAlign: 'right', fontWeight: 500 }} className="tabular-nums">
                        {editingRowCategory === b.category ? (
                          <input
                            type="text"
                            value={editLimitValue}
                            onChange={(e) => setEditLimitValue(formatNumberInput(e.target.value))}
                            onKeyDown={(e) => e.key === 'Enter' && handleRowSave(b.category)}
                            style={{
                              width: '120px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1.5px solid var(--primary)',
                              textAlign: 'right',
                              fontSize: '0.9rem',
                              outline: 'none',
                            }}
                          />
                        ) : editingLimitCategory === b.category ? (
                          <input
                            type="text"
                            value={editLimitValue}
                            onChange={(e) => setEditLimitValue(formatNumberInput(e.target.value))}
                            onBlur={() => handleLimitSave(b.category)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLimitSave(b.category)}
                            autoFocus
                            style={{
                              width: '120px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--primary)',
                              textAlign: 'right',
                              fontSize: '0.9rem',
                              outline: 'none',
                            }}
                          />
                        ) : (
                          <span
                            onDoubleClick={() => handleLimitDoubleClick(b.category, b.limit)}
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px dashed var(--slate-300)',
                              paddingBottom: '2px',
                            }}
                            title="Click đúp để sửa hạn mức"
                          >
                            {formatCurrency(b.limit)}
                          </span>
                        )}
                      </td>

                      {/* Đã chi */}
                      <td style={{ textAlign: 'right', color: 'var(--slate-500)' }} className="tabular-nums">
                        {formatCurrency(spent)}
                      </td>

                      {/* Còn lại */}
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 600,
                          color: isOverBudget ? 'var(--error)' : 'var(--success)',
                          textShadow: isOverBudget ? '0 0 8px rgba(239, 68, 68, 0.2)' : 'none',
                        }}
                        className="tabular-nums"
                      >
                        {formatCurrency(remaining)}
                      </td>

                      {/* Thao tác (Xóa - icon màu đỏ) */}
                      <td style={{ textAlign: 'center' }}>
                        {editingRowCategory === b.category ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleRowSave(b.category)}
                              className="btn-icon"
                              title="Lưu"
                              style={{ width: '28px', height: '28px', color: 'var(--success)' }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={handleRowCancel}
                              className="btn-icon"
                              title="Hủy"
                              style={{ width: '28px', height: '28px', color: 'var(--error)' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleRowEditStart(b.category, b.limit)}
                              className="btn-icon"
                              title="Sửa hạng mục"
                              style={{ width: '28px', height: '28px', color: 'var(--primary)', borderColor: 'var(--slate-200)' }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(b.category)}
                              className="btn-icon"
                              title="Xóa hạng mục"
                              style={{ width: '28px', height: '28px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.15)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--error-light)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Thanh tiến trình */}
                    <tr>
                      <td colSpan={6} style={{ padding: '0 16px 14px 16px', borderBottom: '1px solid var(--slate-100)' }}>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: 'var(--slate-100)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${percent}%`,
                              borderRadius: '3px',
                              background: isOverBudget
                                ? 'var(--error)'
                                : 'linear-gradient(90deg, var(--primary-accent) 0%, var(--primary) 100%)',
                              boxShadow: isOverBudget 
                                ? '0 0 8px var(--error)'
                                : 'none',
                              transition: 'width 0.3s ease-in-out',
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              }))}


              {/* Dòng thêm mới hạng mục */}
              {isAdding && (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', backgroundColor: 'var(--slate-50)' }}>
                    <form 
                      onSubmit={handleAddSubmit} 
                      style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        alignItems: 'flex-end', 
                        flexWrap: 'wrap' 
                      }}
                    >
                      {/* Hạng mục */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 2, minWidth: '180px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-500)' }}>
                          Tên hạng mục
                        </label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Du lịch, Mua sắm..."
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          required
                          className="form-input"
                          style={{ padding: '8px 12px' }}
                          autoFocus
                        />
                      </div>
                      {/* Hạn mức */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '120px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-500)' }}>
                          Hạn mức ngân sách (đ)
                        </label>
                        <input
                          type="text"
                          placeholder="500.000"
                          value={newCatLimit}
                          onChange={(e) => setNewCatLimit(formatNumberInput(e.target.value))}
                          required
                          className="form-input"
                          style={{ padding: '8px 12px' }}
                        />
                      </div>
                      {/* Thao tác */}
                      <div style={{ display: 'flex', gap: '8px', paddingBottom: '2px' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAdding(false)}
                          className="btn btn-secondary"
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, backgroundColor: 'var(--slate-50)', borderTop: '2px solid var(--slate-200)' }}>
                <td></td>
                <td style={{ color: 'var(--slate-800)', fontWeight: 700 }}>Tổng cộng</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                  {formatCurrency(totalLimit)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--slate-500)' }} className="tabular-nums">
                  {formatCurrency(totalSpent)}
                </td>
                <td 
                  style={{ 
                    textAlign: 'right', 
                    fontWeight: 700, 
                    color: totalRemaining < 0 ? 'var(--error)' : 'var(--success)' 
                  }} 
                  className="tabular-nums"
                >
                  {formatCurrency(totalRemaining)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
    </div>
  );
};


