import { expect, test } from '@playwright/test';

test.describe('reader toolbar actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    await page.getByRole('button', { name: 'Close banner', exact: true }).click();
  });
  test('Hide controls', async ({ page }) => {
    await page.getByRole('button', { name: 'Hide controls' }).click();
    await expect(page.locator('aside .inner')).toBeHidden();
    await expect(page.getByRole('button', { name: 'View' })).toBeHidden();
    await page.getByRole('button', { name: 'Show controls' }).click();
    await expect(page.locator('aside .inner')).toBeVisible();
    await expect(page.getByRole('button', { name: 'View' })).toBeVisible();
  });
  test('Jump-to-seq form', async ({ page }) => {
    await page.getByLabel('# Page Sequence').fill('2');
    await page.getByLabel('# Page Sequence').press('Enter');
    await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=2');
    await page.getByLabel('# Page Sequence').fill('1');
    await page.getByLabel('# Page Sequence').press('Enter');
    await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=1');
  });
  test('Switch view mode', async ({ page }) => {
    await page.getByRole('button', { name: 'View' }).click();
    await page.getByRole('button', { name: 'Flip' }).click();
    await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=1&view=2up');
    await page.getByRole('button', { name: 'View' }).click();
    await page.getByRole('button', { name: 'Scroll' }).click();
    await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=1&view=1up');
  });
  test('Switch format', async ({ page }) => {
    await page.getByRole('button', { name: 'View' }).click();
    await page.getByRole('button', { name: 'Plain Text' }).click();
    await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=1&format=plaintext');
    await page.getByRole('button', { name: 'View' }).click();
    await page.getByRole('button', { name: 'Image' }).click();
    await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=1');
  });
  test('Zoom', async ({ page }) => {
    const scan = page.getByLabel('Page scan 1');
    await page.getByLabel('Zoom').getByRole('button', { name: 'Zoom In' }).click();
    await expect(scan).toHaveCSS('--zoom', '1.5');
    await page.getByLabel('Zoom').getByRole('button', { name: 'Zoom In' }).click();
    await expect(scan).toHaveCSS('--zoom', '1.75');
    await page.getByLabel('Zoom').getByRole('button', { name: 'Zoom In' }).click();
    await expect(scan).toHaveCSS('--zoom', '2');
    await page.getByLabel('Zoom').getByRole('button', { name: 'Zoom Out' }).click();
    await expect(scan).toHaveCSS('--zoom', '1.75');
    await page.getByLabel('Zoom').getByRole('button', { name: 'Zoom Out' }).click();
    await expect(scan).toHaveCSS('--zoom', '1.5');
    await page.getByLabel('Zoom').getByRole('button', { name: 'Zoom Out' }).click();
    await expect(scan).toHaveCSS('--zoom', '1');
    await page.getByLabel('Zoom').getByRole('button', { name: 'Zoom Out' }).click();
    await expect(scan).toHaveCSS('--zoom', '0.75');
    await page.getByLabel('Zoom').getByRole('button', { name: 'Zoom Out' }).click();
    await expect(scan).toHaveCSS('--zoom', '0.5');
  });
  test('Pagination', async ({ page }) => {
    await page.getByLabel('Pagination').getByRole('button', { name: 'Last Page' }).click();
    await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=2');
    await page.getByLabel('Pagination').getByRole('button', { name: 'First Page' }).click();
    await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=1');
    await page.getByLabel('Pagination').getByRole('button', { name: 'Next Page' }).click();
    await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=2');
    await page.getByLabel('Pagination').getByRole('button', { name: 'Previous Page' }).click();
    await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=1');
  });
  test('Fullscreen', async ({ page }) => {
    await page.getByRole('button', { name: 'Enter Full Screen' }).click();
    expect(page.evaluate('document.fullscreenEnabled')).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'null' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Zoom In', exact: true })).toBeHidden();
    await expect(page.getByLabel('Page scan 1').locator('details')).toBeHidden();
    await page.getByRole('button', { name: 'Exit Full Screen' }).click();
    await expect(page.getByRole('heading', { name: 'null' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom In', exact: true })).toBeVisible();
    await expect(page.getByLabel('Page scan 1').locator('details')).toBeVisible();
  });
});
