import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import pkg from 'svelte-preprocess';
const { scss } = pkg;
import path from 'node:path';
import glob from 'fast-glob';
import fs from 'fs';

// Find all HTML files and build an object of names and paths to work from
const files = glob.sync(path.resolve(__dirname, 'src') + '/**/*.html').reduce((acc, cur) => {
  // we want to keep the path
  let name = cur
    .replace(path.join(__dirname) + '/src/', '')
    .replace('.html', '')
    .replace('/', '-');

  // let name = path.basename(cur, '.html');
  console.log(name, '->', cur);

  acc[name] = cur;
  return acc;
}, {});

const scssOptions = {
  quietDeps: true,
};
// if (process.env.NODE_ENV == 'development') {
//   scssOptions.additionalData = `$firebird-font-path: "//localhost:8173"; $fa-font-path: "//localhost:8173/fonts";`;
// }
let firebird;
if (process.env.NODE_ENV == 'development') {
  // firebird = path.resolve('/htapps/babel/firebird-common');
  firebird = path.resolve(__dirname, '../../../firebird-common');
} else {
  firebird = path.resolve(__dirname, 'node_modules/firebird-common');
}

const removeStylesheet = () => {
  return {
    name: 'remove-stylesheet',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replaceAll(/<link\s+rel="stylesheet"(\s.*\s)href="(.*)\.css">/gi, '');
    },
  };
};

export default defineConfig({
  plugins: [
    svelte({
      preprocess: [scss({})],
    }),
    //custom vite plugin to rewrite the name of the CSS file in manifest.json
    //hopefully temporary workaround until we can upgrade to svelte 5/vite 6
    {
      name: 'postbuild-commands',
      closeBundle: () => {
        const path = 'dist/manifest.json';
        const manifest = JSON.parse(fs.readFileSync(path).toString());
        if (manifest['style.css']) {
          const newKey = 'index.css';
          manifest[newKey] = manifest['style.css'];
          manifest['index.css'].file = manifest['index.css'].file.replace('style', 'index');
          delete manifest['style.css'];
          fs.writeFileSync(path, JSON.stringify(manifest, null, 2));
        }
      },
    },
    removeStylesheet(),
  ],
  root: path.resolve(__dirname, 'src'),
  build: {
    manifest: 'manifest.json',
    minify: false,
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: files,
      //renames the style asset file to index
      //hopefully temporary workaround until we can upgrade to svelte 5/vite 6
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name == 'style.css') {
            return `assets/index-[hash].[ext]`;
          }
          return assetInfo;
        },
      },
    },
  },
  resolve: {
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
      // "~firebird-common": path.resolve(__dirname, "node_modules/firebird-common"),
      '~firebird-common': firebird,
    },
    extensions: ['.mjs', '.js', '.ts', '.json', '.svelte', '.scss'],
  },
  server: {
    proxy: {
      '^/cgi/imgsrv/*': {
        target: 'https://babel.hathitrust.org',
        changeOrigin: true,
      },
      '^/cgi/ping': {
        target: 'https://babel.hathitrust.org',
        changeOrigin: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: scssOptions,
    },
  },
});
