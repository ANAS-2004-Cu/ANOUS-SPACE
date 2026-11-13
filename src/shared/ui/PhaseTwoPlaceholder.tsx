import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Button } from './Button';

export interface PhaseTwoPlaceholderProps {
  title: string;
  description: string;
  onOpenCommandPalette: () => void;
}

export const PhaseTwoPlaceholder: React.FC<PhaseTwoPlaceholderProps> = ({
  title,
  description,
  onOpenCommandPalette,
}) => {
  const navigate = useNavigate();

  return (
    <div className="workspace-shell">
      <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle={title} />
      <main style={{ flex: 1, display: 'flex', alignItems: 'flex-start', paddingTop: 12 }}>
        <div
          style={{
            width: '100%',
            backgroundColor: '#161922',
            border: '1px solid #252A37',
            borderRadius: 10,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <span
            className="mono"
            style={{
              alignSelf: 'flex-start',
              fontSize: 11,
              color: '#9CA3AF',
              backgroundColor: '#0E1015',
              border: '1px solid #252A37',
              borderRadius: 4,
              padding: '2px 8px',
            }}
          >
            Scheduled for Phase 2 Migration
          </span>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: '#F3F4F6' }}>{title}</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5, maxWidth: 560 }}>
            {description}
          </p>
          <div style={{ marginTop: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
              Return to Hub
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
