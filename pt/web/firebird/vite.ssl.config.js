import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import pkg from "svelte-preprocess";
const { scss } = pkg;
import path from "node:path";
import glob from 'fast-glob';

import basicSsl from '@vitejs/plugin-basic-ssl';

// Find all HTML files and build an object of names and paths to work from
const files = glob.sync(path.resolve(__dirname, 'src') + '/**/*.html').reduce((acc, cur) => {
  // we want to keep the path
  let name = cur.replace(path.join(__dirname) + '/src/', '').replace('.html', '').replace('/', '-');

  // let name = path.basename(cur, '.html');
  console.log(name, "->", cur);

  acc[name] = cur;
  return acc;
}, {});

const scssOptions = {
  quietDeps: true,
};
if ( process.env.NODE_ENV == 'development' ) {
  scssOptions.additionalData = `$firebird-font-path: "//localhost:8173"; $fa-font-path: "//localhost:8173/fonts";`;
}

export default defineConfig({
  plugins: [
    svelte({
      preprocess: [scss({})],
    }),
    basicSsl(),
  ],
  root: path.resolve(__dirname, "src"),
  resolve: {
    alias: {
      "~bootstrap": path.resolve(__dirname, "node_modules/bootstrap"),
      "~firebird-common": path.resolve(__dirname, "node_modules/firebird-common"),
    },
    extensions: [".mjs", ".js", ".ts", ".json", ".svelte", ".scss"],
  },
  server: {
    proxy: {
      '^/cgi/imgsrv/*': {
        target: 'https://babel.hathitrust.org',
        changeOrigin: true
      },
      '^/cgi/ping': {
        target: 'https://babel.hathitrust.org',
        changeOrigin: true
      },
    }
  },
  css: {
    preprocessorOptions: {
      scss: scssOptions
    },
  },
})
