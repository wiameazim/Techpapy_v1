import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`group border border-line bg-paper p-8 transition-all duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-[6px_6px_0_0_var(--color-signal)] ${className}`}
      {...props}
    />
  );
}

export function CardLabel({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-block bg-signal px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-ink ${className}`}
      {...props}
    />
  );
}
