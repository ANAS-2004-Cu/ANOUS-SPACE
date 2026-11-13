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
        backgroundColor: 'rgba(9, 10, 14, 0.78)',
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
          backgroundColor: '#161922',
          border: '1px solid #252A37',
          borderRadius: 10,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F3F4F6' }}>{title}</h3>
        {message && (
          <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
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
