import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart } from 'lucide-react';
import { useFoodStore } from '../../../store/useFoodStore';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { formatCurrency } from '../../../utils/formatCurrency';

interface CircleProgressProps {
  value: number;
  target: number;
  unit: string;
  color: string;
  label: string;
  size?: number;
}

const CircleProgress: React.FC<CircleProgressProps> = ({
  value,
  target,
  unit,
  color,
  label,
  size = 110,
}) => {
  const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--slate-100)"
            strokeWidth={strokeWidth}
          />
          {/* Active progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        {/* Text values inside circle */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {Math.round(value)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', borderTop: '1px solid var(--slate-100)', paddingTop: '2px', marginTop: '2px' }}>
            {target} {unit}
          </span>
        </div>
      </div>
      <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate-500)' }}>{label}</span>
    </div>
  );
};

interface MacrosDashboardProps {
  selectedMondayStr?: string;
}

export const MacrosDashboard: React.FC<MacrosDashboardProps> = () => {
  const { t } = useTranslation();
  const { foodEntries, dailyCalorieGoal, macroGoals } = useFoodStore();
  const { hideAmounts } = useFinanceStore();

  // Filter entries for the single static week
  const weekEntries = React.useMemo(() => {
    const validDays = ['2', '3', '4', '5', '6', '7', '8'];
    return foodEntries.filter(e => e.date && validDays.includes(e.date));
  }, [foodEntries]);

  // Calculate total values
  const totals = React.useMemo(() => {
    return weekEntries.reduce(
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
  }, [weekEntries]);

  // Calculate averages per day for nutrition, and total sum for cost
  const avgCalories = totals.calories / 7;
  const avgProtein = totals.protein / 7;
  const avgCarbs = totals.carbs / 7;
  const avgFat = totals.fat / 7;
  const totalCost = totals.cost;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        marginBottom: '24px',
      }}
    >
      {/* 1. Calories Card */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircleProgress
          value={avgCalories}
          target={dailyCalorieGoal}
          unit="kcal"
          color="var(--amber)"
          label={`${t('food.calories')} (${t('food.weekly_avg')})`}
        />
      </div>

      {/* 2. Macros Card */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>
          {t('food.macros')} ({t('food.weekly_avg')})
        </h3>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <CircleProgress
            value={avgProtein}
            target={macroGoals.protein}
            unit="g"
            color="var(--primary)"
            label="Protein"
            size={90}
          />
          <CircleProgress
            value={avgCarbs}
            target={macroGoals.carbs}
            unit="g"
            color="#3b82f6"
            label="Carbs"
            size={90}
          />
          <CircleProgress
            value={avgFat}
            target={macroGoals.fat}
            unit="g"
            color="#eab308"
            label="Fat"
            size={90}
          />
        </div>
      </div>

      {/* 3. Cost Card */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRight: '1px solid rgba(16, 185, 129, 0.15)',
        }}
      >
        <ShoppingCart size={28} style={{ color: 'var(--success)', marginBottom: '8px' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
          {t('food.cost_week')}
        </span>
        <span
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--success)',
            textShadow: '0 0 10px rgba(16, 185, 129, 0.1)',
          }}
          className="tabular-nums"
        >
          {formatCurrency(totalCost)}
        </span>
      </div>
    </div>
  );
};
