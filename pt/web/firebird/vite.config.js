import { defineConfig } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { globSync } from 'node:fs';

const files = globSync(path.resolve(import.meta.dirname, 'src') + '/**/*.html').reduce((acc, cur) => {
  let name = cur
    .replace(path.join(import.meta.dirname) + '/src/', '')
    .replace('.html', '')
    .replace('/', '-');
  console.log(name, '->', cur);
  acc[name] = cur;
  return acc;
}, {});

const firebird =
  process.env.NODE_ENV === 'development'
    ? path.resolve(import.meta.dirname, '../../../firebird-common')
    : path.resolve(import.meta.dirname, 'node_modules/firebird-common');

const removeStylesheet = () => ({
  name: 'remove-stylesheet',
  enforce: 'post',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replaceAll(/<link\s+rel="stylesheet"(\s.*\s)href="(.*)\.css">/gi, '');
  },
});

export default defineConfig({
  plugins: [svelte({ preprocess: vitePreprocess() }), removeStylesheet()],
  root: path.resolve(import.meta.dirname, 'src'),
  build: {
    manifest: 'manifest.json',
    minify: false,
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    cssCodeSplit: false,
    rolldownOptions: {
      input: files,
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some((name) => name.endsWith('.css'))) {
            return `assets/index-[hash].[ext]`;
          }
          return assetInfo;
        },
      },
    },
  },
  resolve: {
    alias: { '~firebird-common': firebird },
    extensions: ['.mjs', '.js', '.ts', '.json', '.svelte', '.scss'],
  },
  server: {
    proxy: {
      '^/cgi/imgsrv/*': { target: 'https://babel.hathitrust.org', changeOrigin: true },
      '^/cgi/ping': { target: 'https://babel.hathitrust.org', changeOrigin: true },
    },
  },
  css: {
    preprocessorOptions: {
      scss: { quietDeps: true },
    },
  },
});
