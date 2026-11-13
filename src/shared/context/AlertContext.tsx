import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ToastAction,
  ToastContainer,
  ToastItem,
  ToastType,
} from '../ui/ToastContainer';

export type { ToastAction, ToastType };

export interface AlertAction {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface ShowToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  action?: ToastAction;
  durationMs?: number;
}

interface AlertContextValue {
  showToast: (options: ShowToastOptions) => void;
  showAlert: (title: string, message?: string, actions?: AlertAction[]) => void;
}

const DEFAULT_DURATION_MS = 3500;
const MAX_VISIBLE_TOASTS = 4;

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

function inferToastType(title: string): ToastType {
  const lower = title.toLowerCase();
  if (lower.includes('error') || lower.includes('fail')) return 'error';
  if (lower.includes('warn') || lower.includes('expired')) return 'warning';
  if (
    lower.includes('copied') ||
    lower.includes('created') ||
    lower.includes('deleted') ||
    lower.includes('reset')
  ) {
    return 'success';
  }
  return 'info';
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = 'info', action, durationMs = DEFAULT_DURATION_MS }: ShowToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((prev) => {
        const next = [...prev, { id, title, message, type, action }];
        if (next.length > MAX_VISIBLE_TOASTS) {
          const evicted = next.slice(0, next.length - MAX_VISIBLE_TOASTS);
          evicted.forEach((old) => {
            const oldTimer = timersRef.current.get(old.id);
            if (oldTimer !== undefined) {
              window.clearTimeout(oldTimer);
              timersRef.current.delete(old.id);
            }
          });
          return next.slice(next.length - MAX_VISIBLE_TOASTS);
        }
        return next;
      });

      if (durationMs > 0) {
        const timer = window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
        timersRef.current.set(id, timer);
      }
    },
    [dismissToast]
  );

  const showAlert = useCallback(
    (title: string, message?: string, actions?: AlertAction[]) => {
      const primaryAction = actions?.find(
        (act) => act.style !== 'cancel' && typeof act.onPress === 'function'
      );
      showToast({
        title,
        message,
        type: inferToastType(title),
        action: primaryAction?.onPress
          ? { label: primaryAction.text, onClick: primaryAction.onPress }
          : undefined,
      });
    },
    [showToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <AlertContext.Provider value={{ showToast, showAlert }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AlertContext.Provider>
  );
};

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return ctx;
}
