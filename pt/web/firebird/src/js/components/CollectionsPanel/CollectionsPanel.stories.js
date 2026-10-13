import CollectionsPanelStory from './CollectionsPanelStory.svelte';
import ManifestDecorator from '../../decorators/ManifestDecorator.svelte';
import { screen, expect } from 'storybook/test';

export default {
  title: 'Components/CollectionsPanel',
  component: CollectionsPanelStory,
  decorators: [() => ({ Component: ManifestDecorator })],
};

export const Anonymous = {
  args: { loggedIn: false },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Collections' }));

    await expect(canvas.getByText('Log in to make your personal collections permanent.')).toBeVisible();
  },
};

export const LoggedIn = {
  args: { loggedIn: true },
};

export const OpenCollectionModal = {
  args: { loggedIn: true },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Collections' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Add' }));

    const dialog = await screen.findByRole('dialog', { name: 'New Collection' });
    await expect(dialog).toBeVisible();
  },
};

export const CollectionModalHasWarning = {
  args: { loggedIn: false },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Collections' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Add' }));

    const dialog = await screen.findByRole('dialog', { name: 'New Collection' });
    await expect(dialog).toBeVisible();

    await expect(dialog).toHaveTextContent('This collection will be temporary.');
  },
};
