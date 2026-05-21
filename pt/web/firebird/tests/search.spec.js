import { expect, test } from '@playwright/test';

test.describe('search in this text', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    await page.getByRole('button', { name: 'Allow all cookies' }).click();
    const panelButton = page.getByRole('button', { name: 'Search in This Text' });
    await panelButton.click();
    await expect(panelButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('search input is visible when panel is open', async ({ page }) => {
    await expect(page.getByLabel('Search in this text')).toBeVisible();
  });

  test('submitting a query updates the URL with q1 param', async ({ page }) => {
    await page.getByLabel('Search in this text').fill('the');
    await page.getByRole('button', { name: 'Submit search' }).click();
    await expect(page).toHaveURL(/q1=the/);
  });

  test('search shows a result count message', async ({ page }) => {
    await page.getByLabel('Search in this text').fill('the');
    await page.getByRole('button', { name: 'Submit search' }).click();
    await expect(page.getByText(/results.*for/i)).toBeVisible({ timeout: 10_000 });
  });

  test('clearing search removes the q1 param from URL', async ({ page }) => {
    await page.getByLabel('Search in this text').fill('the');
    await page.getByRole('button', { name: 'Submit search' }).click();
    await expect(page.getByText(/results.*for/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page).not.toHaveURL(/q1=the/);
    await expect(page.getByLabel('Search in this text')).toHaveValue('');
  });

  test('loading the page with q1 param pre-fills the search input', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open&q1=hello');
    await expect(page.getByLabel('Search in this text')).toHaveValue('hello');
  });
});
