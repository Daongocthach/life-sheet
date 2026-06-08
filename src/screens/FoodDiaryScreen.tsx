import React from 'react';
import { FoodDiaryTable } from '../features/food-diary/components/FoodDiaryTable';
import { useChatStore } from '../store/useChatStore';

export const FoodDiaryScreen: React.FC = () => {
  const { highlightedTable } = useChatStore();
  const isHighlighted = highlightedTable === 'food';

  return (
    <div 
      className={isHighlighted ? 'flash-highlight' : ''} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px',
        borderRadius: 'var(--rounded-lg)' 
      }}
    >
      <FoodDiaryTable />
    </div>
  );
};
export default FoodDiaryScreen;
