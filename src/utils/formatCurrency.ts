export const formatCurrency = (amount: number): string => {
  try {
    const hide = typeof window !== 'undefined' && localStorage.getItem('lifesheet_hide_amounts') === 'true';
    if (hide) return '••••••';
  } catch (e) {
    console.error(e);
  }
  const formatted = new Intl.NumberFormat('vi-VN').format(Math.abs(amount));
  return `${amount < 0 ? '-' : ''}${formatted} đ`;
};
