import safeAreaTokens from '../../../shared/tokens/safe-area.json';

/**
 * Shared layout spacing constants to keep header/content offsets in sync.
 * Source of truth: `shared/tokens/safe-area.json`.
 */

type SafeAreaTokenConfig = {
  headerReservePx: number;
  headerBufferPx: number;
  navigationReservePx: number;
  sidePaddingPx: number;
};

export const SAFE_AREA_LAYOUT_TOKENS: SafeAreaTokenConfig = safeAreaTokens;

export const SAFE_AREA_CSS_VARIABLES = {
  contentBaseTop: '--app-content-base-top',
  headerBuffer: '--app-header-buffer',
  headerOffsetTop: '--app-header-offset-top',
  headerReserve: '--app-header-reserve',
  contentPaddingTop: '--app-content-padding-top',
} as const;

export const HEADER_RESERVE_PX = SAFE_AREA_LAYOUT_TOKENS.headerReservePx;
export const HEADER_BUFFER_PX = SAFE_AREA_LAYOUT_TOKENS.headerBufferPx;
export const NAVIGATION_RESERVE_PX = SAFE_AREA_LAYOUT_TOKENS.navigationReservePx;
export const SIDE_PADDING_PX = SAFE_AREA_LAYOUT_TOKENS.sidePaddingPx;
