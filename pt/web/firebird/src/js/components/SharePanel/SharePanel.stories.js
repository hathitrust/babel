import SharePanelStory from './SharePanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';

export default {
  title: 'Components/SharePanel',
  component: SharePanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

export const Default = {};
