import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Receipt, Utensils, Dumbbell, Download, Crown, LogOut, Calendar, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, useFinanceStore, useFoodStore, useWorkoutStore, useMonthStore } from '../../store';


interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExportExcel: () => void;
  isOpen?: boolean; // Mobile drawer toggle
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onExportExcel,
  isOpen = true,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { budgets, transactions, hideAmounts, toggleHideAmounts } = useFinanceStore();
  const { foodEntries } = useFoodStore();
  const { sessions } = useWorkoutStore();
  const { selectedMonth, setSelectedMonth } = useMonthStore();

  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();

    // Add current month by default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    months.add(currentMonth);

    // Add month of each budget
    budgets.forEach((b) => {
      if (b.month && /^\d{4}-\d{2}$/.test(b.month)) {
        months.add(b.month);
      }
    });

    // Add month of each transaction
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        const m = t.date.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(m)) {
          months.add(m);
        }
      }
    });

    // Add month of each food entry
    foodEntries.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        const m = e.date.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(m)) {
          months.add(m);
        }
      }
    });

    // Add month of each workout session
    sessions.forEach((s) => {
      if (s.date && s.date.length >= 7) {
        const m = s.date.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(m)) {
          months.add(m);
        }
      }
    });

    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [budgets, transactions, foodEntries, sessions]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  const menuItems = [
    { id: 'budget', label: t('menu.budget'), icon: PieChart },
    { id: 'transactions', label: t('menu.transactions'), icon: Receipt },
    { id: 'food', label: t('menu.food'), icon: Utensils },
    { id: 'workout', label: t('menu.workout'), icon: Dumbbell },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  return (
    <aside
      className={`sidebar ${isOpen ? 'open' : ''}`}
      style={{
        width: '260px',
        backgroundColor: '#ffffff',
        color: 'var(--text-main)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        zIndex: 100,
        borderRight: '1px solid var(--border)',
        transition: 'transform 0.3s ease',
      }}
    >
      {/* Header section with Logo */}
      <div
        style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Elegant Blue Brand Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="7" height="9" rx="1.5" fill="var(--primary)" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" fill="var(--primary)" opacity="0.6" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" fill="var(--primary)" opacity="0.6" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" fill="var(--primary)" />
          </svg>
          <span
            style={{
              fontWeight: 800,
              fontSize: '1.25rem',
              color: 'var(--slate-900)',
              letterSpacing: '-0.5px',
            }}
          >
            LifeSheet
          </span>
        </div>

        {/* Actions Container (Che tiền & Ngôn ngữ) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Eye Toggle button */}
          <button
            onClick={toggleHideAmounts}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-light)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            title={hideAmounts ? (i18n.language === 'vi' ? 'Hiện số tiền' : 'Show amounts') : (i18n.language === 'vi' ? 'Ẩn số tiền' : 'Hide amounts')}
          >
            {hideAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>

          {/* Lang switch */}
          <button
            onClick={toggleLanguage}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '0.725rem',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-light)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {i18n.language === 'vi' ? 'EN' : 'VI'}
          </button>
        </div>
      </div>

      {/* Month Selector Section */}
      {activeTab !== 'workout' && (
        <div style={{ padding: '16px 20px 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {i18n.language === 'vi' ? 'Chọn tháng xem dữ liệu' : 'View Month'}
          </span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Calendar size={16} style={{ position: 'absolute', left: '12px', color: 'var(--slate-400)', pointerEvents: 'none' }} />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: 'var(--slate-50)',
                border: '1.5px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--slate-700)',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'auto',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'var(--slate-50)';
              }}
            >
              <option value="all">
                {i18n.language === 'vi' ? 'Tất cả các tháng' : 'All Months'}
              </option>
              {availableMonths.map((m) => {
                const [year, month] = m.split('-');
                const label = i18n.language === 'vi' ? `Tháng ${month}/${year}` : `${month}/${year}`;
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {/* Navigation section */}
      <nav style={{ flex: 1, padding: '16px 12px 24px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>

        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                width: '100%',
                border: 'none',
                borderRadius: '10px',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--slate-500)',
                fontSize: '0.925rem',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--slate-50)';
                  e.currentTarget.style.color = 'var(--slate-900)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--slate-500)';
                }
              }}
            >
              {/* Left active indicator strip */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '25%',
                    height: '50%',
                    width: '3px',
                    backgroundColor: 'var(--primary)',
                    borderRadius: '0 4px 4px 0',
                  }}
                />
              )}
              <IconComponent size={18} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Promo Card (Upgrade to Premium style) */}
      <div style={{ padding: '20px 16px', borderTop: '1px solid var(--border-light)' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, var(--primary-hover) 0%, var(--primary) 100%)',
            borderRadius: '14px',
            padding: '18px 16px',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle circle overlay background */}
          <div
            style={{
              position: 'absolute',
              right: '-20px',
              bottom: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              pointerEvents: 'none',
            }}
          />

          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Crown size={16} fill="#fbbf24" stroke="none" />
              LifeSheet Premium
            </h4>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: '1.3' }}>
              Mở khóa đầy đủ báo cáo phân tích nâng cao và xuất báo cáo.
            </p>
          </div>

          <button
            onClick={onExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '10px',
              backgroundColor: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.2s, background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-light)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Download size={14} color="var(--primary)" />
            {t('menu.export')}
          </button>
        </div>
      </div>

      {/* Profile and Logout Section */}
      {user && (
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backgroundColor: 'var(--slate-50)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase' }}>
              Tài khoản
            </span>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--slate-800)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: '2px',
              }}
              title={user.email}
            >
              {user.email}
            </span>
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '8px 14px',
              fontSize: '0.8rem',
              gap: '6px',
              display: 'flex',
              justifyContent: 'center',
              borderRadius: '9999px',
              borderColor: 'var(--slate-200)',
            }}
          >
            <LogOut size={14} style={{ color: 'var(--error)' }} />
            Đăng xuất
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            transform: translateX(-100%);
            box-shadow: 4px 0 25px rgba(0,0,0,0.15);
          }
          .sidebar.open {
            transform: translateX(0);
          }
        }
      `}} />
    </aside>
  );
};
export default Sidebar;
