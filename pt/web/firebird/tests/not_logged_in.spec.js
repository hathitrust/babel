import { expect, test } from '@playwright/test';

test.describe('unauthenticated access to ic material', () => {
  test('pageturner does not load image for ic material', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_currently_held');
    await expect(page).toHaveTitle(/HathiTrust Digital Library/);
    await expect(page.getByText('not available online')).toHaveCount(1);
    await expect(page.locator('main img')).toHaveCount(0);
  });
});
