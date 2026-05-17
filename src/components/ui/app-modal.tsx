"use client";

import type * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type AppModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClassName?: string;
  contentClassName?: string;
};

export function AppModal({
  title,
  description,
  onClose,
  children,
  footer,
  widthClassName = "w-[380px]",
  contentClassName,
}: AppModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/28 backdrop-blur-[1.5px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          "animate-in fade-in zoom-in-95 duration-150 rounded-lg border border-zinc-200/90 bg-white p-4 text-zinc-900 shadow-lg shadow-zinc-900/8",
          widthClassName
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
            {description ? <p className="text-xs text-zinc-500">{description}</p> : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:bg-zinc-100 focus-visible:text-zinc-700 focus-visible:outline-none"
            aria-label={`Close ${title}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={cn("space-y-3", contentClassName)}>{children}</div>

        {footer ? <div className="mt-4 flex items-center justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
