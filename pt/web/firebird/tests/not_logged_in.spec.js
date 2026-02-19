import { expect, test } from '@playwright/test';

test.describe('not-logged-in access to ic material', () => {
  test('pageturner does not load image for ic material', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_currently_held');
    await expect(page).toHaveTitle(/HathiTrust Digital Library/);
    await expect(page.getByText('not available online')).toHaveCount(1);
    await expect(page.getByRole('figure')).toHaveCount(0);
  });
});

// TODO: these tests should move under the ssd app's testing umbrella when it materializes.
test.describe('not-logged-in access to ssd app', () => {
  test('ssd app is usable', async ({ page }) => {
    const response = await page.goto('/cgi/ssd?id=test.pd_open');
    expect(response.status()).toBe(200);
  });

  test('ssd app is usable when passed q1 param', async ({ page }) => {
    const response = await page.goto('/cgi/ssd?id=test.pd_open&q1=something');
    expect(response.status()).toBe(200);
  });
});
