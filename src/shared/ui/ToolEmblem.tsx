import React from 'react';

export type ToolAccent = 'terracotta' | 'slate' | 'ochre' | 'sage';

export function getToolAccent(id: string): ToolAccent {
  switch (id) {
    case 'scratchpad':
    case 'temp-mail':
      return 'slate';
    case 'tic-tac-toe':
    case 'guess-game':
      return 'ochre';
    case 'gameya-calculator':
    case 'gameya-calc':
      return 'sage';
    default:
      return 'terracotta';
  }
}

export interface ToolEmblemProps {
  id: string;
  size?: number;
}

export const ToolEmblem: React.FC<ToolEmblemProps> = ({ id, size = 18 }) => {
  switch (id) {
    case 'scratchpad':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect
            x="3.5"
            y="4.5"
            width="17"
            height="15"
            rx="3.5"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M9 9.5L6.5 12L9 14.5M15 9.5L17.5 12L15 14.5M13 8.5L11 15.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'temp-mail':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect
            x="3"
            y="5.5"
            width="18"
            height="13"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M4.5 7.5L12 13L19.5 7.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="18.5" cy="5.5" r="2.2" fill="currentColor" />
        </svg>
      );

    case 'tic-tac-toe':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9.5 3.5V20.5M14.5 3.5V20.5M3.5 9.5H20.5M3.5 14.5H20.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M5 5L7.6 7.6M7.6 5L5 7.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="17.8" cy="17.8" r="1.8" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );

    case 'guess-game':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect
            x="3.5"
            y="4.5"
            width="17"
            height="15"
            rx="3.5"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M8.5 14.5L11.5 9.5L14.5 14.5M16 10.5L17.5 9L19 10.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 16.5H17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      );

    case 'gameya-calculator':
    case 'gameya-calc':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="13.5" width="3.5" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.65" />
          <rect x="10.25" y="10" width="3.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.65" />
          <rect x="16.5" y="5.5" width="3.5" height="14.5" rx="1" stroke="currentColor" strokeWidth="1.65" />
          <path
            d="M4.5 9.5L11 6L18.5 3.5"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'ecommerce-showcase':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M4 7.5L12 12L20 7.5M12 12V21"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            opacity="0.7"
          />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="7" height="7" rx="1.8" stroke="currentColor" strokeWidth="1.75" />
          <rect x="13" y="4" width="7" height="7" rx="1.8" stroke="currentColor" strokeWidth="1.75" opacity="0.65" />
          <rect x="4" y="13" width="7" height="7" rx="1.8" stroke="currentColor" strokeWidth="1.75" opacity="0.65" />
          <rect x="13" y="13" width="7" height="7" rx="1.8" fill="currentColor" opacity="0.85" />
        </svg>
      );
  }
};

export const HeroGeometry: React.FC = () => (
  <svg
    className="hub-hero__geometry"
    viewBox="0 0 204 122"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="22"
      y="20"
      width="44"
      height="44"
      rx="10"
      stroke="var(--border-strong)"
      strokeWidth="1.2"
      fill="var(--bg-recessed)"
    />
    <rect
      x="76"
      y="14"
      width="50"
      height="50"
      rx="12"
      stroke="var(--accent-border)"
      strokeWidth="1.3"
      fill="var(--accent-subtle)"
    />
    <rect
      x="136"
      y="24"
      width="42"
      height="42"
      rx="10"
      stroke="var(--border-strong)"
      strokeWidth="1.2"
      fill="var(--bg-recessed)"
    />
    <rect
      x="46"
      y="74"
      width="52"
      height="32"
      rx="8"
      stroke="var(--tone-sage-border)"
      strokeWidth="1.2"
      fill="var(--tone-sage-subtle)"
    />
    <rect
      x="108"
      y="74"
      width="46"
      height="32"
      rx="8"
      stroke="var(--tone-slate-border)"
      strokeWidth="1.2"
      fill="var(--tone-slate-subtle)"
    />
    <path
      d="M93 39L101 31L109 39L101 47Z"
      stroke="var(--accent)"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="44" cy="42" r="5" stroke="var(--text-muted)" strokeWidth="1.4" />
    <path d="M151 45H163M157 39V51" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
