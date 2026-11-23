"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  AlertOctagon,
  ShieldAlert,
  Trash2,
} from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";
export type ModalType = "danger" | "warning" | "info" | "success";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmModalOptions {
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
}

export interface AlertModalOptions {
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
}

interface ModalState extends ConfirmModalOptions {
  isOpen: boolean;
  isAlertOnly: boolean;
  resolve: (value: boolean) => void;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  showConfirm: (options: ConfirmModalOptions) => Promise<boolean>;
  showAlert: (options: AlertModalOptions) => Promise<void>;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Global static event emitters so `toast.success()` and `confirmModal()` can be used anywhere
type ToastListener = (toast: Omit<ToastItem, "id">) => void;
type ConfirmListener = (options: ConfirmModalOptions) => Promise<boolean>;
type AlertListener = (options: AlertModalOptions) => Promise<void>;

let globalToastListener: ToastListener | null = null;
let globalConfirmListener: ConfirmListener | null = null;
let globalAlertListener: AlertListener | null = null;

export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({ type: "success", message, title, duration });
    }
  },
  error: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({ type: "error", message, title, duration });
    }
  },
  warning: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({ type: "warning", message, title, duration });
    }
  },
  info: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({ type: "info", message, title, duration });
    }
  },
};

export async function confirmModal(options: ConfirmModalOptions): Promise<boolean> {
  if (globalConfirmListener) {
    return globalConfirmListener(options);
  }
  // Fallback to window.confirm if mounted before provider
  return window.confirm(`${options.title}\n\n${options.message}`);
}

export async function alertModal(options: AlertModalOptions): Promise<void> {
  if (globalAlertListener) {
    return globalAlertListener(options);
  }
  window.alert(`${options.title}\n\n${options.message}`);
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast,
      confirmModal,
      alertModal,
    };
  }
  return {
    toast,
    confirmModal: context.showConfirm,
    alertModal: context.showAlert,
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<ModalState | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toastData: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      id,
      ...toastData,
      duration: toastData.duration || 4000,
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep at most 5 active toasts
  }, []);

  const showConfirm = useCallback((options: ConfirmModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        ...options,
        isOpen: true,
        isAlertOnly: false,
        resolve: (val: boolean) => {
          setModal(null);
          resolve(val);
        },
      });
    });
  }, []);

  const showAlert = useCallback((options: AlertModalOptions): Promise<void> => {
    return new Promise((resolve) => {
      setModal({
        ...options,
        isOpen: true,
        isAlertOnly: true,
        resolve: () => {
          setModal(null);
          resolve();
        },
      });
    });
  }, []);

  // Register global listeners
  useEffect(() => {
    globalToastListener = addToast;
    globalConfirmListener = showConfirm;
    globalAlertListener = showAlert;

    return () => {
      globalToastListener = null;
      globalConfirmListener = null;
      globalAlertListener = null;
    };
  }, [addToast, showConfirm, showAlert]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modal?.isOpen) {
        modal.resolve(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showConfirm, showAlert }}>
      {children}

      {/* Floating Stack of Toasts */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => (
          <SingleToast key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
        ))}
      </div>

      {/* Beautiful Glassmorphic Alert & Confirm Modal */}
      {modal?.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 my-auto shadow-2xl space-y-5 text-center transform transition-all animate-in zoom-in-95 duration-200 select-none"
          >
            {/* Modal Icon Badge */}
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg transition-transform ${
                modal.type === "danger"
                  ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 shadow-red-500/10"
                  : modal.type === "warning"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 shadow-amber-500/10"
                  : modal.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 shadow-emerald-500/10"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 shadow-blue-500/10"
              }`}
            >
              {modal.type === "danger" ? (
                <Trash2 className="w-7 h-7" />
              ) : modal.type === "warning" ? (
                <AlertTriangle className="w-7 h-7" />
              ) : modal.type === "success" ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <Info className="w-7 h-7" />
              )}
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                {modal.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed px-2 whitespace-pre-wrap">
                {modal.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {!modal.isAlertOnly && (
                <button
                  type="button"
                  onClick={() => modal.resolve(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700/80 transition cursor-pointer"
                >
                  {modal.cancelText || "Cancel"}
                </button>
              )}

              <button
                type="button"
                onClick={() => modal.resolve(true)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition shadow-md cursor-pointer ${
                  modal.type === "danger"
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20"
                    : modal.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                    : modal.type === "info"
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                }`}
              >
                {modal.confirmText || (modal.isAlertOnly ? "Understood" : "Confirm Action")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

function SingleToast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!item.duration) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / item.duration!) * 100);
      setProgress(remaining);
      if (elapsed >= item.duration!) {
        clearInterval(interval);
        onDismiss();
      }
    }, 20);

    return () => clearInterval(interval);
  }, [item.duration, onDismiss]);

  const borderClass =
    item.type === "success"
      ? "border-emerald-500/40 shadow-emerald-500/10"
      : item.type === "error"
      ? "border-red-500/40 shadow-red-500/10"
      : item.type === "warning"
      ? "border-amber-500/40 shadow-amber-500/10"
      : "border-blue-500/40 shadow-blue-500/10";

  const progressBg =
    item.type === "success"
      ? "bg-emerald-500"
      : item.type === "error"
      ? "bg-red-500"
      : item.type === "warning"
      ? "bg-amber-500"
      : "bg-blue-500";

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative overflow-hidden bg-slate-900/95 backdrop-blur-md border ${borderClass} rounded-2xl p-4 shadow-2xl transition-all duration-300 ease-out transform translate-y-0 opacity-100 flex items-start gap-3`}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        {item.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        {item.type === "error" && <XCircle className="w-5 h-5 text-red-400" />}
        {item.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
        {item.type === "info" && <Info className="w-5 h-5 text-blue-400" />}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 pr-1">
        {item.title && (
          <h4 className="font-bold text-xs text-white leading-tight mb-0.5">
            {item.title}
          </h4>
        )}
        <p className="text-xs text-slate-300 leading-snug break-words">
          {item.message}
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        title="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress Bar Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/60 overflow-hidden">
        <div
          className={`h-full ${progressBg} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
