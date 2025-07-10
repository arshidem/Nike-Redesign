import { format } from "date-fns";

/**
 * Formats a date string or Date object into a human-readable format
 * @param {string|Date} dateInput - The date to format
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.includeTime=false] - Whether to include time in the output
 * @param {boolean} [options.shortMonth=false] - Whether to use short month names
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, options = {}) => {
  const { includeTime = false, shortMonth = false } = options;

  if (!dateInput) return "N/A";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Invalid Date";

  const pattern = includeTime
    ? shortMonth
      ? "MMM d, yyyy hh:mm a"
      : "MMMM d, yyyy hh:mm a"
    : shortMonth
      ? "MMM d, yyyy"
      : "MMMM d, yyyy";

  return format(date, pattern);
};

/**
 * Formats a date as relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "N/A";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Invalid Date";

  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
    }
  }

  return "Just now";
};

/**
 * Formats a date as an ISO string (YYYY-MM-DD)
 */
export const formatISODate = (dateInput) => {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Formats a number as currency
 * @param {number} amount - The amount to format
 * @param {Object} [options] - Formatting options
 * @param {string} [options.currency='INR'] - Currency code (e.g., 'USD', 'EUR')
 * @param {string} [options.locale='en-IN'] - Locale to use for formatting
 * @param {number} [options.minimumFractionDigits=2] - Minimum fraction digits
 * @param {number} [options.maximumFractionDigits=2] - Maximum fraction digits
 * @param {boolean} [options.compact=false] - Whether to use compact notation (e.g., "1K" instead of "1,000")
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (
  amount,
  options = {}
) => {
  const {
    currency = 'INR',
    locale = 'en-IN',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    compact = false,
  } = options;

  // Handle invalid input
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'N/A';
  }

  try {
    if (compact && amount >= 1000) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        notation: 'compact',
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount);
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `${currency} ${amount.toFixed(maximumFractionDigits)}`;
  }
};

// Export all
export default {
  formatDate,
  formatRelativeTime,
  formatISODate,
  formatCurrency,
};
