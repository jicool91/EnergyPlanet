import '@/index.css';
import { renderOfflineSummaryPreview } from './previews/offlineSummary';
import { renderFriendsPreview } from './previews/friendsScreen';
import { renderTapPreview } from './previews/tapScreen';
import { renderShopPreview } from './previews/shopScreen';
import { renderPurchaseSuccessPreview } from './previews/purchaseSuccess';
import { renderLevelUpPreview } from './previews/levelUpScreen';
import { renderAuthErrorPreview } from './previews/authErrorModal';
import { renderPvPEventsPreview } from './previews/pvpEvents';
import { renderChatPreview } from './previews/chatScreen';

type PreviewRenderer = (container: HTMLElement, params: URLSearchParams) => void;

const PREVIEWS: Record<string, PreviewRenderer> = {
  offline: renderOfflineSummaryPreview,
  friends: renderFriendsPreview,
  tap: renderTapPreview,
  shop: renderShopPreview,
  exchange: renderShopPreview,
  levelup: renderLevelUpPreview,
  'auth-error': renderAuthErrorPreview,
  'purchase-success': renderPurchaseSuccessPreview,
  events: renderPvPEventsPreview,
  chat: renderChatPreview,
};

const params = new URLSearchParams(window.location.search);
const view = params.get('view') ?? 'offline';
const container = document.getElementById('root');

if (!container) {
  throw new Error('Preview container #root not found');
}

const render = PREVIEWS[view] ?? PREVIEWS.offline;
render(container, params);
