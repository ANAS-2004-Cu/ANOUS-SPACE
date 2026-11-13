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
    color: 'var(--success)',
    bg: 'var(--success-subtle)',
    border: 'rgba(77, 139, 110, 0.36)',
  },
  error: {
    color: 'var(--danger)',
    bg: 'var(--danger-subtle)',
    border: 'rgba(186, 94, 78, 0.38)',
  },
  warning: {
    color: 'var(--warning)',
    bg: 'var(--warning-subtle)',
    border: 'rgba(189, 136, 62, 0.38)',
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
            className="toast-card"
            style={{ borderColor: tone.border }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                backgroundColor: tone.bg,
                border: `1px solid ${tone.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
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
              style={{
                color: 'var(--text-muted)',
                padding: 3,
                display: 'inline-flex',
                borderRadius: 5,
                flexShrink: 0,
              }}
            >
              <FiX size={14} strokeWidth={1.75} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
