import { expect, test } from '@playwright/test';

// These tests run as an anonymous (not-logged-in) user.
// The auth specs cover the same items under authenticated access.
test.describe('restricted view', () => {
  test.describe('ic_currently_held', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/cgi/pt?id=test.ic_currently_held');
    });

    test('shows "not available online" warning', async ({ page }) => {
      await expect(page.getByText('not available online')).toBeVisible();
    });

    test('shows "Limited - search only" label', async ({ page }) => {
      await expect(page.getByText('Limited - search only')).toBeVisible();
    });

    test('does not render any page scan images', async ({ page }) => {
      await expect(page.getByRole('figure')).toHaveCount(0);
    });

    test('does not render the reader toolbar', async ({ page }) => {
      await expect(page.locator('.view--toolbar')).toHaveCount(0);
    });

    test('shows a search form so users can still search the text', async ({ page }) => {
      await expect(page.locator('#input-search-text')).toBeVisible();
    });
  });

  test.describe('ic_not_held', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/cgi/pt?id=test.ic_not_held');
    });

    test('shows "not available online" warning', async ({ page }) => {
      await expect(page.getByText('not available online')).toBeVisible();
    });

    test('does not render any page scan images', async ({ page }) => {
      await expect(page.getByRole('figure')).toHaveCount(0);
    });
  });
});
