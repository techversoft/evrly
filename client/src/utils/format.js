/**
 * Formats a number to Indian Rupees (INR) format.
 * @param {Number} num 
 * @returns {String} formatted price
 */
export const formatPrice = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Formats standard date strings into clean display strings.
 * @param {String} dateString 
 * @returns {String} E.g., June 22, 2026
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
