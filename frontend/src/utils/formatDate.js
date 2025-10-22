/**
 * Utility: formatDate
 *
 * Converts a date string into a locale-formatted string for display.
 *
 * @param {string} dateString - A date string (ISO 8601 or MySQL DATETIME)
 * @returns {string} - Formatted date string using the user's locale
 *
 * Usage:
 *   formatDate('2025-10-21T21:23:00Z');
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}
