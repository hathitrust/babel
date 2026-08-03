import MetadataPanelStory from './MetadataPanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';

export default {
  title: 'Components/MetadataPanel',
  component: MetadataPanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

export const Default = {};

export const CustomMetadata = {
  args: {
    title: 'Adventures of Huckleberry Finn',
    author: 'Mark Twain',
    publisher: 'Charles L. Webster And Company',
    date: '1885',
  },
};
