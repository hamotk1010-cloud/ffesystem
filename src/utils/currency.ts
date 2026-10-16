/**
 * Formats a number to Philippine Peso (₱)
 * e.g., 22458 -> ₱22,458.00
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  const numeric = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  const safe = isNaN(numeric) ? 0 : numeric;
  return '₱' + safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
