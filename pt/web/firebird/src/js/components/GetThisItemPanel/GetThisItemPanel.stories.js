import GetThisItemPanelStory from './GetThisItemPanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';

export default {
  title: 'Components/GetThisItemPanel',
  component: GetThisItemPanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

// renders nothing when there are no external links, matching production behavior
export const Empty = {
  args: { externalLinks: [] },
};

export const WithLinks = {
  args: {
    externalLinks: [
      { type: 'oclc', href: 'https://www.worldcat.org/oclc/12345' },
      { type: 'service', href: 'https://www.google.com/books/edition/_/abc123', title: 'Google Books' },
      { type: 'external', href: 'https://www.gutenberg.org/ebooks/76', title: 'Project Gutenberg' },
    ],
  },
};
