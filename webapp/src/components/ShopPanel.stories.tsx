import { useEffect, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ShopPanel } from './ShopPanel';
import { NotificationContainer } from './notifications/NotificationContainer';
import { useCatalogStore } from '@/store/catalogStore';
import type { StarPack } from '@/services/starPacks';
import type { CosmeticItem } from '@/services/cosmetics';
import type { BoostHubItem } from '@/services/boosts';

const meta: Meta<typeof ShopPanel> = {
  title: 'Components/ShopPanel',
  component: ShopPanel,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ShopPanel>;

const demoStarPacks: StarPack[] = [
  {
    id: 'featured_premium',
    title: 'Supernova Bundle',
    description: 'Максимальный бонус Stars + эксклюзивный фрейм',
    stars: 7200,
    bonus_stars: 1800,
    price_rub: 2990,
    featured: true,
  },
  {
    id: 'starter_pack',
    title: 'Starter Orbit',
    description: 'Идеально для быстрого старта и апгрейда зданий',
    stars: 480,
    bonus_stars: 120,
    price_rub: 299,
  },
  {
    id: 'monthly_sub',
    title: 'Orbit Subscription',
    description: 'Ежемесячная подписка с автопродлением и +25% бонусом',
    stars: 2600,
    bonus_stars: 650,
    price_rub: 1290,
  },
];

const demoCosmetics: CosmeticItem[] = [
  {
    id: 'nebula_aura',
    name: 'Nebula Aura',
    description: 'Эффект тапа с неоновыми кольцами',
    category: 'tap_effect',
    rarity: 'epic',
    unlock_type: 'purchase',
    unlock_requirement: {},
    price_stars: 900,
    status: 'purchase_required',
    owned: false,
    equipped: false,
    preview_url: 'https://dummyimage.com/160x160/7c3aed/ffffff&text=N',
  },
  {
    id: 'solstice_skin',
    name: 'Solstice Planet Skin',
    description: 'Градиентное покрытие планеты с сиянием',
    category: 'planet_skin',
    rarity: 'rare',
    unlock_type: 'purchase',
    unlock_requirement: {},
    price_stars: 650,
    status: 'owned',
    owned: true,
    equipped: true,
    preview_url: 'https://dummyimage.com/160x160/2563eb/ffffff&text=S',
  },
  {
    id: 'lunar_frame',
    name: 'Lunar Frame',
    description: 'Аватар с лунным ореолом',
    category: 'avatar_frame',
    rarity: 'legendary',
    unlock_type: 'event',
    unlock_requirement: { level: 25 },
    price_stars: null,
    status: 'locked',
    owned: false,
    equipped: false,
    preview_url: 'https://dummyimage.com/160x160/f97316/ffffff&text=L',
  },
];

const demoBoosts: BoostHubItem[] = [
  {
    boost_type: 'daily_boost',
    multiplier: 2,
    duration_minutes: 60,
    cooldown_minutes: 180,
    requires_premium: false,
    active: null,
    cooldown_remaining_seconds: 0,
    available_at: new Date().toISOString(),
  },
  {
    boost_type: 'ad_boost',
    multiplier: 3,
    duration_minutes: 30,
    cooldown_minutes: 120,
    requires_premium: false,
    active: null,
    cooldown_remaining_seconds: 0,
    available_at: new Date().toISOString(),
  },
  {
    boost_type: 'premium_boost',
    multiplier: 4,
    duration_minutes: 90,
    cooldown_minutes: 360,
    requires_premium: true,
    active: null,
    cooldown_remaining_seconds: 0,
    available_at: new Date().toISOString(),
  },
];

const StoryViewport = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    useCatalogStore.setState(state => ({
      ...state,
      starPacks: demoStarPacks,
      starPacksLoaded: true,
      isStarPacksLoading: false,
      starPacksError: null,
      loadStarPacks: async () => {},
      purchaseStarPack: async () => {},
      cosmetics: demoCosmetics,
      cosmeticsLoaded: true,
      isCosmeticsLoading: false,
      cosmeticsError: null,
      loadCosmetics: async () => {},
      purchaseCosmetic: async () => {},
      equipCosmetic: async () => {},
      boostHub: demoBoosts,
      boostHubLoaded: true,
      isBoostHubLoading: false,
      boostHubError: null,
      loadBoostHub: async () => {},
      claimBoost: async () => {},
      boostHubTimeOffsetMs: 0,
    }));
  }, []);

  return (
    <div className="min-h-screen w-full bg-surface-primary p-6">
      {children}
      <NotificationContainer />
    </div>
  );
};

export const StarPacksShowcase: Story = {
  args: {
    showHeader: true,
    activeSection: 'star_packs',
  },
  render: args => (
    <StoryViewport>
      <ShopPanel {...args} />
    </StoryViewport>
  ),
};

export const CosmeticsShowcase: Story = {
  args: {
    showHeader: true,
    activeSection: 'cosmetics',
  },
  render: args => (
    <StoryViewport>
      <ShopPanel {...args} />
    </StoryViewport>
  ),
};

export const BoostsShowcase: Story = {
  args: {
    showHeader: true,
    activeSection: 'boosts',
  },
  render: args => (
    <StoryViewport>
      <ShopPanel {...args} />
    </StoryViewport>
  ),
};
