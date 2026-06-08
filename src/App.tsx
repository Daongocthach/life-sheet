import { useState, useEffect } from 'react';
import './locales/i18n'; // Khởi chạy i18n
import { AppLayout } from './components/Layout';
import {
  BudgetAllocationScreen,
  TransactionLogsScreen,
  FoodDiaryScreen,
  WorkoutDiaryScreen,
  LoginScreen,
} from './screens';
import { GymTimer } from './components/GymTimer';
import { exportToExcel } from './utils';
import { useFinanceStore } from './store/useFinanceStore';
import { useFoodStore } from './store/useFoodStore';
import { useWorkoutStore } from './store/useWorkoutStore';
import { useAuthStore } from './store';
import { authService } from './services/authService';

function App() {
  const [activeTab, setActiveTab] = useState<string>('budget');
  const { isAuthenticated, isLoading, setUser } = useAuthStore();

  // Đăng ký lắng nghe trạng thái đăng nhập
  useEffect(() => {
    const unsubAuth = authService.subscribeAuthState((user) => {
      setUser(user);
    });
    return () => {
      unsubAuth();
    };
  }, [setUser]);

  // Đăng ký các listener đồng bộ dữ liệu Realtime khi App mount (chỉ khi đã đăng nhập)
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubFinance = useFinanceStore.getState().initListeners();
    const unsubFood = useFoodStore.getState().initListeners();
    const unsubWorkout = useWorkoutStore.getState().initListeners();

    return () => {
      unsubFinance();
      unsubFood();
      unsubWorkout();
    };
  }, [isAuthenticated]);

  // Hàm render view theo tab được chọn
  const renderScreen = () => {
    switch (activeTab) {
      case 'budget':
        return <BudgetAllocationScreen />;
      case 'transactions':
        return <TransactionLogsScreen />;
      case 'food':
        return <FoodDiaryScreen />;
      case 'workout':
        return <WorkoutDiaryScreen />;
      default:
        return <BudgetAllocationScreen />;
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: 'var(--background)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid var(--primary-light)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--slate-500)', fontWeight: 550 }}>Đang khởi động LifeSheet...</span>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <>
      {/* 3-column Layout */}
      <AppLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportExcel={exportToExcel}
      >
        {renderScreen()}
      </AppLayout>

      {/* Global Gym Rest Timer Overlay */}
      <GymTimer />
    </>
  );
}

export default App;
