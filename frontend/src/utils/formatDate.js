/*
  formatDate

  Purpose:
  Convert an ISO/UTC date string into a readable local date/time string.

  Parameters/Return:
  - dateString: a string parseable by Date. Returns a localized string.
*/
export function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}
