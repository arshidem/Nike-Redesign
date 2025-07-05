/**
 * Formats a date string or Date object into a human-readable format
 * @param {string|Date} dateInput - The date to format (ISO string or Date object)
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.includeTime=false] - Whether to include time in the output
 * @param {boolean} [options.shortMonth=false] - Whether to use short month names
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, options = {}) => {
  const { includeTime = false, shortMonth = false } = options;
  
  // Handle invalid input
  if (!dateInput) return 'N/A';
  
  const date = new Date(dateInput);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid Date';

  // Formatting options
  const monthFormat = shortMonth ? 'short' : 'long';
  const dayOptions = { day: 'numeric' };
  const monthOptions = { month: monthFormat };
  const yearOptions = { year: 'numeric' };
  const timeOptions = includeTime ? { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  } : null;

  // Get locale components
  const locale = navigator.language || 'en-US';
  
  // Format parts
  const day = date.toLocaleDateString(locale, dayOptions);
  const month = date.toLocaleDateString(locale, monthOptions);
  const year = date.toLocaleDateString(locale, yearOptions);
  const time = timeOptions ? date.toLocaleTimeString(locale, timeOptions) : null;

  // Construct final string
  if (includeTime) {
    return `${month} ${day}, ${year} at ${time}`;
  }
  return `${month} ${day}, ${year}`;
};

/**
 * Formats a date as relative time (e.g., "2 days ago")
 * @param {string|Date} dateInput - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid Date';

  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'Just now';
};

/**
 * Formats a date as an ISO string (YYYY-MM-DD)
 * @param {string|Date} dateInput - The date to format
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export const formatISODate = (dateInput) => {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default {
  formatDate,
  formatRelativeTime,
  formatISODate
};