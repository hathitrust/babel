import { expect, test } from '@playwright/test';
import fs from 'fs';

test.describe('resource_sharing_user access to ic material', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    await page.getByRole('button', { name: 'Allow all cookies' }).click();
    await page.getByRole('button', { name: 'My account' }).click();

    await page.getByRole('button', { name: 'Switch Role' }).click();
    await page.getByRole('radio', { name: 'Resource Sharing' }).click();
    await page.getByRole('button', { name: 'Submit' }).click();
  });

  test('pageturner loads image for ic_currently_held', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_currently_held');
    await expect(page.getByRole('figure')).toBeVisible();
  });

  test.skip('download ic_currently_held whole item jpeg, full resolution', async ({ page }) => {
    test.slow();

    await page.goto('/cgi/pt?id=test.ic_currently_held');

    const downloadAccordion = page.getByRole('heading', { name: 'Download' });
    const downloadAccordionButton = downloadAccordion.getByRole('button', { name: 'Download' });
    await downloadAccordionButton.click();
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

  test('download single page from ic_currently_held', async ({ page, browserName }) => {
    test.skip(
      browserName == 'webkit',
      'until we can figure out why content-disposition does not include the file extension'
    );
    await page.goto('/cgi/pt?id=test.ic_currently_held');
    const downloadAccordion = page.getByRole('heading', { name: 'Download' });
    const downloadAccordionButton = downloadAccordion.getByRole('button', { name: 'Download' });
    await downloadAccordionButton.click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByLabel('Image (JPEG)').check();
    await page.getByLabel('Current page scan (#1)').check();
    const downloadButton = page.getByRole('button', { name: 'Download', exact: true });
    await downloadButton.click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    //expect download to be pdf
    expect(download.suggestedFilename()).toContain('jpg');
    //expect file to exist before playwright deletes it
    expect(fs.existsSync(downloadPath)).toBeTruthy();
  });

  // resource sharing users cannot see lost/missing/withdrawn material
  test('pageturner does not load image for ic_not_current', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_not_current');
    await expect(page.getByRole('figure')).toHaveCount(0);
    // Download panel has "This item cannot be downloaded."
    const downloadAccordion = page.getByRole('heading', { name: 'Download' });
    const downloadAccordionButton = downloadAccordion.getByRole('button', { name: 'Download' });
    await downloadAccordionButton.click();
    await expect(page.getByText('This item cannot be downloaded')).toHaveCount(1);
  });

  test('pageturner does not load image for ic_not_held', async ({ page }) => {
    await page.goto('/cgi/pt?id=test.ic_not_held');
    await expect(page.getByText('not available online')).toHaveCount(1);
    await expect(page.getByRole('figure')).toHaveCount(0);
    // Download panel has "This item cannot be downloaded."
    const downloadAccordion = page.getByRole('heading', { name: 'Download' });
    const downloadAccordionButton = downloadAccordion.getByRole('button', { name: 'Download' });
    await downloadAccordionButton.click();
    await expect(page.getByText('This item cannot be downloaded')).toHaveCount(1);
  });
});
