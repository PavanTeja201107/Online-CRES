import React from 'react';

const COLORS = {
  gray: 'bg-gray-600',
  blue: 'bg-blue-600',
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-600',
  orange: 'bg-orange-600',
  red: 'bg-red-600',
};

export default function Badge({ color = 'gray', children, className = '' }) {
  /*
   * Badge
   *
   * Purpose:
   * Small inline badge for short labels or status chips.
   *
   * Parameters:
   * - color: visual color key, children: badge content, className: extra classes.
   *
   * Return value:
   * A styled <span> element.
   */
  return (
    <span
      className={`inline-block px-2 py-1 rounded text-white text-xs ${COLORS[color]} ${className}`}
    >
      {children}
    </span>
  );
}
