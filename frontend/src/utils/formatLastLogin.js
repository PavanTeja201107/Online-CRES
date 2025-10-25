/*
 * Formats a last login timestamp into a professional, human-readable string
 * Utility: formatLastLogin
 *
 * Formats a last login timestamp into a professional, human-readable string for display in the UI.
 *
 * @returns {string|null} - Formatted date string (e.g., "October 21, 2025 at 9:23 PM") or null if invalid
 *
 * Usage:
 *   formatLastLogin('2025-10-21T21:23:00Z');
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
