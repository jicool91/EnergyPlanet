import type { BottomNavigationTabId } from '@/components/layout/BottomNavigation';

type HeaderLayout = 'tap-status' | 'simple';

type HeaderActionVariant = 'primary' | 'secondary';

export interface HeaderActionConfig {
  id: string;
  label: string;
  target: string;
  variant?: HeaderActionVariant;
  replace?: boolean;
}

export interface HeaderSchema {
  id: BottomNavigationTabId;
  title: string;
  layout: HeaderLayout;
  actions?: HeaderActionConfig[];
}

const tapActions: HeaderActionConfig[] = [
  {
    id: 'shop',
    label: 'Магазин',
    target: '/exchange?section=star_packs',
    variant: 'primary',
  },
  {
    id: 'profile',
    label: 'Профиль',
    target: '/earn',
    variant: 'secondary',
  },
];

const SIMPLE_RETURN_ACTION: HeaderActionConfig = {
  id: 'return-tap',
  label: 'На Tap',
  target: '/',
  variant: 'secondary',
};

export const NAVIGATION_HEADER_SCHEMAS: Record<BottomNavigationTabId, HeaderSchema> = {
  tap: {
    id: 'tap',
    title: 'Tap',
    layout: 'tap-status',
    actions: tapActions,
  },
  exchange: {
    id: 'exchange',
    title: 'Exchange',
    layout: 'simple',
    actions: [SIMPLE_RETURN_ACTION],
  },
  friends: {
    id: 'friends',
    title: 'Friends',
    layout: 'simple',
    actions: [SIMPLE_RETURN_ACTION],
  },
  earn: {
    id: 'earn',
    title: 'Earn',
    layout: 'simple',
    actions: [SIMPLE_RETURN_ACTION],
  },
  chat: {
    id: 'chat',
    title: 'Chat',
    layout: 'simple',
    actions: [SIMPLE_RETURN_ACTION],
  },
};

export function getHeaderSchema(tab: BottomNavigationTabId): HeaderSchema {
  return NAVIGATION_HEADER_SCHEMAS[tab] ?? NAVIGATION_HEADER_SCHEMAS.tap;
}
