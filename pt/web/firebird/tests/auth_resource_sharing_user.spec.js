import { expect, test } from '@playwright/test';

test.describe('resource_sharing_user access to ic material', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    await page.getByRole('button', { name: 'Allow all cookies' }).click();
    await page.getByRole('button', { name: '\uf007' }).click();

    await page.getByRole('button', { name: /Switch Role: Resource Sharing/ }).click();
    await page.getByRole('radio', { name: 'Resource Sharing' }).click();
    await page.getByRole('button', { name: 'Submit' }).click();
  });

  test('pageturner loads image for ic_currently_held', async ({ page }) => {

    await page.goto('/cgi/pt?id=test.ic_currently_held');
    await expect(page.getByRole('figure')).toBeVisible();
  });

  // resource sharing users cannot see lost/missing/withdrawn material
  test('pageturner does not load image for ic_not_current', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_not_current');
    await expect(page.getByRole('figure')).toHaveCount(0);
  });

  test('pageturner does not load image for ic_not_held', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_not_held');
    await expect(page.getByText('not available online')).toHaveCount(1);
    await expect(page.getByRole('figure')).toHaveCount(0);
  });
});
