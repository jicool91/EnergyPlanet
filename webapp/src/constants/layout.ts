/**
 * Shared layout spacing constants to keep header/content offsets in sync.
 * Keep values mirrored in `docs/telegram-fullscreen-status-bar.md` (Section 6).
 */
// HEADERS: top padding 16 + core block 56 + bottom padding 16 + LevelBar 2 = 90px reserved area.
export const HEADER_RESERVE_PX = 90;
// BUFFER: additional gap so Telegram close/back buttons never overlap Energy Planet header.
export const HEADER_BUFFER_PX = 12;
