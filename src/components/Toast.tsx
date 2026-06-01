"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckIcon, XIcon } from "@/components/icons";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastCtx = createContext<(message: string, type?: ToastType) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => remove(id), 3200);
    },
    [remove]
  );

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lift animate-toast-in"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                t.type === "success"
                  ? "bg-emerald-500"
                  : t.type === "error"
                  ? "bg-red-500"
                  : "bg-brand-500"
              }`}
            >
              {t.type === "error" ? (
                <XIcon width={13} height={13} strokeWidth={2.5} />
              ) : (
                <CheckIcon width={13} height={13} strokeWidth={2.5} />
              )}
            </span>
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-slate-300 transition-colors hover:text-slate-500"
              aria-label="닫기"
            >
              <XIcon width={16} height={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
