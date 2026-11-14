import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { Modal } from '../../../shared/ui/Modal';

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
  return (
    <Modal open={visible} onClose={onClose} title="Select Domain">
      <div className="domain-modal-list">
        {domains.length === 0 ? (
          <div className="ui-section-subtitle" style={{ padding: '14px 12px' }}>
            No domains available right now.
          </div>
        ) : (
          domains.map((item, index) => {
            const isSelected = selectedDomain === item;
            return (
              <button
                key={`${item}-${index}`}
                type="button"
                onClick={() => onSelect(item)}
                className="cmd-item"
                data-active={isSelected}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 13,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  @{item}
                </span>
                {isSelected && <FiCheck size={15} strokeWidth={1.6} color="var(--accent)" />}
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
};
