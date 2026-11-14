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
  stack?: string[];
  keywords?: string[];
}

export const PUBLIC_PROJECTS: ProjectItem[] = [
  {
    id: 'scratchpad',
    title: 'Quick Scratchpad & File Maker',
    description:
      'Persistent text and code pad with JSON formatting/validation, file import, and instant multi-extension export.',
    category: 'Tools',
    type: 'internal',
    to: '/scratchpad',
    badge: 'Utility',
    featured: false,
    keywords: ['notes', 'json', 'editor', 'download', 'file', 'env', 'code'],
  },
  {
    id: 'temp-mail',
    title: 'Temp-Mail Client',
    description:
      'Disposable email client across 10 live providers: Mail.tm, GrabMail, Catchmail.io, Temp-Mail.io, Inboxes.com, Tempmail.lol, TempMail.Plus, DropMail.me, Maildrop.cc, and Guerrilla Mail.',
    category: 'Tools',
    type: 'internal',
    to: '/temp-mail',
    badge: 'Email · 10 APIs',
    featured: false,
    keywords: [
      'email',
      'inbox',
      'disposable',
      'mailtm',
      'grabmail',
      'catchmail',
      'temp-mail.io',
      'tempmailio',
      'inboxes',
      'tempmail.lol',
      'tempmail.plus',
      'dropmail',
      'maildrop',
      'guerrilla',
    ],
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe (Classic & 3-Marker)',
    description:
      'Classic 3×3 grid and no-draw 3-Marker mode (max 3 pieces per player) with single-player AI and pass-and-play.',
    category: 'Games',
    type: 'internal',
    to: '/tic-tac-toe',
    badge: 'Board',
    featured: false,
    keywords: ['xo', 'tictactoe', '3-marker', 'fifo', 'ai', 'game2', 'game3'],
  },
  {
    id: 'guess-game',
    title: 'Number Guess (0–99)',
    description:
      'Guess a hidden number from 0 to 99 within 10 tries using higher/lower hints and live range tracking.',
    category: 'Games',
    type: 'internal',
    to: '/guess-game',
    badge: 'Puzzle',
    featured: false,
    keywords: ['number', 'guess', 'game1', 'puzzle'],
  },
  {
    id: 'ecommerce-showcase',
    title: 'Full-Stack E-Commerce Platform',
    description:
      'Full-stack storefront featuring catalog filtering, cart state management, checkout flow, and order tracking.',
    category: 'Projects',
    type: 'external',
    externalUrl: 'https://github.com/ANAS-2004-Cu',
    badge: 'Showcase',
    featured: true,
    stack: ['React', 'TypeScript', 'REST API', 'Cart & Checkout'],
    keywords: ['store', 'shop', 'commerce', 'web', 'portfolio', 'live demo'],
  },
];
