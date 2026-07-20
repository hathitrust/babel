import SearchInItemPanelStory from './SearchInItemPanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';

export default {
  title: 'Components/SearchInItemPanel',
  component: SearchInItemPanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

export const Default = {};

export const WithResults = {
  args: {
    q1: 'river',
    payload: {
      q1: 'river',
      totalResults: 2,
      startRecord: 1,
      endRecord: 2,
      finalAccessStatus: 'allow',
      range: { value: 1, min: 1, max: 1 },
      next: null,
      prev: null,
      results: [
        { seq: 12, pageNum: '8', termHitCount: 2, kwics: ['down the <em>river</em> on a raft with Jim'] },
        { seq: 45, pageNum: '41', termHitCount: 1, kwics: ['the <em>river</em> was a mile wide'] },
      ],
    },
  },
};
