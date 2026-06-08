import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, RotateCw, Pencil, Check, X } from 'lucide-react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { useMonthStore } from '../../../store/useMonthStore';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDateTime } from '../../../utils/formatDate';
import { confirmDelete } from '../../../utils/confirm';

const formatNumberInput = (value: string): string => {
  const clean = value.replace(/[^\d]/g, '');
  if (!clean) return '';
  const num = parseInt(clean, 10);
  if (isNaN(num)) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const TransactionLogsTable: React.FC = () => {
  const { t } = useTranslation();
  const { transactions, budgets, addTransaction, deleteTransaction, hideAmounts } = useFinanceStore();
  const { selectedMonth } = useMonthStore();

  const getCategoryDisplayName = (category: string) => {
    if (category === 'Ăn uống sinh hoạt') return t('finance.categories.food');
    if (category === 'Thể hình (Gym/Supps)') return t('finance.categories.gym');
    if (category === 'Chi phí cố định') return t('finance.categories.fixed');
    if (category === 'Học tập/Công việc') return t('finance.categories.study');
    return category;
  };
  
  // State for checkbox selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // State sửa giao dịch
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleEditStart = (tx: any) => {
    setEditingId(tx.id);
    setEditDate(tx.date.substring(0, 16)); // Định dạng YYYY-MM-DDTHH:MM cho datetime-local
    setEditType(tx.type);
    setEditAmount(formatNumberInput(tx.amount.toString()));
    setEditCategory(tx.category);
    setEditNotes(tx.notes);
  };

  const handleEditSave = (id: string) => {
    const amountVal = parseInt(editAmount.replace(/[^\d]/g, ''));
    if (!amountVal || isNaN(amountVal)) return;

    let finalISO = new Date().toISOString();
    try {
      finalISO = new Date(editDate).toISOString();
    } catch (e) {
      console.error(e);
    }

    useFinanceStore.getState().updateTransaction(id, {
      date: finalISO,
      type: editType,
      amount: amountVal,
      category: editType === 'expense' ? editCategory : 'Thu nhập khác',
      notes: editNotes.trim(),
    });
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  // State for Add Transaction modal
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(budgets[0]?.category || 'Ăn uống sinh hoạt');
  const [notes, setNotes] = useState('');
  const [dateVal, setDateVal] = useState('');

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
    setSelectedIds([]);
  }

  // Mở modal và thiết lập giá trị ban đầu cho form
  const handleOpenModal = () => {
    if (budgets.length > 0) {
      setCategory(budgets[0].category);
    } else {
      setCategory('Ăn uống sinh hoạt');
    }
    
    const today = new Date();
    const nowMonthStr = today.toISOString().substring(0, 7);
    if (selectedMonth !== 'all' && selectedMonth !== nowMonthStr) {
      setDateVal(`${selectedMonth}-01`);
    } else {
      setDateVal(today.toISOString().split('T')[0]);
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount.replace(/[^\d]/g, ''));
    if (!parsedAmount || isNaN(parsedAmount)) return;

    // Kết hợp ngày chọn và giờ hiện tại
    const nowTimeStr = new Date().toTimeString().split(' ')[0];
    const fullDateISO = new Date(`${dateVal}T${nowTimeStr}`).toISOString();

    addTransaction({
      date: fullDateISO,
      type,
      amount: parsedAmount,
      category: type === 'expense' ? category : 'Thu nhập khác',
      notes,
    });

    // Reset form
    setAmount('');
    setNotes('');
    setIsOpen(false);
  };

  const handleDeleteTransaction = (id: string, notes: string) => {
    confirmDelete(
      'Xóa nhật ký giao dịch?',
      `Bạn có chắc chắn muốn xóa giao dịch "${notes || 'Chưa ghi chú'}" không?`,
      () => {
        deleteTransaction(id);
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    );
  };

  const filteredTransactions = React.useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredTransactions.map(tx => tx.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    confirmDelete(
      'Xóa các giao dịch đã chọn?',
      `Bạn có chắc chắn muốn xóa ${selectedIds.length} giao dịch đã chọn không?`,
      () => {
        selectedIds.forEach(id => deleteTransaction(id));
        setSelectedIds([]);
      }
    );
  };

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {t('finance.transaction_logs')}
          {selectedMonth !== 'all' && (
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-400)', marginLeft: '8px' }}>
              ({selectedMonth})
            </span>
          )}
        </h2>
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
            type="button"
            onClick={handleRefresh}
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1.5px solid var(--slate-300)' }}
            title="Làm mới dữ liệu"
          >
            <RotateCw size={16} className={isRefreshing ? 'spin-animation' : ''} style={{ color: 'var(--slate-600)' }} />
          </button>
          <button
            onClick={handleOpenModal}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            Thêm
          </button>
        </div>
      </div>

      <div className="modern-table-container">
        <table className="modern-table table-w-lg">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={filteredTransactions.length > 0 && selectedIds.length === filteredTransactions.length}
                  onChange={handleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </th>
              <th style={{ width: '160px' }}>{t('finance.date')}</th>
              <th style={{ width: '110px' }}>{t('finance.type')}</th>
              <th style={{ width: '140px', textAlign: 'right' }}>{t('finance.amount')}</th>
              <th>{t('finance.notes')}</th>
              <th style={{ width: '90px', textAlign: 'center' }}>{t('finance.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '24px' }}>
                  Không tìm thấy giao dịch nào trong tháng này.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isExpense = tx.type === 'expense';
                
                const displayCategory = getCategoryDisplayName(tx.category);

                const isEditing = editingId === tx.id;

                if (isEditing) {
                  const txMonth = editDate ? editDate.substring(0, 7) : selectedMonth;
                  const monthBudgets = budgets.filter(b => b.month === txMonth || b.month === selectedMonth);
                  const categoriesList = Array.from(new Set(monthBudgets.map(b => b.category)));
                  if (categoriesList.length === 0) {
                    categoriesList.push('Ăn uống sinh hoạt', 'Thể hình (Gym/Supps)', 'Chi phí cố định', 'Học tập/Công việc');
                  }

                  return (
                    <tr key={tx.id} style={{ backgroundColor: 'var(--slate-50)' }}>
                      <td></td>
                      <td>
                        <input
                          type="datetime-local"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="form-input"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.85rem',
                            borderRadius: '6px',
                            border: '1.5px solid var(--primary)',
                            outline: 'none',
                            width: '100%',
                            backgroundColor: '#ffffff'
                          }}
                        />
                      </td>
                      <td>
                        <select
                          value={editType}
                          onChange={(e) => {
                            const newT = e.target.value as 'income' | 'expense';
                            setEditType(newT);
                            if (newT === 'expense' && !categoriesList.includes(editCategory)) {
                              setEditCategory(categoriesList[0]);
                            }
                          }}
                          className="form-input"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.85rem',
                            borderRadius: '6px',
                            border: '1.5px solid var(--primary)',
                            outline: 'none',
                            width: '100%',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <option value="expense">Chi tiêu</option>
                          <option value="income">Thu nhập</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editAmount}
                          onChange={(e) => setEditAmount(formatNumberInput(e.target.value))}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1.5px solid var(--primary)',
                            textAlign: 'right',
                            fontSize: '0.85rem',
                            outline: 'none',
                            width: '100%',
                            backgroundColor: '#ffffff'
                          }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Ghi chú"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1.5px solid var(--primary)',
                              fontSize: '0.85rem',
                              outline: 'none',
                              width: '100%',
                              backgroundColor: '#ffffff'
                            }}
                          />
                          {editType === 'expense' && (
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1.5px solid var(--primary)',
                                fontSize: '0.85rem',
                                outline: 'none',
                                width: '100%',
                                backgroundColor: '#ffffff'
                              }}
                            >
                              {categoriesList.map(cat => (
                                <option key={cat} value={cat}>
                                  {getCategoryDisplayName(cat)}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditSave(tx.id)}
                            className="btn-icon"
                            title="Lưu"
                            style={{ width: '28px', height: '28px', color: 'var(--success)' }}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="btn-icon"
                            title="Hủy"
                            style={{ width: '28px', height: '28px', color: 'var(--error)' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={tx.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(tx.id)}
                        onChange={() => handleToggleSelect(tx.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ color: 'var(--slate-500)' }} className="tabular-nums">
                      {formatDateTime(tx.date)}
                    </td>
                    <td>
                      <span className={`badge ${isExpense ? 'badge-expense' : 'badge-income'}`}>
                        {isExpense ? 'Chi tiêu' : 'Thu nhập'}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: isExpense ? 'var(--text-main)' : 'var(--success)',
                      }}
                      className="tabular-nums"
                    >
                      {formatCurrency(isExpense ? -tx.amount : tx.amount)}
                    </td>
                    <td>
                      <div>{tx.notes}</div>
                      {isExpense && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                          Hạng mục: {displayCategory}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditStart(tx)}
                          className="btn-icon"
                          title="Sửa giao dịch"
                          style={{ width: '28px', height: '28px', color: 'var(--primary)', borderColor: 'var(--slate-200)' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id, tx.notes)}
                          className="btn-icon"
                          title="Xóa giao dịch"
                          style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.15)', width: '28px', height: '28px' }}
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
              {t('finance.add_transaction')}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Type Switch */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)', display: 'block', marginBottom: '6px' }}>
                  {t('finance.type')}
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`btn ${type === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px' }}
                  >
                    Chi tiêu
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`btn ${type === 'income' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px' }}
                  >
                    Thu nhập
                  </button>
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)', display: 'block', marginBottom: '6px' }}>
                  Ngày giao dịch
                </label>
                <input
                  type="date"
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)', display: 'block', marginBottom: '6px' }}>
                  {t('finance.amount')}
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(formatNumberInput(e.target.value))}
                  placeholder="2.350.000"
                  className="form-input"
                  required
                />
              </div>

              {/* Category (only for expense) */}
              {type === 'expense' && (
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)', display: 'block', marginBottom: '6px' }}>
                    {t('finance.category')}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                    style={{ appearance: 'auto' }}
                  >
                    {budgets.map((b) => (
                      <option key={b.category} value={b.category}>
                        {getCategoryDisplayName(b.category)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)', display: 'block', marginBottom: '6px' }}>
                  {t('finance.notes')}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Mua hũ Whey Scitec"
                  className="form-input"
                  required
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
