import { expect, test } from '@playwright/test';

test.describe('4xx errors', () => {
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

  test('nonexistent id in ssd', async ({ page }) => {
    const response = await page.goto('/cgi/ssd?id=test.nonexistent');
    expect(response.status()).toBe(404);
  });

  test('nonexistent id in imgsrv', async ({ page }) => {
    const response = await page.goto('/cgi/imgsrv/image?id=test.nonexistent&seq=1');
    expect(response.status()).toBe(404);
  });

  test('garbled parameters for mb', async ({ page }) => {
    const response = await page.goto('/cgi/mb?a=listis%3Bc%3D123456');
    expect(response.status()).toBe(400);
  });

  test('invalid facet for ls', async ({ page }) => {
    const response = await page.goto('/cgi/ls?a=srchls&field1=nonsense&q1=test')
    expect(response.status()).toBe(400);
  });
});
