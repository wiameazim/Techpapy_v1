"use client";

import { ReactNode } from "react";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 py-10">
      <div className="max-h-full w-full max-w-lg overflow-y-auto border border-ink bg-paper p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-lg font-black uppercase tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold uppercase tracking-widest text-mute hover:text-ink"
          >
            Fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
