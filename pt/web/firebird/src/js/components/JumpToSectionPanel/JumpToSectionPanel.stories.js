import JumpToSectionPanelStory from './JumpToSectionPanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';

export default {
  title: 'Components/JumpToSectionPanel',
  component: JumpToSectionPanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

export const Default = {};

export const WithSections = {
  args: {
    sectionList: [
      { label: 'Title Page', page: 'i', seq: 3, url: '#' },
      { label: 'Table of Contents', page: 'v', seq: 7, url: '#' },
      { label: 'Chapter 1', page: '1', seq: 12, url: '#' },
      { label: 'Index', page: null, seq: 340, url: '#' },
    ],
  },
};
