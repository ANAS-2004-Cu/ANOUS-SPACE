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
      'Persistent code and text scratchpad with JSON formatter/validator, file import, and instant multi-extension file export.',
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
      'Multi-provider disposable email workspace supporting Mail.TM, Mail.gw, GuerrillaMail, TempMail.lol, Maildrop.cc, Inboxes.com, and TempMail.Plus.',
    category: 'Tools',
    type: 'internal',
    to: '/temp-mail',
    badge: 'Network',
    featured: false,
    keywords: [
      'email',
      'inbox',
      'disposable',
      'mailtm',
      'mailgw',
      'guerrilla',
      'maildrop',
      'inboxes',
      'tempmail.plus',
    ],
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe (Classic & 3-Marker)',
    description:
      'Standard 3×3 grid and no-draw FIFO 3-marker tactical variant with single-player AI and two-player pass-and-play.',
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
      'Range-finding numeric deduction game with 10 attempts, proximity telemetry within 10 units, and attempt history.',
    category: 'Games',
    type: 'internal',
    to: '/guess-game',
    badge: 'Logic',
    featured: false,
    keywords: ['number', 'guess', 'game1', 'puzzle'],
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
    stack: ['React', 'TypeScript', 'REST API', 'Cart & Checkout'],
    keywords: ['store', 'shop', 'commerce', 'web', 'portfolio', 'live demo'],
  },
];
