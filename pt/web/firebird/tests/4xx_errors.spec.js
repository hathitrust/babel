import { expect, test } from '@playwright/test';

test.describe('non-existent items', () => {
  test('nonexistent id', async ({ page }) => {
    const response = await page.goto('/cgi/pt?id=test.nonexistent');
    expect(response.status()).toBe(404);
  });

  test('garbled ID', async ({ page }) => {
    const response = await page.goto('/cgi/pt?id=nonsense%3B');
    expect(response.status()).toBe(404);
  });

  test('no ID', async ({ page }) => {
    const response = await page.goto('/cgi/pt');
    expect(response.status()).toBe(404);
  });
});
