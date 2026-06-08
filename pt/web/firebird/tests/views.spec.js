import { expect, test } from '@playwright/test';

test.describe('reader view modes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    await page.getByRole('button', { name: 'Close banner', exact: true }).click();
  });

  test.describe('2up (flip) view', () => {
    test('toolbar switch to 2up updates URL', async ({ page }) => {
      await page.getByRole('button', { name: 'View' }).click();
      await page.getByRole('button', { name: 'Flip' }).click();
      await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=1&view=2up');
    });

    test('loads directly via URL parameter', async ({ page }) => {
      await page.goto('/cgi/pt?id=test.pd_open&view=2up');
      await expect(page).toHaveURL(/view=2up/);
      await expect(page.getByLabel('Page scan 1')).toBeVisible();
    });

    test('shows both pages side by side for a 2-page item', async ({ page }) => {
      await page.goto('/cgi/pt?id=test.pd_open&view=2up');
      await expect(page.getByLabel('Page scan 1')).toBeVisible();
      await expect(page.getByLabel('Page scan 2')).toBeVisible();
    });

    test('switching back to 1up updates URL', async ({ page }) => {
      await page.goto('/cgi/pt?id=test.pd_open&view=2up');
      await page.getByRole('button', { name: 'View' }).click();
      await page.getByRole('button', { name: 'Scroll' }).click();
      await expect(page).toHaveURL(/view=1up/);
    });
  });

  test.describe('thumbnail (grid) view', () => {
    test('toolbar switch to thumbnails updates URL', async ({ page }) => {
      await page.getByRole('button', { name: 'View' }).click();
      await page.getByRole('button', { name: 'Thumbnails' }).click();
      await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=1&view=thumb');
    });

    test('loads directly via URL parameter', async ({ page }) => {
      await page.goto('/cgi/pt?id=test.pd_open&view=thumb');
      await expect(page).toHaveURL(/view=thumb/);
    });

    test('shows a selectable button for each page', async ({ page }) => {
      await page.goto('/cgi/pt?id=test.pd_open&view=thumb');
      await expect(page.locator('button[aria-label="Select scan #1"]')).toBeVisible();
      await expect(page.locator('button[aria-label="Select scan #2"]')).toBeVisible();
    });

    test('switching back to 1up from thumbnails updates URL', async ({ page }) => {
      await page.goto('/cgi/pt?id=test.pd_open&view=thumb');
      await page.getByRole('button', { name: 'View' }).click();
      await page.getByRole('button', { name: 'Scroll' }).click();
      await expect(page).toHaveURL(/view=1up/);
    });
  });
});
