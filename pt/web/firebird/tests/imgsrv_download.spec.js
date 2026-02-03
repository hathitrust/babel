import { expect, test } from '@playwright/test';

test.describe('imgsrv download', () => {
  // make sure we have appropriate session cookies etc before calling imgsrv
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    //accept the cookie banner before each test
    await page.getByRole('button', { name: 'Allow all cookies' }).click();
  });

  test('download whole item pdf, full resolution', async ({ request, page }) => {
    var currentTime = new Date().getTime();

    const initialResponse = await request.get(
      'http://apache:8080/cgi/imgsrv/download/pdf?id=test.pd_open&callback=tunnelCallback&_=' + currentTime
    );
    const initialBody = await initialResponse.text();

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

    // wait until status is done
    let done = false;

    while (done == false) {
      const callbackResponse = await request.get('http://apache:8080' + callbackUrl);
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

    const downloadResponse = await request.get('http://apache:8080' + downloadUrl);
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
      'http://apache:8080/cgi/imgsrv/download/epub?id=test.pd_open&callback=tunnelCallback&_=' + currentTime
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
      const callbackResponse = await request.get('http://apache:8080' + callbackUrl);
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

    const downloadResponse = await request.get('http://apache:8080' + downloadUrl);
    const downloadHeaders = downloadResponse.headers();
    const downloadBody = await downloadResponse.text();

    expect(downloadResponse.status()).toEqual(200);
    expect(downloadHeaders['content-disposition']).toEqual('attachment; filename=test-pd_open.epub');
    expect(downloadHeaders['content-type']).toEqual('application/epub+zip');
    expect(downloadBody.length).toBeGreaterThan(0);
  });

  test('download single tiff current page, full resolution', async ({ request, page }) => {
    // no callback tunnel on single tiff

    const downloadResponse = await request.get(
      'http://apache:8080/cgi/imgsrv/image?id=test.pd_open&attachment=1&tracker=D1&format=image/tiff&size=full&seq=1'
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
      'http://apache:8080/cgi/imgsrv/image?id=test.pd_open&attachment=1&tracker=D1&format=image/jpeg&size=ppi:300&seq=2'
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
      'http://apache:8080/cgi/imgsrv/image?id=test.pd_open&attachment=1&tracker=D1&format=image/jpeg&target_ppi=0&seq=1&seq=2'
    );
    const downloadHeaders = downloadResponse.headers();
    const downloadBody = await downloadResponse.text();

    // console.log('headers', downloadHeaders, 'status', downloadResponse.status());

    expect(downloadResponse.status()).toEqual(200);
    expect(downloadHeaders['content-disposition']).toMatch('attachment; filename=test.pd_open-seq_1_2.jpg');
    expect(downloadHeaders['content-type']).toEqual('image/jpeg');
    expect(downloadBody.length).toBeGreaterThan(1);
  });

  test('download pdf with bogus seq', async ({ request, page }) => {
    const initialResponse = await request.get(
      'http://apache:8080/cgi/imgsrv/download/pdf?id=test.pd_open&attachment=1&tracker=D1&seq=mashed_potatoes'
    );
    expect(initialResponse.status()).toEqual(200);
  });
});
test('download single selected page tiff, high resolution', async ({ request, page }) => {
  //this test fails
  //single selected page (#2), has the /download path in the URL, uses the form tunnel, no callback
  // returns 403 restricted
  // ...what am i missing??
  const downloadResponse = await request.get(
    'http://apache:8080/cgi/imgsrv/download/image?id=test.pd_open&attachment=1&tracker=D1&format=image%2Ftiff&target_ppi=0&seq=2'
  );
  const downloadHeaders = downloadResponse.headers();
  const downloadBody = await downloadResponse.text();

  // console.log('headers', downloadHeaders, 'body', downloadBody);

  expect(downloadResponse.status()).toEqual(200);
  expect(downloadHeaders['content-disposition']).toContain('attachment; filename=test.pd_open-2');
  expect(downloadHeaders['content-type']).toEqual('application/zip');
  expect(downloadBody.length).toBeGreaterThan(1);
});
test('download single selected page txt', async ({ request, page }) => {
  //this test passes
  //but it has most of the same parameters as the single tiff that doesn't pass:
  //single selected page (#2), has the /download path in the URL, uses the form tunnel, no callback
  const downloadResponse = await request.get(
    'http://apache:8080/cgi/imgsrv/download/plaintext?id=test.pd_open&attachment=1&tracker=D5&seq=2'
  );
  const downloadHeaders = downloadResponse.headers();
  const downloadBody = await downloadResponse.text();

  // console.log('headers', downloadHeaders, 'body', downloadBody);

  expect(downloadResponse.status()).toEqual(200);
  expect(downloadHeaders['content-disposition']).toContain('attachment; filename=test-pd_open-2');
  expect(downloadHeaders['content-type']).toEqual('text/plain');
  expect(downloadBody.length).toBeGreaterThan(1);
});

//more TIFF tests, because I can't figure this out
test('download whole item tiff, full resolution', async ({ request, page }) => {
  //this fails at the callback
  //initialResponse returns <html><body>Restricted</body></html> instead of JSON

  var currentTime = new Date().getTime();

  const initialResponse = await request.get(
    'http://apache:8080/cgi/imgsrv/download/image?id=test.pd_open&format=image%2Ftiff&target_ppi=0&bundle_format=zip&callback=tunnelCallback&_=' +
      currentTime
  );
  const initialBody = await initialResponse.text();

  // console.log(initialBody);

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

  // wait until status is done
  let done = false;

  while (done == false) {
    const callbackResponse = await request.get('http://apache:8080' + callbackUrl);
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

  const downloadResponse = await request.get('http://apache:8080' + downloadUrl);
  const downloadHeaders = downloadResponse.headers();
  const downloadBody = await downloadResponse.text();

  expect(downloadResponse.status()).toEqual(200);
  // expect(downloadHeaders['content-disposition']).toMatch(/^attachment; filename=test-pd_open-\d+.pdf$/);
  expect(downloadHeaders['content-type']).toEqual('application/javascript');
  // expect(downloadBody.length).toBeGreaterThan(512 * 1024);
});
//maybe a whole item jpeg will work??
test('download whole item jpeg, high resolution', async ({ request, page }) => {
  //nope, this fails, too
  //Restricted
  var currentTime = new Date().getTime();

  const initialResponse = await request.get(
    'http://apache:8080/cgi/imgsrv/download/image?id=test.pd_open&format=image%2Fjpeg&target_ppi=300&bundle_format=zip&callback=tunnelCallback&_=' +
      currentTime
  );
  const initialBody = await initialResponse.text();

  // console.log(initialBody);

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

  // wait until status is done
  let done = false;

  while (done == false) {
    const callbackResponse = await request.get('http://apache:8080' + callbackUrl);
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

  const downloadResponse = await request.get('http://apache:8080' + downloadUrl);
  const downloadHeaders = downloadResponse.headers();
  const downloadBody = await downloadResponse.text();

  expect(downloadResponse.status()).toEqual(200);
  // expect(downloadHeaders['content-disposition']).toMatch(/^attachment; filename=test-pd_open-\d+.pdf$/);
  expect(downloadHeaders['content-type']).toEqual('application/javascript');
  // expect(downloadBody.length).toBeGreaterThan(512 * 1024);
});
