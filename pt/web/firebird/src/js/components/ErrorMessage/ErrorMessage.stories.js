import ErrorMessage from './index.svelte';

export default {
  title: 'Error Message',
  component: ErrorMessage,
  globals: {
    viewport: { value: 'bsXl' },
  },
};

export const TemporarilyUnavailable = {
  args: {
    status: '429',
    rayID: 'a3eb3b119c06bf8e',
  },
};

export const Forbidden = {
  args: {
    status: '403',
    rayID: 'a596ad2b3f4935c4',
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
