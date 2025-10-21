import React from 'react';

/**
 * SecurityBanner Component
 * A professional, dismissible alert banner for displaying security information
 * like last login timestamps. Appears below navbar, above main content.
 */
export default function SecurityBanner({ message, onDismiss, variant = 'info' }) {
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    security: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  };

  return (
    <div className={`border-b ${variantStyles[variant]} px-6 py-4 flex items-center justify-between shadow-sm`}>
      <div className="flex items-center gap-3">
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-current hover:opacity-70 transition-opacity p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Dismiss notification"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
