import React from 'react';
import { TransactionLogsTable } from '../features/manage-money/components/TransactionLogsTable';
import { useChatStore } from '../store/useChatStore';

export const TransactionLogsScreen: React.FC = () => {
  const { highlightedTable } = useChatStore();
  const isHighlighted = highlightedTable === 'finance';

  return (
    <div className={isHighlighted ? 'flash-highlight' : ''} style={{ borderRadius: 'var(--rounded-lg)' }}>
      <TransactionLogsTable />
    </div>
  );
};
export default TransactionLogsScreen;
