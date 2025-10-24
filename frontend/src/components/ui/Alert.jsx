import React from 'react';

const STYLES = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  danger: 'bg-red-50 text-red-800 border-red-200',
};

export default function Alert({ kind = 'info', title, children, className = '' }) {
  const leftBar =
    {
      info: 'border-l-blue-400',
      success: 'border-l-emerald-400',
      warning: 'border-l-yellow-400',
      danger: 'border-l-red-400',
    }[kind] || 'border-l-blue-400';

  return (
    <div
      className={`relative border ${STYLES[kind]} ${className} rounded-lg p-3 pl-4 border-l-4 ${leftBar} transition`}
    >
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="text-sm">{children}</div>
    </div>
  );
}
