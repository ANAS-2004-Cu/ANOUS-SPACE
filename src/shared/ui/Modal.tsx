import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  wide?: boolean;
  alignTop?: boolean;
  showHeader?: boolean;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  wide = false,
  alignTop = false,
  showHeader = true,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={['ui-modal-backdrop', alignTop ? 'ui-modal-backdrop--top' : '']
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={['ui-modal-panel', wide ? 'ui-modal-panel--wide' : '']
          .filter(Boolean)
          .join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && (
          <div className="ui-modal-header">
            <div className="ui-modal-title">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="icon-btn"
              style={{ width: 28, height: 28 }}
              aria-label="Close modal"
            >
              <FiX size={15} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
