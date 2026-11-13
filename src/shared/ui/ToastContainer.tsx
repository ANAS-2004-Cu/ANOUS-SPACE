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

const TONE_STYLES: Record<
  ToastType,
  { color: string; bg: string; border: string }
> = {
  success: {
    color: 'var(--status-success)',
    bg: 'var(--status-success-subtle)',
    border: 'var(--status-success-border)',
  },
  error: {
    color: 'var(--status-danger)',
    bg: 'var(--status-danger-subtle)',
    border: 'var(--status-danger-border)',
  },
  warning: {
    color: 'var(--status-warning)',
    bg: 'var(--status-warning-subtle)',
    border: 'var(--status-warning-border)',
  },
  info: {
    color: 'var(--accent)',
    bg: 'var(--accent-subtle)',
    border: 'var(--accent-border)',
  },
};

function renderToneIcon(type: ToastType, color: string) {
  switch (type) {
    case 'success':
      return <FiCheckCircle size={15} strokeWidth={1.75} color={color} />;
    case 'error':
      return <FiAlertCircle size={15} strokeWidth={1.75} color={color} />;
    case 'warning':
      return <FiAlertTriangle size={15} strokeWidth={1.75} color={color} />;
    default:
      return <FiInfo size={15} strokeWidth={1.75} color={color} />;
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
      {toasts.map((toast) => {
        const tone = TONE_STYLES[toast.type] || TONE_STYLES.info;
        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`toast-card toast-card--${toast.type}`}
          >
            <div
              className="toast-icon-box"
              style={{
                backgroundColor: tone.bg,
                borderColor: tone.border,
              }}
            >
              {renderToneIcon(toast.type, tone.color)}
            </div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.35,
                }}
              >
                {toast.title}
              </div>
              {toast.message && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                  }}
                >
                  {toast.message}
                </div>
              )}

              {toast.action && (
                <div style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      toast.action!.onClick();
                      onDismiss(toast.id);
                    }}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: tone.color,
                      backgroundColor: tone.bg,
                      border: `1px solid ${tone.border}`,
                      borderRadius: 6,
                      padding: '4px 10px',
                    }}
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
              className="icon-btn"
              style={{ width: 24, height: 24, border: 'none', backgroundColor: 'transparent' }}
            >
              <FiX size={14} strokeWidth={1.75} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
