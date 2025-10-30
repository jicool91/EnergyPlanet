# Floating "Back to Tap" Button

- **Element ID**: `<motion.button ... className="fixed right-4 ...">`
- **Source**: `webapp/src/screens/MainScreen.tsx:220`
- **Role**: Quick navigation back to the home tap screen when user scrolls other tabs.

## Implementation Snapshot
- Appears when `activeTab !== 'home'`, `isScrolled` true, and `!isLoading`.
- Uses Framer Motion for fade/slide animation.
- Positioned with `fixed` and safe-area-aware bottom offset (`floatingButtonOffset`).

## Checklist Findings
- **Visibility Rules**: Condition ensures button does not appear on home tab. Need to verify `isScrolled` reset when switching tabs; `useEffect` sets `isScrolled(false)` on tab change. **Severity: Low**
- **Accessibility**: Has `aria-label` and `title`, but no `type="button"`? (Yes defined). Missing focus styles due to reliance on Tailwind; confirm `focus-ring` class applied? Not here; add focus style for keyboard nav. **Severity: Medium**
- **Motion**: Motion default durations may feel slow when user scrolls quickly; evaluate with hardware profiling for 60fps. **Severity: Low**
- **Theming**: Uses gradient background; check contrast under dark theme.

## Interaction & API Coverage
- On click, triggers `onTabChange('home')` then `scrollToTop(true)`. If `scrollToTop` fails (null ref), button still changes tab but leaves existing scroll position; ensure fallback safe.
- No analytics tracked; add event `nav_back_to_tap`.
- Haptic feedback missing; Telegram guidelines encourage haptics for key actions. citeturn0search0

## Issues & Risks
1. **Keyboard Focus**: Without `.focus-ring`, focus indicator may be invisible on dark backgrounds. Add accessible focus state. **Severity: Medium**
2. **Overlap Risk**: On devices with 3-button navigation, the button may overlap OS nav. Confirm safe area offset accounts for this (Android no safe bottom). **Severity: Medium**

## Opportunities
- Add subtle badge showing energy per second to incentivise returning to tap.
- Trigger medium impact haptic on activation using `useHaptic`.
