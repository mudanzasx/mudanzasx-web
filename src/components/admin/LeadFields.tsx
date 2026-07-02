"use client";

import type { ReactNode } from "react";

// Primitivos de campo compartidos por los formularios de lead del panel
// (ficha de edición y alta manual), para mantener la coherencia visual.
export const fieldClass =
  "mt-1.5 w-full rounded-lg bg-gris px-3 py-2.5 text-sm text-black placeholder-black/40 outline-none border border-transparent transition-colors duration-150 focus:border-black";
export const labelClass = "block text-xs font-medium text-black/60";

export function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-black/10 p-5">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-black/50">
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function Text({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    </div>
  );
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 pt-1 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-black"
      />
      {label}
    </label>
  );
}
