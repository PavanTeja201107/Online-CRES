/**
 * Formats a last login timestamp into a professional, human-readable string
 * @param {string} timestamp - ISO 8601 timestamp string or MySQL DATETIME
 * @returns {string} - Formatted date string (e.g., "October 21, 2025 at 9:23 PM")
 */
export function formatLastLogin(timestamp) {
  if (!timestamp) return null;

  try {
    const date = new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', timestamp);
      return null;
    }
    // Professional format: "October 21, 2025 at 9:23 PM"
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    const formatted = date.toLocaleString('en-US', options);
    // Replace the comma after day with " at"
    return formatted.replace(/,([^,]*)$/, ' at$1');
  } catch (error) {
    console.error('Error formatting last login timestamp:', error);
    return null;
  }
}
