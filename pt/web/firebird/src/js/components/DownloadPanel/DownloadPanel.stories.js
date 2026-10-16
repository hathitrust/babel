import DownloadPanelStory from './DownloadPanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';
import { expect, userEvent, waitFor, within, screen } from 'storybook/test';
import { http, HttpResponse, delay } from 'msw';

export default {
  title: 'Components/DownloadPanel',
  component: DownloadPanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

const clickDownloadForModal = async ({ canvas, userEvent }) => {
  const btn = canvas.getByRole('button', { name: 'Download' });
  await userEvent.click(btn);

  const downloadForm = await canvas.findByRole('form', { name: 'Download options' });
  await userEvent.click(within(downloadForm).getByRole('button', { name: 'Download' }));

  const dialog = await screen.findByRole('dialog');
  await expect(dialog).toBeVisible();
};

export const NotAllowed = {
  args: { allowFullDownload: false, allowSinglePageDownload: false },
};

export const SinglePageOnly = {
  args: { allowFullDownload: false, allowSinglePageDownload: true },
};

export const FullDownloadAllowed = {
  args: { allowFullDownload: true, allowSinglePageDownload: true },
};

const statusUrl = '/cgi/imgsrv/download-status?id=test.storybook_item;marker=MOCK';
const downloadUrl = '/cgi/imgsrv/download/pdf?id=test.storybook_item;marker=MOCK;attachment=1';
const statusBody = (extra) => ({
  message: null,
  total_pages: 5,
  download_url: downloadUrl,
  ...extra,
});
export const FullPDFDownload = {
  beforeEach({ msw }) {
    let poll = 0;
    msw.use(
      //intercepts all requests to this path, which will return the jsonp callback
      http.get(`*/cgi/imgsrv/download/pdf`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        if (params.has('stop')) return new HttpResponse('tunnelCallback();');

        return new HttpResponse(`tunnelCallback('${statusUrl}', '${downloadUrl}', 5, '1')`);
      }),
      http.get('*/cgi/imgsrv/download-status', () => {
        // if (failStatus) return new HttpResponse(null, { status: 500 });

        let pages = [1, 3];
        const i = poll++;
        if (i < pages.length) {
          return HttpResponse.json(statusBody({ status: 'RUNNING', current_page: pages[i] }));
        }
        return HttpResponse.json(statusBody({ status: 'DONE', current_page: -1 }));
      })
    );
  },
  args: { allowFullDownload: true, allowSinglePageDownload: true },
  play: clickDownloadForModal,
};
