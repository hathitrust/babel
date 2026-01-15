import { expect, test } from '@playwright/test';
import fs from 'fs';

test.describe('in_library_user access to op/ipma material reported as brlm', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    await page.getByRole('button', { name: 'Allow all cookies' }).click();
  });

  test('pageturner loads image for op_brlm after checkout', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.op_brlm');

    await expect(page.getByRole('figure')).toHaveCount(0);
    await page.getByRole('link', { name: 'Check Out' }).click();
    await expect(page.getByRole('figure')).toBeVisible();
    await page.getByRole('link', { name: 'Return Early' }).click();
    await expect(page.getByRole('figure')).toHaveCount(0);
  });

  // not op/ipma and not brlm
  test('pageturner does not load image or show checkout for ic_currently_held', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_currently_held');
    await expect(page.getByText('not available online')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Check Out' })).toHaveCount(0);
    await expect(page.getByRole('figure')).toHaveCount(0);
  });
});
