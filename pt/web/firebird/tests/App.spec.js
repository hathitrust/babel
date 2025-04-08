import { expect, test } from '@playwright/test';

test.describe('pt loads', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
  });

  test('has title', async ({ page }) => {
    await expect(page).toHaveTitle(/HathiTrust Digital Library/);
  });

  test('sidebar is visible', async ({ page }) => {
    const sidebar = page.getByRole('complementary');
    await expect(sidebar).toBeVisible;
  });

  test('has main element', async ({ page }) => {
    const main = page.getByRole('main');
    await expect(main).toHaveId('main');
  });
});

//TODO
/*
test.describe('reader toolbar actions', () => {
    // hide controls
    // switch views
    // switch formats
    // zoom
    // navigate pages
    // go fullscreen
    // exit fullscreen
})
*/

/*
test.describe('scan/page toolbar actions', () => [
    // minimize page controls
    // select scan for download
    // rotate scan
    // zoom scan
])
*/
