import { expect, test } from '@playwright/test';

test.describe('imgsrv download', () => {
  // make sure we have appropriate session cookies etc before calling imgsrv
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    //accept the cookie banner before each test
    await page.getByRole('button', { name: 'Allow all cookies' }).click();
  });

  test('download whole item jpeg, full resolution', async ({ request, page }) => {
    var currentTime = new Date().getTime();

    const initialResponse = await request.get(
      'http://apache-test:8080/cgi/imgsrv/download/pdf?id=test.pd_open&callback=tunnelCallback&_=' + currentTime
    );
    const initialBody = await initialResponse.text();
    //    console.log(body.toString());

    // should get a result like:
    // tunnelCallback('/cgi/imgsrv/download-status?id=test.pd_open;marker=2K16.11c2110ec3cb660ecda8bd61c5d456b056701b164120987adabc159e0135e0b0a0', '/cgi/imgsrv/download/pdf?id=test.pd_open;marker=2K16.11c2110ec3cb660ecda8bd61c5d456b056701b164120987adabc159e0135e0b0a0;attachment=1', 2, '1');

    const callbackParams = JSON.parse(
      initialBody
        .replace(/^tunnelCallback\(/, '[')
        .replace(/\);$/, ']')
        .replaceAll("'", '"')
    );

    const callbackUrl = callbackParams[0];
    const downloadUrl = callbackParams[1];

    //    console.log(callbackParams)

    // wait until status is done
    let done = false;

    while (done == false) {
      console.log('Trying to get ' + callbackUrl);

      const callbackResponse = await request.get('http://apache-test:8080' + callbackUrl);
      const callbackJson = await callbackResponse.json();

      console.log(callbackJson);
      if (callbackJson.status == 'DONE') {
        done = true;
      } else {
        // wait for 1 second
        // await page.waitForTimeout(1000);
        // yes it's polling and polling is bad but that's the way imgsrv works 😿
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        await delay(1000);
      }
    }

    const downloadResponse = await request.get('http://apache-test:8080' + downloadUrl);
    const downloadHeaders = downloadResponse.headers();
    const downloadBody = await downloadResponse.text();

    expect(downloadResponse.status()).toEqual(200);
    expect(downloadHeaders['content-disposition']).toMatch(/^attachment; filename=test-pd_open-\d+.pdf$/);
    expect(downloadHeaders['content-type']).toEqual('application/pdf');
    expect(downloadBody.length).toBeGreaterThan(512 * 1024);
  });

  test('download epub', async ({ request, page }) => {
    var currentTime = new Date().getTime();

    const initialResponse = await request.get(
      'http://apache-test:8080/cgi/imgsrv/download/epub?id=test.pd_open&callback=tunnelCallback&_=' + currentTime
    );
    const initialBody = await initialResponse.text();

    const callbackParams = JSON.parse(
      initialBody
        .replace(/^tunnelCallback\(/, '[')
        .replace(/\);$/, ']')
        .replaceAll("'", '"')
    );

    const callbackUrl = callbackParams[0];
    const downloadUrl = callbackParams[1];

    // wait until status is done
    let done = false;

    while (done == false) {
      console.log('Trying to get ' + callbackUrl);

      const callbackResponse = await request.get('http://apache-test:8080' + callbackUrl);
      const callbackJson = await callbackResponse.json();

      if (callbackJson.status == 'DONE') {
        done = true;
      } else {
        // wait for 1 second
        // await page.waitForTimeout(1000);
        // yes it's polling and polling is bad but that's the way imgsrv works 😿
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        await delay(1000);
      }
    }

    const downloadResponse = await request.get('http://apache-test:8080' + downloadUrl);
    const downloadHeaders = downloadResponse.headers();
    const downloadBody = await downloadResponse.text();

    expect(downloadResponse.status()).toEqual(200);
    expect(downloadHeaders['content-disposition']).toEqual('attachment; filename=test-pd_open.epub');
    expect(downloadHeaders['content-type']).toEqual('application/epub+zip');
    expect(downloadBody.length).toBeGreaterThan(0);
  });

  test('download single tiff, full resolution', async ({ request, page }) => {
    // no callback tunnel on single tiff

    const downloadResponse = await request.get(
      'http://apache-test:8080/cgi/imgsrv/image?id=test.pd_open&attachment=1&tracker=D1&format=image/tiff&size=ppi:300&seq=1'
    );
    const downloadHeaders = downloadResponse.headers();
    const downloadBody = await downloadResponse.text();

    expect(downloadResponse.status()).toEqual(200);
    expect(downloadHeaders['content-disposition']).toEqual('attachment; filename=test.pd_open-seq_1.tif');
    expect(downloadHeaders['content-type']).toEqual('image/tiff');
    expect(downloadBody.length).toBeGreaterThan(1);
  });

  test('download single page jpeg, high resolution', async ({ request, page }) => {
    //no callback tunnel on single pages

    const downloadResponse = await request.get(
      'http://apache-test:8080/cgi/imgsrv/image?id=test.pd_open&attachment=1&tracker=D1&format=image/jpeg&size=ppi:300&seq=2'
    );
    const downloadHeaders = downloadResponse.headers();
    const downloadBody = await downloadResponse.text();

    expect(downloadResponse.status()).toEqual(200);
    expect(downloadHeaders['content-disposition']).toMatch('attachment; filename=test.pd_open-seq_2.jpg');
    expect(downloadHeaders['content-type']).toEqual('image/jpeg');
    expect(downloadBody.length).toBeGreaterThan(1);
  });
  test('download selected pages jpeg, full resolution', async ({ request, page }) => {
    //no callback tunnel on non-tiff selections <11 pages

    const downloadResponse = await request.get(
      'http://apache-test:8080/cgi/imgsrv/image?id=test.pd_open&attachment=1&tracker=D1&format=image/jpeg&target_ppi=0&seq=1&seq=2'
    );
    const downloadHeaders = downloadResponse.headers();
    const downloadBody = await downloadResponse.text();

    expect(downloadResponse.status()).toEqual(200);
    expect(downloadHeaders['content-disposition']).toMatch('attachment; filename=test.pd_open-seq_1_2.jpg');
    expect(downloadHeaders['content-type']).toEqual('image/jpeg');
    expect(downloadBody.length).toBeGreaterThan(1);
  });
});
