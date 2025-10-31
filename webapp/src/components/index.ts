/**
 * Energy Planet Component Library Exports
 *
 * All reusable components are centralized here for easy imports.
 * Usage: import { Button, Card, Badge } from '@/components'
 */

// Core UI Components
export { Button, type ButtonProps } from './Button';
export { Card, type CardProps } from './Card';
export { Input, type InputProps } from './Input';
export { Badge, type BadgeProps } from './Badge';
export { OptimizedImage, type OptimizedImageProps } from './OptimizedImage';
export { ModalBase, type ModalBaseProps, type ModalAction } from './ModalBase';
export { StatCard, type StatCardProps } from './StatCard';

// Layout & Navigation
export { ScreenTransition } from './ScreenTransition';
export { TabPageSurface } from './layout/TabPageSurface';
export { AppLayout } from './layout/AppLayout';
export {
  BottomNavigation,
  type BottomNavigationTab,
  type BottomNavigationTabId,
} from './layout/BottomNavigation';

// Panels (Feature-specific)
export { BuildingCard, type BuildingCardProps } from './BuildingCard';
export { BuildingsPanel } from './BuildingsPanel';
export { ShopPanel } from './ShopPanel';
export { ProfilePanel } from './ProfilePanel';
export { BoostHub } from './BoostHub';
export { LeaderboardPanel } from './LeaderboardPanel';
export { ClanComingSoon } from './ClanComingSoon';
export { ProfileSettingsScreen } from './ProfileSettingsScreen';

// Notifications & Feedback
export { NotificationContainer } from './notifications/NotificationContainer';
export { Toast } from './notifications/Toast';
export { Alert } from './notifications/Alert';
export { Achievement } from './notifications/Achievement';

// Animations
export { TapParticles } from './animations/TapParticles';
export { Confetti } from './animations/Confetti';
export { CheckmarkAnimation } from './animations/CheckmarkAnimation';
export { AnimationWrapper } from './animations/AnimationWrapper';

// Skeletons (Loading states)
export { Skeleton } from './skeletons/Skeleton';
export { BuildingSkeleton } from './skeletons/BuildingSkeleton';
export { ShopSkeleton } from './skeletons/ShopSkeleton';
export { ProfileSkeleton } from './skeletons/ProfileSkeleton';
export { LeaderboardSkeleton } from './skeletons/LeaderboardSkeleton';

// Tap
export { TapCircle } from './tap/TapCircle';
export { StatsSummary } from './tap/StatsSummary';
export { DailyTasksBar } from './tap/DailyTasksBar';

// Friends
export { FriendsList } from './friends/FriendsList';

// Earn
export { EarnTasksBoard } from './earn/EarnTasksBoard';

// Airdrop
export { AirdropTimeline } from './airdrop/AirdropTimeline';

// Modals
export { AuthErrorModal } from './AuthErrorModal';
export { OfflineSummaryModal } from './OfflineSummaryModal';
export { PurchaseSuccessModal } from './PurchaseSuccessModal';
export { LevelUpScreen } from './LevelUpScreen';
export { AchievementsModal } from './AchievementsModal';

// Settings
export { SettingsSection } from './settings/SettingsSection';
export { Toggle } from './settings/Toggle';
export { SliderControl } from './settings/SliderControl';
export { SettingsScreen } from './settings/SettingsScreen';

// Utilities
export { AnimatedNumber } from './AnimatedNumber';
export { ErrorBoundary } from './ErrorBoundary';
export { ProgressBar } from './ui/ProgressBar';
export { Text } from './ui/Text';
