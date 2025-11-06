import '@/index.css';
import { renderOfflineSummaryPreview } from './previews/offlineSummary';
import { renderFriendsPreview } from './previews/friendsScreen';
import { renderTapPreview } from './previews/tapScreen';
import { renderExchangePreview } from './previews/exchangeScreen';

type PreviewRenderer = (container: HTMLElement, params: URLSearchParams) => void;

const PREVIEWS: Record<string, PreviewRenderer> = {
  offline: renderOfflineSummaryPreview,
  friends: renderFriendsPreview,
  tap: renderTapPreview,
  exchange: renderExchangePreview,
};

const params = new URLSearchParams(window.location.search);
const view = params.get('view') ?? 'offline';
const container = document.getElementById('root');

if (!container) {
  throw new Error('Preview container #root not found');
}

const render = PREVIEWS[view] ?? PREVIEWS.offline;
render(container, params);
