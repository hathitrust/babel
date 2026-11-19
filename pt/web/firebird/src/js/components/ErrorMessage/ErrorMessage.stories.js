import ErrorMessage from './index.svelte';
import { expect, spyOn, waitFor } from 'storybook/test';

const _mtm = (window._mtm = window._mtm || []);

export default {
  title: 'Error Message',
  component: ErrorMessage,
  globals: {
    viewport: { value: 'bsXl' },
  },
  beforeEach: () => {
    window._mtm = [];
    spyOn(window._mtm, 'push');
  },
};

export const TemporarilyUnavailable = {
  args: {
    status: '429',
    rayID: 'a3eb3b119c06bf8e',
  },
  play: async () => {
    await waitFor(() => {
      expect(window._mtm.push).toHaveBeenCalledWith({
        event: 'pt-imgsrv-error',
        errorStatus: '429',
      });
    });
  },
};

export const Forbidden = {
  args: {
    status: '403',
    rayID: 'a596ad2b3f4935c4',
  },
  play: async () => {
    await waitFor(() => {
      expect(window._mtm.push).toHaveBeenCalledWith({
        event: 'pt-imgsrv-error',
        errorStatus: '403',
      });
    });
  },
};

export const Medium403 = {
  globals: {
    viewport: { value: 'bsSm' },
  },
  args: {
    status: '403',
    rayID: 'a3eb3b119c06bf8e',
  },
};

export const Mobile403 = {
  globals: {
    viewport: { value: 'bsXs' },
  },
  args: {
    status: '403',
    rayID: 'a3eb3b119c06bf8e',
  },
};
