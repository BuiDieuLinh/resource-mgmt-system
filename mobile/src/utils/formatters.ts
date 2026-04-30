/**
 * Format and parsing utilities
 */

export const formatCurrency = (amount: number, currency: string = 'VND'): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const truncateString = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const capitalizeString = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  return str
    .split(' ')
    .map((word) => capitalizeString(word))
    .join(' ');
};
