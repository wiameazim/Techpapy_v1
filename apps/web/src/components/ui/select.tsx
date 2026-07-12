import { SelectHTMLAttributes } from "react";

export function Select({
  label,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const select = (
    <select
      className={`w-full border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-signal ${className}`}
      {...props}
    >
      {children}
    </select>
  );

  if (!label) return select;

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-mute">
        {label}
      </span>
      {select}
    </label>
  );
}
