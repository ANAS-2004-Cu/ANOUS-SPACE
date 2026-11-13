import React from 'react';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiX,
} from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  action?: ToastAction;
}

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

function renderToneIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return <FiCheckCircle size={15} strokeWidth={1.75} />;
    case 'error':
      return <FiAlertCircle size={15} strokeWidth={1.75} />;
    case 'warning':
      return <FiAlertTriangle size={15} strokeWidth={1.75} />;
    default:
      return <FiInfo size={15} strokeWidth={1.75} />;
  }
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-viewport"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`toast-card toast-card--${toast.type}`}
        >
          <div className={`toast-icon-box toast-icon-box--${toast.type}`}>
            {renderToneIcon(toast.type)}
          </div>

          <div className="ui-flex-1 ui-stack ui-stack--xs">
            <div className="toast-title">{toast.title}</div>
            {toast.message && <div className="toast-message">{toast.message}</div>}

            {toast.action && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    toast.action!.onClick();
                    onDismiss(toast.id);
                  }}
                  className={`toast-action-btn toast-action-btn--${toast.type}`}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="icon-btn toast-close-btn"
          >
            <FiX size={14} strokeWidth={1.75} />
          </button>
        </div>
      ))}
    </div>
  );
};
