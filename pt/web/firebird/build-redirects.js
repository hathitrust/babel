#!/usr/bin/env node

import { chdir } from 'node:process';
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const redirects = [];
chdir('dist/assets');
let filenames = readdirSync('.');
filenames.forEach((filename) => {
  let match;
  if ( match = filename.match(/(\w+)-[^\.]+\.(js|css)/) ) {
    let ext = match[2];
    let basename = match[1];
    redirects.push(`/assets/${basename}.${ext} /assets/${filename} 200`);
  }
})

writeFileSync('../_redirects', redirects.join("\n"))

let headers = `/*
  Access-Control-Allow-Origin: *
`;
writeFileSync('../_headers', headers)

console.log("-- created _redirects and _headers")
