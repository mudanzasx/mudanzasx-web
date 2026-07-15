"use client";

import type { ReactNode } from "react";
import { field } from "@/components/ui/field";

// Primitivos de campo compartidos por los formularios de lead del panel
// (ficha de edición y alta manual), para mantener la coherencia visual.
export const fieldClass = field({ className: "mt-1.5" });
export const labelClass = "block text-xs font-medium text-black/60";

export function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-hairline bg-white shadow-card p-5">
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
  onBlur,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  error?: string | null;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        className={fieldClass}
      />
      {error && (
        <p className="mt-1.5 text-[13px] font-medium text-black" role="alert">
          {error}
        </p>
      )}
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
