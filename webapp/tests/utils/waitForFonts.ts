import type { Page } from '@playwright/test';

export async function waitForFonts(
  page: Page,
  options: { disableAnimations?: boolean } = { disableAnimations: true }
) {
  await page.evaluate(async () => {
    if ('fonts' in document) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (document as any).fonts.ready;
    }
  });

  if (options.disableAnimations) {
    await page.addStyleTag({
      content: `
        *,
        *::before,
        *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
          transition-delay: 0ms !important;
        }
      `,
    });
  }
}
