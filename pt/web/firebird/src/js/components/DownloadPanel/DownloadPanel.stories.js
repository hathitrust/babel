import DownloadPanelStory from './DownloadPanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';

export default {
  title: 'Components/DownloadPanel',
  component: DownloadPanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
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
