import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { TapScreen } from '@/screens/TapScreen';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { useCatalogStore } from '@/store/catalogStore';
import { useExperimentsStore } from '@/store/experimentsStore';
import { friendsLeaderboardMock, friendsProfileMock } from './friendsScreen';
import type { StarPack } from '@/services/starPacks';
import type { BoostHubItem } from '@/services/boosts';
import type { BuildingDefinition } from '@/services/buildings';
import type { CosmeticItem } from '@/services/cosmetics';
import type { AchievementView } from '@/services/achievements';
import '@/index.css';

const starPacksMock: StarPack[] = [
  {
    id: 'starter-pack',
    title: 'Стартовый набор',
    description: '500 ⭐ + 50 бонусных',
    stars: 500,
    bonus_stars: 50,
    price_rub: 199,
    featured: true,
  },
  {
    id: 'pro-pack',
    title: 'Пак профессионала',
    description: '1 500 ⭐ + 300 бонусных',
    stars: 1_500,
    bonus_stars: 300,
    price_rub: 599,
  },
  {
    id: 'weekly-subscription',
    title: 'Еженедельная подписка',
    description: '+250 ⭐ каждый день',
    stars: 0,
    bonus_stars: 0,
    price_rub: 349,
    telegram_product_id: 'weekly_subscription',
  },
];

const boostHubMock: BoostHubItem[] = [
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
    multiplier: 1.5,
    duration_minutes: 30,
    cooldown_minutes: 120,
    requires_premium: false,
    active: null,
    cooldown_remaining_seconds: 1800,
    available_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  },
  {
    boost_type: 'premium_boost',
    multiplier: 3,
    duration_minutes: 90,
    cooldown_minutes: 360,
    requires_premium: true,
    active: {
      id: 'premium_active',
      expires_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      remaining_seconds: 45 * 60,
    },
    cooldown_remaining_seconds: 0,
    available_at: new Date().toISOString(),
  },
];

const buildingCatalogMock: BuildingDefinition[] = [
  {
    id: 'solar-array',
    name: 'Солнечная ферма',
    description: 'Стабильный источник пассивного дохода',
    tier: 1,
    base_income: 120,
    base_cost: 5_000,
    cost_multiplier: 1.12,
    upgrade_cost_multiplier: 1.3,
    upgrade_income_bonus: 45,
    upgrade_soft_cap_level: 25,
    upgrade_post_soft_cap_multiplier: 1.05,
    unlock_level: 1,
    max_count: null,
    category: 'energy',
    rarity: 'common',
    payback_seconds: 400,
    roi_rank: 2,
  },
  {
    id: 'fusion-reactor',
    name: 'Термоядерный реактор',
    description: 'Энергия будущего',
    tier: 3,
    base_income: 950,
    base_cost: 45_000,
    cost_multiplier: 1.18,
    upgrade_cost_multiplier: 1.4,
    upgrade_income_bonus: 320,
    upgrade_soft_cap_level: 15,
    upgrade_post_soft_cap_multiplier: 1.08,
    unlock_level: 20,
    max_count: null,
    category: 'advanced',
    rarity: 'rare',
    payback_seconds: 512,
    roi_rank: 1,
  },
  {
    id: 'quantum-lab',
    name: 'Квантовая лаборатория',
    description: 'Исследования, ускоряющие пассивный доход',
    tier: 4,
    base_income: 1_500,
    base_cost: 80_000,
    cost_multiplier: 1.22,
    upgrade_cost_multiplier: 1.5,
    upgrade_income_bonus: 520,
    upgrade_soft_cap_level: 10,
    upgrade_post_soft_cap_multiplier: 1.1,
    unlock_level: 28,
    max_count: null,
    category: 'advanced',
    rarity: 'epic',
    payback_seconds: 620,
    roi_rank: 3,
  },
];

const cosmeticsMock: CosmeticItem[] = [
  {
    id: 'aurora-skin',
    name: 'Скин «Аврора»',
    description: 'Мягкие северные сияния для вашей планеты',
    category: 'planet_skin',
    rarity: 'rare',
    unlock_type: 'purchase',
    unlock_requirement: { price_stars: 400 },
    owned: false,
    equipped: false,
    status: 'purchase_required',
    price_stars: 400,
    asset_url: '',
    preview_url: '',
  },
  {
    id: 'ion-trail',
    name: 'След ионов',
    description: 'Яркий трейл для тап-эффектов',
    category: 'tap_effect',
    rarity: 'epic',
    unlock_type: 'level',
    unlock_requirement: { level: 30 },
    owned: true,
    equipped: true,
    status: 'owned',
    price_stars: null,
    asset_url: '',
    preview_url: '',
  },
];

const achievementsMock: AchievementView[] = [
  {
    slug: 'tap_master',
    name: 'Мастер тапов',
    description: 'Совершите 1 500 тапов',
    category: 'progress',
    icon: null,
    metric: 'taps',
    unit: 'tap',
    maxTier: 5,
    currentTier: 3,
    highestUnlockedTier: 4,
    progressValue: 1_200,
    nextThreshold: 1_500,
    progressRatio: 0.8,
    claimableTier: 4,
    claimedMultiplier: 1.06,
    pendingMultiplier: 0.04,
    tiers: [
      {
        id: 'tap_master_t1',
        tier: 1,
        threshold: 100,
        rewardMultiplier: 1.01,
        title: 'Новичок',
        rewardSummary: '+1% к доходу',
        earned: true,
        claimable: false,
      },
      {
        id: 'tap_master_t4',
        tier: 4,
        threshold: 1_500,
        rewardMultiplier: 1.04,
        title: 'Мастер',
        rewardSummary: '+4% к доходу',
        earned: false,
        claimable: true,
      },
    ],
  },
  {
    slug: 'boost_collector',
    name: 'Охотник за бустами',
    description: 'Активируйте 25 бустов',
    category: 'boosts',
    icon: null,
    metric: 'boosts',
    unit: 'boost',
    maxTier: 4,
    currentTier: 2,
    highestUnlockedTier: 3,
    progressValue: 18,
    nextThreshold: 25,
    progressRatio: 0.72,
    claimableTier: null,
    claimedMultiplier: 1.02,
    pendingMultiplier: 0.0,
    tiers: [
      {
        id: 'boost_collector_t1',
        tier: 1,
        threshold: 5,
        rewardMultiplier: 1.01,
        title: 'Активатор',
        rewardSummary: '+1% к пассиву',
        earned: true,
        claimable: false,
      },
      {
        id: 'boost_collector_t3',
        tier: 3,
        threshold: 25,
        rewardMultiplier: 1.03,
        title: 'Коллекционер',
        rewardSummary: '+3% к пассиву',
        earned: false,
        claimable: false,
      },
    ],
  },
];

const buildingsMock = [
  {
    buildingId: 'solar-array',
    name: 'Солнечная ферма',
    count: 12,
    level: 18,
    incomePerSec: 480,
    nextCost: 12_000,
    nextUpgradeCost: 18_000,
  },
  {
    buildingId: 'fusion-reactor',
    name: 'Термоядерный реактор',
    count: 4,
    level: 9,
    incomePerSec: 950,
    nextCost: 48_000,
    nextUpgradeCost: 65_000,
  },
];

let initialized = false;

export function ensureTapPreviewState(theme: 'light' | 'dark') {
  if (!initialized) {
    initialized = true;

    useAuthStore.setState({
      accessToken: 'preview-token',
      refreshToken: 'preview-refresh',
      refreshExpiresAt: Date.now() + 3600 * 1000,
      hydrated: true,
      authReady: true,
      bootstrapping: false,
      bootstrapNonce: 0,
    });

    useCatalogStore.setState(state => ({
      ...state,
      buildingCatalog: buildingCatalogMock,
      buildingCatalogLoaded: true,
      isBuildingCatalogLoading: false,
      starPacks: starPacksMock,
      starPacksLoaded: true,
      isStarPacksLoading: false,
      starPacksError: null,
      cosmetics: cosmeticsMock,
      cosmeticsLoaded: true,
      isCosmeticsLoading: false,
      cosmeticsError: null,
      boostHub: boostHubMock,
      boostHubLoaded: true,
      isBoostHubLoading: false,
      boostHubError: null,
      boostHubTimeOffsetMs: -2_000,
      loadStarPacks: async () => Promise.resolve(),
      purchaseStarPack: async () => Promise.resolve(),
      loadCosmetics: async () => Promise.resolve(),
      purchaseCosmetic: async () => Promise.resolve(),
      equipCosmetic: async () => Promise.resolve(),
      loadBuildingCatalog: async () => Promise.resolve(),
      loadBoostHub: async () => Promise.resolve(),
      claimBoost: async () => Promise.resolve(),
    }));

    useGameStore.setState({
      tap: async () => Promise.resolve(),
      resetStreak: () => undefined,
      loadLeaderboard: async () => Promise.resolve(),
      loadPrestigeStatus: async () => Promise.resolve(),
      performPrestige: async () => Promise.resolve(),
      loadAchievements: async () => Promise.resolve(),
      claimAchievement: async () => Promise.resolve(),
      purchaseBuilding: async () => Promise.resolve(),
      upgradeBuilding: async () => Promise.resolve(),
    });
  }

  useAuthStore.setState({
    authReady: true,
    hydrated: true,
  });

  useExperimentsStore.setState(state => ({
    variants: {
      ...state.variants,
      palette_v1: theme === 'light' ? 'classic' : 'dual-accent',
    },
  }));

  useGameStore.setState({
    userId: 'user-1',
    username: 'designer',
    isAdmin: false,
    level: friendsProfileMock.progress.level,
    xp: friendsProfileMock.progress.xp,
    xpIntoLevel: friendsProfileMock.progress.xp_into_level,
    xpToNextLevel: friendsProfileMock.progress.xp_to_next_level,
    tapLevel: friendsProfileMock.progress.tap_level,
    tapIncome: friendsProfileMock.progress.tap_income,
    energy: friendsProfileMock.progress.energy,
    stars: 3_200,
    passiveIncomePerSec: friendsProfileMock.progress.passive_income_per_sec,
    passiveIncomeMultiplier: friendsProfileMock.progress.passive_income_multiplier,
    boostMultiplier: friendsProfileMock.progress.boost_multiplier,
    prestigeMultiplier: friendsProfileMock.progress.prestige_multiplier,
    achievementMultiplier: 1.08,
    prestigeLevel: friendsProfileMock.progress.prestige_level,
    prestigeEnergySinceReset: friendsProfileMock.progress.prestige_energy_since_reset,
    prestigeLastReset: friendsProfileMock.progress.prestige_last_reset,
    prestigeNextThreshold: 24_000,
    prestigeEnergyToNext: 6_000,
    prestigeGainAvailable: 0.15,
    isPrestigeAvailable: true,
    isPrestigeLoading: false,
    prestigeStatusLoaded: true,
    streakCount: 24,
    bestStreak: 120,
    isCriticalStreak: false,
    lastTapAt: Date.now() - 2_000,
    pendingPassiveEnergy: 0,
    pendingPassiveSeconds: 0,
    buildings: buildingsMock,
    buildingsError: null,
    isProcessingBuildingId: null,
    leaderboardEntries: friendsLeaderboardMock,
    leaderboardLoaded: true,
    isLeaderboardLoading: false,
    leaderboardError: null,
    leaderboardTotal: 128,
    userLeaderboardEntry: friendsLeaderboardMock[1],
    profile: friendsProfileMock,
    profileBoosts: [],
    isProfileLoading: false,
    profileError: null,
    achievements: achievementsMock,
    achievementsLoaded: true,
    achievementsLoading: false,
    achievementsError: null,
    claimingAchievementSlug: null,
    isLoading: false,
    isInitialized: true,
  });
}

export function renderTapPreview(container: HTMLElement, params: URLSearchParams) {
  const themeParam = params.get('theme');
  const theme: 'light' | 'dark' = themeParam === 'light' ? 'light' : 'dark';

  ensureTapPreviewState(theme);

  document.documentElement.dataset.previewTheme = theme;
  document.documentElement.style.colorScheme = theme;
  document.body.style.background = 'var(--color-bg-primary)';

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <MemoryRouter initialEntries={['/']}>
        <div
          data-testid="tap-preview-root"
          className="min-h-screen w-full bg-surface-primary px-4 py-6 text-text-primary"
        >
          <TapScreen />
        </div>
      </MemoryRouter>
    </StrictMode>
  );
}
