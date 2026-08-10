import { expect, test } from '@playwright/test';

test.describe('imgsrv requires session', () => {

  test.describe('without session', () => {
    test('download full pdf', async ({ request }) => {
      var currentTime = new Date().getTime();

      const response = await request.get(
        'http://apache:8080/cgi/imgsrv/download/pdf?id=test.pd_open&callback=tunnelCallback&_=' + currentTime
      );

      expect(response.status()).toEqual(403)
    });

    test('download single page pdf', async ({ request }) => {
      const response = await request.get(
        'http://apache:8080/cgi/imgsrv/download/image?id=test.pd_open&attachment=1&tracker=D1&format=image%2Ftiff&target_ppi=0&seq=2'
      );
      expect(response.status()).toEqual(403);
    });

    test('page image, full resolution', async ({ request }) => {
      const response = await request.get(
        'http://apache:8080/cgi/imgsrv/image?id=test.pd_open&size=full&seq=1'
      );

      expect(response.status()).toEqual(403);
    });

    test('page image, default resolution', async ({ request }) => {
      const response = await request.get(
        'http://apache:8080/cgi/imgsrv/image?id=test.pd_open&seq=1'
      );

      expect(response.status()).toEqual(403);
    });

    test('page ocr', async ({ request }) => {
      const response = await request.get(
        'http://apache:8080/cgi/imgsrv/html?id=test.pd_open&seq=1'
      );

      expect(response.status()).toEqual(403);
    });
  });

  test.describe('with session', () => { 
    // make sure we have appropriate session cookies etc before calling imgsrv
    test.beforeEach(async ({ page }) => {
      await page.goto('/cgi/pt?id=test.pd_open');
      //accept the cookie banner before each test
      await page.getByRole('button', { name: 'Allow all cookies' }).click();
    });

    test('page image', async ({ request, page }) => {
      const response = await page.context().request.get(
        'http://apache:8080/cgi/imgsrv/image?id=test.pd_open&seq=1'
      );
      expect(response.status()).toEqual(200);
    });

    test('ocr', async ({ request, page }) => {
      const response = await page.context().request.get(
        'http://apache:8080/cgi/imgsrv/html?id=test.pd_open&seq=1'
      );
      expect(response.status()).toEqual(200);
    });
  });
});
