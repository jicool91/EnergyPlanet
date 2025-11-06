import type { Meta, StoryObj } from '@storybook/react';
import { PurchaseSuccessModal } from './PurchaseSuccessModal';

const meta: Meta<typeof PurchaseSuccessModal> = {
  title: 'Components/PurchaseSuccessModal',
  component: PurchaseSuccessModal,
  args: {
    isOpen: true,
    autoClose: false,
    onDismiss: () => {},
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: 'var(--color-bg-primary)' },
        { name: 'light', value: '#fafafa' },
      ],
    },
  },
};

export default meta;

type Story = StoryObj<typeof PurchaseSuccessModal>;

export const StandardRu: Story = {
  args: {
    itemName: 'Пак Stars 2 000',
    quantity: 2,
    cost: 1990,
    costCurrency: 'RUB',
    locale: 'ru',
  },
};

export const PremiumBundle: Story = {
  args: {
    itemName: 'Premium Stars Pack',
    variant: 'premium',
    locale: 'ru',
    cost: 2990,
    costCurrency: 'RUB',
    rewards: [
      { label: 'Бонус', value: '+5% к пассивному доходу', icon: '✨', tone: 'accent' },
      { label: 'Ежедневный подарок', value: '500 ⭐ / день', icon: '🎁', tone: 'success' },
    ],
    supportLink: {
      label: 'Управление подпиской',
      href: 'https://t.me/energy_planet_bot/settings',
    },
  },
};

export const SubscriptionEn: Story = {
  args: {
    itemName: 'Weekly Stars Subscription',
    variant: 'subscription',
    locale: 'en',
    cost: 6.99,
    costCurrency: 'USD',
    rewards: [
      { label: 'Daily reward', value: '350 ⭐ / day', icon: '🎉', tone: 'accent' },
      { label: 'Auto renewal', value: 'Every 7 days', icon: '🔁', tone: 'secondary' },
    ],
  },
};
