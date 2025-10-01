import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'url';
import fs from 'fs';

test.describe('imgsrv download', () => {

  // make sure we have appropriate session cookies etc before calling imgsrv
  test.beforeEach(async ({ page }) => {
    await page.goto('/cgi/pt?id=test.pd_open');
    //accept the cookie banner before each test
    await page.getByRole('button', { name: 'Allow all cookies' }).click();
  });

  test('download whole item jpeg, full resolution', async ({ request, page }) => {

    var currentTime = new Date().getTime();

    const initialResponse = await request.get('http://apache-test:8080/cgi/imgsrv/download/pdf?id=test.pd_open&callback=tunnelCallback&_=' + currentTime);
    const initialBody = await initialResponse.text();
//    console.log(body.toString());

    // should get a result like:
   // tunnelCallback('/cgi/imgsrv/download-status?id=test.pd_open;marker=2K16.11c2110ec3cb660ecda8bd61c5d456b056701b164120987adabc159e0135e0b0a0', '/cgi/imgsrv/download/pdf?id=test.pd_open;marker=2K16.11c2110ec3cb660ecda8bd61c5d456b056701b164120987adabc159e0135e0b0a0;attachment=1', 2, '1');
    
    
    const callbackParams = JSON.parse(
      initialBody
      .replace(/^tunnelCallback\(/,'[')
      .replace(/\);$/,']')
      .replaceAll("'",'"')
    );

    const callbackUrl = callbackParams[0];
    const downloadUrl = callbackParams[1];

    //    console.log(callbackParams)

    // wait until status is done
    let done = false;

    while(done == false) {
      console.log("Trying to get " + callbackUrl);

      const callbackResponse = await request.get('http://apache-test:8080' + callbackUrl);
      const callbackJson = await callbackResponse.json()

      console.log(callbackJson);
      if(callbackJson.status == "DONE") { 
        done = true
      } else {
        // wait for 1 second
        // await page.waitForTimeout(1000);
        // yes it's polling and polling is bad but that's the way imgsrv works 😿
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        await delay(1000);
      }
    }

    const downloadResponse = await request.get('http://apache-test:8080' + downloadUrl);
    const downloadHeaders = downloadResponse.headers();
    const downloadBody = await downloadResponse.text();

    expect(downloadResponse.status()).toEqual(200);
    expect(downloadHeaders['content-disposition']).toMatch(/^attachment; filename=test-pd_open-\d+.pdf$/);
    expect(downloadHeaders['content-type']).toEqual("application/pdf");
    expect(downloadBody.length).toBeGreaterThan(512 * 1024);
  });
});
