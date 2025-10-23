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
export { ModalBase, type ModalBaseProps, type ModalAction } from './ModalBase';
export { StatCard, type StatCardProps } from './StatCard';

// Layout & Navigation
export { ScreenTransition } from './ScreenTransition';
export { TabBar, type TabBarItem } from './TabBar';
export { MainScreenHeader } from './MainScreenHeader';
export { TapSection } from './TapSection';

// Panels (Feature-specific)
export { BuildingCard, type BuildingCardProps } from './BuildingCard';
export { BuildingsPanel } from './BuildingsPanel';
export { HomePanel, type HomePanelProps } from './HomePanel';
export { ShopPanel } from './ShopPanel';
export { ProfilePanel } from './ProfilePanel';
export { BoostHub } from './BoostHub';
export { LeaderboardPanel } from './LeaderboardPanel';

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

// Modals
export { AuthErrorModal } from './AuthErrorModal';
export { OfflineSummaryModal } from './OfflineSummaryModal';
export { PurchaseSuccessModal } from './PurchaseSuccessModal';
export { LevelUpScreen } from './LevelUpScreen';

// Settings
export { SettingsSection } from './settings/SettingsSection';
export { Toggle } from './settings/Toggle';
export { SliderControl } from './settings/SliderControl';
export { SettingsScreen } from './settings/SettingsScreen';

// Utilities
export { AnimatedNumber } from './AnimatedNumber';
export { ErrorBoundary } from './ErrorBoundary';
