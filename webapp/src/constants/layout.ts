/**
 * Shared layout spacing constants to keep header/content offsets in sync.
 * Keep values mirrored in `docs/telegram-fullscreen-status-bar.md` (Section 6).
 */

export const SAFE_AREA_LAYOUT_TOKENS = {
  // HEADERS: top padding 16 + core block 56 + bottom padding 16 + LevelBar 2 = 90px reserved area.
  headerReservePx: 90,
  // BUFFER: gap between Telegram chrome buttons and our header capsule.
  headerBufferPx: 12,
  // NAVIGATION: Bottom navigation height incl. outer padding.
  navigationReservePx: 88,
  // Horizontal padding we add on top of safe-area inset.
  sidePaddingPx: 16,
} as const;

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
