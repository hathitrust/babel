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
    const response = await page.goto('/cgi/ls?a=srchls&field1=nonsense&q1=test');
    expect(response.status()).toBe(400);
  });

  test('shows image temporarily unavailable message when image fetch returns 429', async ({ page }) => {
    await page.route('/cgi/imgsrv/image?*', (route) =>
      route.fulfill({
        status: 429,
        headers: {
          'Cf-Ray': 'a3eb3b119c06bf8e-ATL',
        },
      })
    );

    await page.goto('/cgi/pt?id=test.pd_open&seq=1');

    await expect(page.getByRole('group', { name: 'Page scan 1' })).toContainText('Image Temporarily Unavailable');
    await expect(page.locator('.cf-ray').first()).toContainText('a3eb3b119c06bf8e');
  });

  test('shows forbidden message when image fetch returns 403', async ({ page }) => {
    await page.route('/cgi/imgsrv/image?*', (route) =>
      route.fulfill({
        status: 403,
        headers: {
          'Cf-Ray': 'a3eb3b119c06bf8e-ATL',
        },
      })
    );

    await page.goto('/cgi/pt?id=test.pd_open&seq=1');

    await expect(page.getByRole('group', { name: 'Page scan 1' })).toContainText('Forbidden');
    await expect(page.locator('.cf-ray').first()).toContainText('a3eb3b119c06bf8e');
  });
});
