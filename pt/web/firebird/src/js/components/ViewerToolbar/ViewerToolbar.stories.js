import ViewerToolbarStory from './ViewerToolbarStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';

export default {
  title: 'Components/ViewerToolbar',
  component: ViewerToolbarStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

export const Default = {
  args: { zoomIn: true, zoomOut: true },
};

export const ZoomInDisabled = {
  args: { zoomIn: false, zoomOut: true },
};

export const ZoomOutDisabled = {
  args: { zoomIn: true, zoomOut: false },
};
