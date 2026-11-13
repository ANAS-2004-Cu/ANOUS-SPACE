import React from 'react';
import { Button } from './Button';

export interface AlertAction {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  actions?: AlertAction[];
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  actions,
  onClose,
}) => {
  if (!visible) return null;

  const resolvedActions: AlertAction[] =
    actions && actions.length > 0 ? actions : [{ text: 'OK', style: 'default' }];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-backdrop)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-top-highlight), var(--card-shadow-hover)',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        {message && (
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
            }}
          >
            {message}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 8,
            flexWrap: 'wrap',
          }}
        >
          {resolvedActions.map((act, idx) => {
            const variant =
              act.style === 'destructive'
                ? 'danger'
                : act.style === 'cancel'
                ? 'secondary'
                : 'primary';
            return (
              <Button
                key={idx}
                variant={variant}
                size="sm"
                onClick={() => {
                  onClose();
                  if (act.onPress) act.onPress();
                }}
              >
                {act.text}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
