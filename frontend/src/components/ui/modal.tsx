import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl border border-revora-border bg-revora-card p-6 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-revora-border pb-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="text-sm text-revora-muted mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
