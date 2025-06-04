import { expect, test } from '@playwright/test';

test.describe('unauthenticated access to ic material', () => {
  test('pageturner loads image for ic_currently_held', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_currently_held');
    await expect(page.getByText(/full view access.*account privileges/)).toHaveCount(1);
    await expect(page.getByRole('figure')).toBeVisible();
  });

  // ssdusers can see lost/missing/withdrawn material
  test('pageturner loads image for ic_not_current', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_not_current');
    await expect(page.getByText(/full view access.*account privileges/)).toHaveCount(1);
    await expect(page.getByRole('figure')).toBeVisible();
  });

  test('pageturner does not load image for ssduser for ic_not_held', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_not_held');
    await expect(page.getByText('not available online')).toHaveCount(1);
    await expect(page.getByRole('figure')).toBeVisible();
  });
});
