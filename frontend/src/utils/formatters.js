/**
 * Format currency amounts nicely
 */
export const formatCurrency = (amount = 0) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date string
 */
export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return d.toLocaleDateString('en-US', options);
};

/**
 * Format number with commas
 */
export const formatNumber = (num = 0) => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Format ISO datetime for input[type="datetime-local"]
 */
export const toDateTimeLocalValue = (date = new Date()) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
