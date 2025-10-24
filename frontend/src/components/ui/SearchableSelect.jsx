import React, { useMemo, useState } from 'react';

export default function SearchableSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder = '-- Choose --',
  required,
  className = '',
  display,
  getValue,
  ...props
}) {
  const [q, setQ] = useState('');
  const normalize = (s) => String(s || '').toLowerCase();
  const filtered = useMemo(() => {
    const qq = normalize(q);
    if (!qq) return options;
    return options.filter((opt) =>
      normalize(display ? display(opt) : opt?.label || opt?.name || opt?.title || opt).includes(qq),
    );
  }, [options, q, display]);

  return (
    <div className={`block text-sm ${className}`}>
      {label && (
        <span className="block mb-1">
          {label} {required && <span className="text-red-600">*</span>}
        </span>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          className="border rounded px-3 py-2 w-1/2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Quick search..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={value}
          onChange={onChange}
          className="border rounded px-3 py-2 w-1/2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...props}
        >
          <option value="">{placeholder}</option>
          {filtered.map((opt, idx) => {
            const v = getValue
              ? getValue(opt)
              : (opt.value ?? opt.id ?? opt.class_id ?? opt.election_id ?? idx);
            const text = display ? display(opt) : (opt.label ?? opt.name ?? opt.title ?? `${opt}`);
            return (
              <option key={v} value={v}>
                {text}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
