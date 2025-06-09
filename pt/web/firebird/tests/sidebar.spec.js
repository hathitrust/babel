import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'url';
import fs from 'fs';

test.describe('sidebar actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    //accept the cookie banner before each test
    await page.getByRole('button', { name: 'Allow all cookies' }).click();
  });

  test('null heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'null' })).toBeVisible();
  });
  test('about this item accordion panel is open', async ({ page }) => {
    const aboutThisItem = page.getByRole('button', { name: 'About This Item' });
    await expect(aboutThisItem).toHaveAttribute('aria-expanded', 'true');
  });
  test('download accordion panel is closed', async ({ page }) => {
    const downloadAccordion = page.getByRole('heading', { name: 'Download' });
    const downloadAccordionButton = downloadAccordion.getByRole('button', { name: 'Download' });
    await expect(downloadAccordionButton).toHaveAttribute('aria-expanded', 'false');
  });
  test('open search in this text accordion', async ({ page }) => {
    const searchInThisText = page.getByRole('button', { name: 'Search in This Text' });
    const aboutThisItem = page.getByRole('button', { name: 'About This Item' });

    await searchInThisText.click();
    await expect(searchInThisText).toHaveAttribute('aria-expanded', 'true');
    await expect(aboutThisItem).toHaveAttribute('aria-expanded', 'false');
  });

  // download scan
  test.describe('download scans', () => {
    test.beforeEach(async ({ page }) => {
      const downloadAccordion = page.getByRole('heading', { name: 'Download' });
      const downloadAccordionButton = downloadAccordion.getByRole('button', { name: 'Download' });
      await downloadAccordionButton.click();
    });
    test('download accordion is open', async ({ page }) => {
      const downloadAccordionButton = page
        .getByRole('heading', { name: 'Download' })
        .getByRole('button', { name: 'Download' });
      await expect(downloadAccordionButton).toHaveAttribute('aria-expanded', 'true');
    });
    test('download current page as pdf', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.getByLabel('Ebook (PDF)').check();
      await page.getByLabel('Current page scan (#1)').check();
      const downloadButton = page.getByRole('button', { name: 'Download', exact: true });
      await downloadButton.click();
      const download = await downloadPromise;
      const downloadPath = await download.path();

      //expect download to be pdf
      expect(download.suggestedFilename()).toContain('pdf');
      //expect file to exist before playwright deletes it
      expect(fs.existsSync(downloadPath)).toBeTruthy();
    });
    test.skip('download whole item jpeg, full resolution', async ({ page }) => {
      test.slow();

      await page.getByRole('radio', { name: 'Image (JPEG)' }).check();
      await page.getByLabel('Full / 600 dpi').check();
      await page.getByLabel('Whole item').check();
      await expect(page.getByRole('radio', { name: 'Image (JPEG)' })).toBeChecked();
      await expect(page.getByLabel('Full / 600 dpi')).toBeChecked();
      await expect(page.getByLabel('Whole item')).toBeChecked();
      const downloadButton = page.getByRole('button', { name: 'Download', exact: true });
      await downloadButton.click();

      await expect(page.getByLabel('Building your Image (JPEG)')).toBeVisible();

      await expect(page.getByRole('progressbar')).toBeHidden({ timeout: 9000 });
      await expect(page.getByLabel('Building your Image (JPEG)').getByRole('paragraph')).toBeVisible({
        timeout: 15_000,
      });

      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('link', { name: 'Download', exact: true }).click();
      const download = await downloadPromise;
      const downloadPath = await download.path();

      //expect download to be zip
      expect(download.suggestedFilename()).toContain('zip');
      //expect file to exist before playwright deletes it
      expect(fs.existsSync(downloadPath)).toBeTruthy();
    });
    test('download selected scans as tiff', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');

      await expect(page.getByText('Note: TIFF downloads are limited')).toBeVisible({ visible: false });
      await page.getByLabel('Image (TIFF)').check();
      await expect(page.getByText('Note: TIFF downloads are limited')).toBeVisible();
      await page.getByLabel('Selected page scans').check();

      await page.getByRole('button', { name: 'Download', exact: true }).click();
      await expect(page.getByLabel('Download', { exact: true }).getByText("You haven't selected any")).toBeVisible();

      await page.getByRole('button', { name: 'View' }).click();
      await page.getByRole('button', { name: 'Thumbnails' }).click();
      await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=1&view=thumb');

      const selectScan = page.locator('button[aria-label="Select scan #2"]');
      await expect(selectScan).toHaveAttribute('aria-pressed', 'false');
      await selectScan.click();

      await page.getByRole('button', { name: 'Download', exact: true }).click();
      const download = await downloadPromise;
      const downloadPath = await download.path();

      //expect download to be pdf
      expect(download.suggestedFilename()).toContain('zip');
      //expect file to exist before playwright deletes it
      expect(fs.existsSync(downloadPath)).toBeTruthy();
    });
  });

  // search in this text
  // open SITT in new tab

  test.describe('jump to section', () => {
    test.beforeEach(async ({ page }) => {
      const sectionAccordion = page.getByRole('heading', { name: 'Jump to Section' });
      const sectionAccordionButton = sectionAccordion.getByRole('button', { name: 'Jump to Section' });
      await sectionAccordionButton.click();
      await expect(sectionAccordionButton).toHaveAttribute('aria-expanded', 'true');

      // "Jump to page" modal should not be visible
      const modalHeading = page.getByRole('heading', { name: 'Jump to page scan' });
      expect(modalHeading).toBeVisible({ visible: false });
    });
    test('jump to page modal opens', async ({ page }) => {
      await page.getByRole('button', { name: 'Jump to page...' }).click();

      const modalHeading = page.getByRole('heading', { name: 'Jump to page scan' });
      await expect(modalHeading).toHaveText('Jump to page scan');
      await expect(modalHeading).toBeVisible();
    });
    test('jump to page 2', async ({ page }) => {
      await page.getByRole('button', { name: 'Jump to page...' }).click();

      const modalHeading = page.getByRole('heading', { name: 'Jump to page scan' });
      await expect(modalHeading).toHaveText('Jump to page scan');
      await expect(modalHeading).toBeVisible();

      await page.getByLabel('Page number or sequence').fill('2');
      await page.getByRole('button', { name: 'Jump', exact: true }).click();

      await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=2');
    });
    test('go back one page (-1)', async ({ page }) => {
      //setup: in order to move backward one page, we need to start on page 2
      await page.getByRole('button', { name: 'Next Page' }).click();
      await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=2');

      await page.getByRole('button', { name: 'Jump to page...' }).click();

      const modalHeading = page.getByRole('heading', { name: 'Jump to page scan' });
      await expect(modalHeading).toHaveText('Jump to page scan');
      await expect(modalHeading).toBeVisible();

      await page.getByLabel('Page number or sequence').fill('-1');
      await page.getByRole('button', { name: 'Jump', exact: true }).click();

      await expect(page).toHaveURL('/cgi/pt?id=test.pd_open&seq=1');
    });
    test('close jump to page modal', async ({ page }) => {
      await page.getByRole('button', { name: 'Jump to page...' }).click();

      const modalHeading = page.getByRole('heading', { name: 'Jump to page scan' });
      await expect(modalHeading).toHaveText('Jump to page scan');
      await expect(modalHeading).toBeVisible();

      await page.getByRole('button', { name: 'Close Modal' }).click();
      await expect(modalHeading).toBeVisible({ visible: false });
    });
  });
  // won't test *actually* adding an item to a collection, because
  test.describe('collections', () => {
    test.beforeEach(async ({ page }) => {
      const collectionAccordion = page.getByRole('heading', { name: 'Collections' });
      const collectionAccordionButton = collectionAccordion.getByRole('button', { name: 'Collections' });
      await collectionAccordionButton.click();
      await expect(collectionAccordionButton).toHaveAttribute('aria-expanded', 'true');
    });
    test('collection dropdown', async ({ page }) => {
      const collectionDropdown = page.getByLabel('Add this item to a collection:');
      await expect(collectionDropdown).toContainText('New collection...');
    });
    test('select new collection from dropdown', async ({ page }) => {
      await page.getByLabel('Add this item to a collection:').selectOption('New collection...');
      await page.getByRole('button', { name: 'Add', exact: true }).click();

      const modalHeading = page.getByRole('heading', { name: 'New Collection' });
      await expect(modalHeading).toBeVisible();
    });
    test('fill out new collection form', async ({ page }) => {
      await page.getByLabel('Add this item to a collection:').selectOption('New collection...');
      await page.getByRole('button', { name: 'Add', exact: true }).click();

      const modalHeading = page.getByRole('heading', { name: 'New Collection' });
      await expect(modalHeading).toBeVisible();

      await page.getByLabel('Collection Name').fill('The best collection ever');
      await page.getByRole('textbox', { name: 'Description' }).fill('Will it blend?');
      await page.getByLabel('Contributor Name').fill('Me');
      await page.getByLabel('Private').check();

      await page.getByRole('button', { name: 'Save Changes' }).click();
    });
  });
  // close and expand sidebar
  test.describe('toggle sidebar visibility', () => {
    test('close sidebar', async ({ page }) => {
      const closeSidebar = page.getByRole('button', { name: 'Close sidebar' });
      await expect(closeSidebar).toBeVisible();

      await closeSidebar.click();

      await expect(page.getByRole('heading', { name: 'null' })).toBeVisible({ visible: false });
      await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeVisible();
    });
    test('open sidebar', async ({ page }) => {
      // setup: close the sidebar to test opening the sidebar
      await page.getByRole('button', { name: 'Close sidebar' }).click();

      const openSidebar = page.getByRole('button', { name: 'Open sidebar' });
      await expect(openSidebar).toBeVisible();

      await openSidebar.click();

      await expect(page.getByRole('heading', { name: 'null' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Close sidebar' })).toBeVisible();
    });
  });
});
