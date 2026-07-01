/** @type { import('@storybook/svelte-vite').StorybookConfig } */

import path from 'path';

const config = {
  framework: '@storybook/svelte-vite',
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|svelte)'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs', '@storybook/addon-a11y'],
  docs: {},
  async viteFinal(config, { configType }) {
    const { mergeConfig } = await import('vite');

    if (configType === 'PRODUCTION') {
      config.plugins = config.plugins.filter((plugin) => {
        return plugin.name !== 'postbuild-commands';
      });
    }
    return mergeConfig(config, {
      plugins: [
        {
          name: 'inject-preview-css',
          enforce: 'post',
          generateBundle(options, bundle) {
            const cssChunk = Object.values(bundle).find(
              (chunk) => chunk.type === 'asset' && chunk.name === 'style.css'
            );

            if (cssChunk) {
              const iframeHtml = Object.values(bundle).find(
                (chunk) => chunk.type === 'asset' && chunk.fileName === 'iframe.html'
              );

              if (iframeHtml) {
                iframeHtml.source = iframeHtml.source.replace(
                  '</head>',
                  `  <link rel="stylesheet" href="./${cssChunk.fileName}">\n</head>`
                );
              }
            }
          },
        },
      ],
      resolve: {
        alias: { '~firebird-common': path.resolve(import.meta.dirname, '../node_modules/firebird-common') },
      },
      build: {
        cssCodeSplit: false,
        rollupOptions: {
          external: [/^\.\.\/fonts/, /^\/common\/firebird/],
        },
      },
    });
  },
};
export default config;
