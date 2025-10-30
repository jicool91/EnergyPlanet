# Shared Button Component (`Button`)

- **Source**: `webapp/src/components/Button.tsx`
- **Role**: Core CTA element across the app with variants, sizes, loading/success/error states.

## Checklist Findings
- **Telegram Compliance**: Hit area via padding ensures ≥44px height. Framer Motion micro-interactions align with recommended “lightweight transitions”. citeturn0search0 **Severity: Low**
- **Accessibility**: Uses `focus-visible` ring; verify colour contrast for focus outline vs background. Provide `aria-busy` when `loading` true. **Severity: Medium**
- **State Feedback**: `success` and `error` states animate but do not automatically revert variant; developer must reset. Document this to avoid stuck success state. **Severity: Low**
- **Disabled Handling**: `isDisabled` also true when `success` to prevent double submit; good. Yet success state retains gradient that may imply clickable; consider adjusting style.
- **Internationalisation**: Buttons rely on children text; ensure copy via i18n.

## Interaction & API Coverage
- Use with `type="button"` or `type="submit"` as needed; default unspecified (defaults to `button` due to React?). Confirm to avoid form submit triggered inadvertently.
- Provide props `loadingText` and `successText` but UI never renders them; implement to show text next to spinner/check. **Severity: Medium**

## Issues & Risks
1. **ARIA Missing**: Add `aria-live="polite"` or `aria-busy` to communicate loading. **Severity: Medium**
2. **Motion Respect**: Should disable hover/tap animation when reduce-motion preference active. **Severity: Medium**

## Opportunities
- Expose `leadingIcon`/`trailingIcon` slots for consistent spacing.
- Add `destructive-outline` variant for caution flows.
