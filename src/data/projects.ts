export type ProjectCategory = 'Tools' | 'Games' | 'Projects' | 'Private';

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  type: 'internal' | 'external';
  to?: string;
  externalUrl?: string;
  badge?: string;
  featured?: boolean;
  keywords?: string[];
}

export const PUBLIC_PROJECTS: ProjectItem[] = [
  {
    id: 'scratchpad',
    title: 'Quick Scratchpad & File Maker',
    description:
      'Persistent code and text scratchpad with JSON formatter/validator, file import, and instant multi-extension file export.',
    category: 'Tools',
    type: 'internal',
    to: '/scratchpad',
    badge: 'Utility',
    featured: true,
    keywords: ['notes', 'json', 'editor', 'download', 'file', 'env', 'code'],
  },
  {
    id: 'temp-mail',
    title: 'Temp-Mail Client',
    description:
      'Multi-provider disposable email workspace supporting Mail.TM, GuerrillaMail, TempMail.lol, and Maildrop.cc.',
    category: 'Tools',
    type: 'internal',
    to: '/temp-mail',
    badge: 'Network',
    keywords: ['email', 'inbox', 'disposable', 'mailtm', 'guerrilla', 'maildrop'],
  },
  {
    id: 'ecommerce-showcase',
    title: 'Full-Stack E-Commerce Platform',
    description:
      'Production storefront architecture featuring catalog filtering, cart state management, checkout pipeline, and order tracking.',
    category: 'Projects',
    type: 'external',
    externalUrl: 'https://github.com/ANAS-2004-Cu',
    badge: 'Showcase',
    featured: true,
    keywords: ['store', 'shop', 'commerce', 'web', 'portfolio', 'live demo'],
  },
  {
    id: 'guess-game',
    title: 'Number Guess (0–99)',
    description:
      'Range-finding numeric deduction game with 10 attempts, proximity telemetry, and attempt history.',
    category: 'Games',
    type: 'internal',
    to: '/guess-game',
    badge: 'Logic',
    keywords: ['number', 'guess', 'game1', 'puzzle'],
  },
  {
    id: 'tic-tac-toe',
    title: 'Classic Tic-Tac-Toe',
    description:
      'Standard 3×3 grid supporting single-player heuristic AI and two-player local pass-and-play with independent state.',
    category: 'Games',
    type: 'internal',
    to: '/tic-tac-toe',
    badge: 'Board',
    keywords: ['xo', 'tictactoe', 'game2', 'ai'],
  },
  {
    id: 'tic-tac-toe-3',
    title: 'Three-Marker Tic-Tac-Toe',
    description:
      'No-draw tactical variant where each player holds at most 3 active markers; placing a 4th removes the oldest marker.',
    category: 'Games',
    type: 'internal',
    to: '/tic-tac-toe-3',
    badge: 'Variant',
    keywords: ['xo', '3-marker', 'fifo', 'game3'],
  },
];
