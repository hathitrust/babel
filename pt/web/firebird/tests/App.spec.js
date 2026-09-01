import { expect, test } from '@playwright/test';

test.describe('pt loads', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    await expect(page.locator('#main')).toBeVisible();
  });

  test('has title', async ({ page }) => {
    await expect(page).toHaveTitle(/HathiTrust Digital Library/);
  });

  test('sidebar is visible', async ({ page }) => {
    await expect(page.locator('aside')).toBeVisible();
  });

  test('has main element', async ({ page }) => {
    const main = page.getByRole('main');
    await expect(main).toHaveId('main');
  });
});

test('request with skin=alicorn load page with firebird elements', async ({ page }) => {
  await page.goto('/cgi/pt?id=test.pd_open&skin=alicorn');
  await expect(page.locator('#main')).toBeVisible();

  await expect(page.locator('hathi-website-header')).toBeVisible();
});
