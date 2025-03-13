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

test.describe('sidebar actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
  });
  test('null heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'null' })).toBeVisible();
  });
  test('about this item accordion panel is open', async ({ page }) => {
    const aboutThisItem = page.getByRole('button', { name: 'About This Item' });
    await expect(aboutThisItem).toHaveAttribute('aria-expanded', 'true');
  });
  test('download accordion panel is closed', async ({ page }) => {
    const download = page.getByRole('button', { name: 'Download' });
    await expect(download).toHaveAttribute('aria-expanded', 'false');
  });
  test('open search in this text accordion', async ({ page }) => {
    const searchInThisText = page.getByRole('button', { name: 'Search in This Text' });
    const aboutThisItem = page.getByRole('button', { name: 'About This Item' });

    await searchInThisText.click();
    await expect(searchInThisText).toHaveAttribute('aria-expanded', 'true');
    await expect(aboutThisItem).toHaveAttribute('aria-expanded', 'false');
  });

  // TODO
  // download scan
  // search in this text
  // open SITT in new tab
  // so many modals!!!
  // add item to collection??
  // close and expand sidebar
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
