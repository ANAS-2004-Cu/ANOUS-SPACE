import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

export interface DomainSelectModalProps {
  visible: boolean;
  domains: string[];
  selectedDomain: string;
  onSelect: (domain: string) => void;
  onClose: () => void;
}

export const DomainSelectModal: React.FC<DomainSelectModalProps> = ({
  visible,
  domains,
  selectedDomain,
  onSelect,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 10, 14, 0.78)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        zIndex: 1100,
      }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          width: '100%',
          maxWidth: 420,
          maxHeight: '72vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Select Domain
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ color: 'var(--text-secondary)', display: 'inline-flex', padding: 4 }}
            aria-label="Close modal"
          >
            <FiX size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: 6 }}>
          {domains.map((item, index) => {
            const isSelected = selectedDomain === item;
            return (
              <button
                key={`${item}-${index}`}
                type="button"
                onClick={() => onSelect(item)}
                className="mono"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 6,
                  backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 13,
                  textAlign: 'left',
                }}
              >
                <span>@{item}</span>
                {isSelected && <FiCheck size={15} strokeWidth={1.5} color="var(--accent)" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
