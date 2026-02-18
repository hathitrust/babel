import { expect, test } from '@playwright/test';

test.describe('ssd', () => {
  test('ssd app is usable', async ({ page }) => {
    const response = await page.goto('/cgi/ssd?id=test.pd_open');
    expect(response.status()).toBe(200);
  });

  test('ssd app is usable when passed q1 param', async ({ page }) => {
    const response = await page.goto('/cgi/ssd?id=test.pd_open&q1=something');
    expect(response.status()).toBe(200);
  });
});

  