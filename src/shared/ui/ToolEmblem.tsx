import React from 'react';

export type ToolAccent = 'cobalt' | 'cyan' | 'violet' | 'amber' | 'emerald' | 'indigo';

export function getToolAccent(id: string): ToolAccent {
  switch (id) {
    case 'scratchpad':
      return 'cyan';
    case 'temp-mail':
      return 'violet';
    case 'tic-tac-toe':
    case 'guess-game':
      return 'amber';
    case 'gameya-calculator':
      return 'emerald';
    case 'ecommerce-showcase':
      return 'indigo';
    default:
      return 'cobalt';
  }
}

export interface ToolEmblemProps {
  id: string;
  size?: number;
}

export const ToolEmblem: React.FC<ToolEmblemProps> = ({ id, size = 18 }) => {
  switch (id) {
    case 'scratchpad':
      // Geometric bracketed code prism
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
      // Layered signal envelope with node arc
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
      // 3x3 intersecting tactical grid with X and O nodes
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
      // Concentric radar target arcs
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" opacity="0.45" />
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          <path
            d="M12 2.5V5M12 19V21.5M2.5 12H5M19 12H21.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'gameya-calculator':
      // Ascending compound ledger bars + trajectory arc
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
      // Isometric orbital prism / storefront lattice
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
      // Default geometric module cube
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

export const GeometricCardDecor: React.FC = () => (
  <svg
    className="workspace-card__decor"
    viewBox="0 0 120 120"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="96" cy="24" r="34" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
    <circle cx="96" cy="24" r="18" stroke="currentColor" strokeWidth="1" />
    <path d="M84 12H108V36" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
    <circle cx="96" cy="24" r="2.5" fill="currentColor" />
  </svg>
);

export const HeroGeometry: React.FC = () => (
  <svg
    className="hub-hero__geometry"
    viewBox="0 0 220 140"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="heroOrbGrad" x1="0" y1="0" x2="220" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.85" />
        <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.25" />
      </linearGradient>
    </defs>
    {/* Subtle coordinate crosshair frame */}
    <path d="M18 22H30M24 16V28" stroke="var(--accent)" strokeWidth="1.2" strokeOpacity="0.55" />
    <path d="M190 118H202M196 112V124" stroke="var(--accent-secondary)" strokeWidth="1.2" strokeOpacity="0.55" />
    {/* Concentric orbital geometry */}
    <circle cx="122" cy="70" r="56" stroke="url(#heroOrbGrad)" strokeWidth="1.2" strokeDasharray="4 5" />
    <circle cx="122" cy="70" r="38" stroke="url(#heroOrbGrad)" strokeWidth="1.25" />
    <circle cx="122" cy="70" r="18" stroke="var(--accent)" strokeWidth="1.2" strokeOpacity="0.5" />
    {/* Geometric polygon lattice */}
    <polygon
      points="122,34 153,52 153,88 122,106 91,88 91,52"
      stroke="var(--accent)"
      strokeWidth="1.1"
      strokeOpacity="0.45"
      fill="var(--accent-subtle)"
      fillOpacity="0.35"
    />
    {/* Accent nodes */}
    <circle cx="122" cy="34" r="3" fill="var(--accent)" />
    <circle cx="153" cy="88" r="2.5" fill="var(--accent-secondary)" />
    <circle cx="91" cy="88" r="2.5" fill="var(--cat-cyan-accent)" />
    <circle cx="122" cy="70" r="4" fill="var(--accent)" />
  </svg>
);
