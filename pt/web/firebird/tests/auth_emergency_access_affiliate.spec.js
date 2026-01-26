import { expect, test } from '@playwright/test';
import fs from 'fs';

test.describe('emergency_access_affiliate access to ic material', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    await page.getByRole('button', { name: 'Allow all cookies' }).click();
  });

  test('pageturner loads image for ic_currently_held after checkout', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_currently_held');

    await expect(page.getByRole('figure')).toHaveCount(0);
    await page.getByRole('link', { name: 'Check Out' }).click();
    await expect(page.getByRole('figure')).toBeVisible();
    await page.getByRole('link', { name: 'Return Early' }).click();
    await expect(page.getByRole('figure')).toHaveCount(0);
  });

  // resource sharing users cannot see lost/missing/withdrawn material
  test('pageturner loads image for ic_not_current after checkout', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_not_current');

    await expect(page.getByRole('figure')).toHaveCount(0);
    await page.getByRole('link', { name: 'Check Out' }).click();
    await expect(page.getByRole('figure')).toBeVisible();
    await page.getByRole('link', { name: 'Return Early' }).click();
    await expect(page.getByRole('figure')).toHaveCount(0);
  });

  test('pageturner does not load image or show checkout for ic_not_held', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_not_held');
    await expect(page.getByText('not available online')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Check Out' })).toHaveCount(0);
    await expect(page.getByRole('figure')).toHaveCount(0);
  });
});
