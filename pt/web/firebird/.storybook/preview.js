import '~firebird-common/src/scss/styles.scss';
import '../src/scss/styles.scss';
import * as bootstrap from 'bootstrap';

const BOOTSTRAP_VIEWPORTS = {
  bsXs: {
    name: 'XS: <576px',
    styles: {
      width: '400px',
      height: '800px',
    },
  },
  bsSm: {
    name: 'SM: 576-767px',
    styles: {
      width: '600px',
      height: '1200px',
    },
  },
  bsMd: {
    name: 'MD: 768-991px',
    styles: {
      width: '850px',
      height: '1200px',
    },
  },
  bsLg: {
    name: 'LG: 992-1199px',
    styles: {
      width: '1050px',
      height: '1200px',
    },
  },
  bsXl: {
    name: 'XL: 1200-1399px',
    styles: {
      width: '1200px',
      height: '1200px',
    },
  },
  shortDesktop: {
    name: 'short desktop',
    styles: {
      width: '1200px',
      height: '600px',
    },
  },
};

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },

    viewport: {
      options: BOOTSTRAP_VIEWPORTS,
    },

    a11y: {
      test: 'todo',
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'light',
    },
    viewport: {
      value: 'bsXl',
      isRotated: false,
    },
  },
};

export default preview;
