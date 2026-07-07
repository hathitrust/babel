import PanelStory from './PanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';

export default {
  title: 'Components/Panel',
  component: PanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

export const Expanded = {
  args: { expanded: true },
};

export const Collapsed = {
  args: { expanded: false },
};
