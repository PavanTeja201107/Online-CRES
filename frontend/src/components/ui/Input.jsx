import React from 'react';

/*
 * Input
 *
 * Purpose:
 * Simple labeled input wrapper that shows label, hint and error messages.
 *
 * Parameters:
 * - label, required, hint, error, className: presentational props.
 * - ...props: passed to the internal <input> element.
 *
 * Return value:
 * A labeled input element with optional helper text.
 */
export default function Input({ label, required, hint, error, className = '', ...props }) {
  return (
    <label className={`block text-sm ${className}`}>
      {label && (
        <span className="block mb-1">
          {label} {required && <span className="text-red-600">*</span>}
        </span>
      )}
      <input
        {...props}
        className={`border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
      />
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </label>
  );
}
