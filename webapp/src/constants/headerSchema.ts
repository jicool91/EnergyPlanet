import type { ReactNode } from 'react';
import type { BottomNavigationTabId } from '@/components/layout/BottomNavigation';

type AppRouteBase =
  | '/'
  | '/shop'
  | '/exchange'
  | '/friends'
  | '/earn'
  | '/chat'
  | '/events'
  | '/profile';
export type AppRoute = AppRouteBase | `${AppRouteBase}?${string}`;

type HeaderLayout = 'tap-status' | 'simple' | 'none';

type HeaderActionVariant = 'primary' | 'secondary';

export interface HeaderActionConfig {
  id: string;
  label: string;
  target: AppRoute;
  variant?: HeaderActionVariant;
  replace?: boolean;
  icon?: ReactNode;
}

export interface HeaderSchema {
  id: BottomNavigationTabId | 'profile';
  title: string;
  layout: HeaderLayout;
  actions?: HeaderActionConfig[];
}

const tapActions: HeaderActionConfig[] = [
  {
    id: 'shop',
    label: 'Магазин',
    target: '/shop?section=star_packs',
    variant: 'primary',
    icon: '🛒',
  },
  {
    id: 'profile',
    label: 'Профиль',
    target: '/profile',
    variant: 'secondary',
    icon: '⚙️',
  },
];

export const NAVIGATION_HEADER_SCHEMAS: Record<BottomNavigationTabId, HeaderSchema> = {
  tap: {
    id: 'tap',
    title: 'Tap',
    layout: 'tap-status',
    actions: tapActions,
  },
  shop: {
    id: 'shop',
    title: 'Shop',
    layout: 'none',
  },
  friends: {
    id: 'friends',
    title: 'Friends',
    layout: 'none',
  },
  earn: {
    id: 'earn',
    title: 'Earn',
    layout: 'none',
  },
  chat: {
    id: 'chat',
    title: 'Chat',
    layout: 'none',
  },
};

const PROFILE_HEADER_SCHEMA: HeaderSchema = {
  id: 'profile',
  title: 'Профиль',
  layout: 'none',
};

export function getHeaderSchema(
  tab: BottomNavigationTabId,
  options?: { pathname?: string }
): HeaderSchema {
  if (options?.pathname === '/profile') {
    return PROFILE_HEADER_SCHEMA;
  }
  return NAVIGATION_HEADER_SCHEMAS[tab] ?? NAVIGATION_HEADER_SCHEMAS.tap;
}
