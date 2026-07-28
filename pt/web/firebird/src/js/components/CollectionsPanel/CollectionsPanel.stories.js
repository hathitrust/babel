import CollectionsPanelStory from './CollectionsPanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';

export default {
  title: 'Components/CollectionsPanel',
  component: CollectionsPanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

export const Anonymous = {
  args: { loggedIn: false },
};

export const LoggedIn = {
  args: { loggedIn: true },
};
