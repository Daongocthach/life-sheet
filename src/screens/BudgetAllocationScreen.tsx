import React from 'react';
import { BudgetAllocationTable } from '../features/manage-money/components/BudgetAllocationTable';
import { useChatStore } from '../store/useChatStore';

export const BudgetAllocationScreen: React.FC = () => {
  const { highlightedTable } = useChatStore();
  const isHighlighted = highlightedTable === 'finance';

  return (
    <div className={isHighlighted ? 'flash-highlight' : ''} style={{ borderRadius: 'var(--rounded-lg)' }}>
      <BudgetAllocationTable />
    </div>
  );
};
export default BudgetAllocationScreen;
