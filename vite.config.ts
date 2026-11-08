import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { precacheManifest, serviceWorkerSource } from './src/pwa/precache';

async function assetsIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? assetsIn(path) : [path];
  }));
  return nested.flat();
}

export default defineConfig({
  base: './',
  plugins: [{
    name: 'graphcalc-offline',
    apply: 'build',
    async writeBundle(options) {
      const directory = resolve(options.dir ?? 'dist');
      const paths = (await assetsIn(directory)).filter(path => relative(directory, path) !== 'sw.js');
      const assets = await Promise.all(paths.map(async path => ({
        path: relative(directory, path).replaceAll('\\', '/'),
        digest: createHash('sha256').update(await readFile(path)).digest('hex'),
      })));
      await writeFile(resolve(directory, 'sw.js'), serviceWorkerSource(precacheManifest(assets)));
    },
  }],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'katex', test: /node_modules[\\/]katex/ },
            { name: 'three-core', test: /three[\\/]build[\\/]three\.core\.js/ },
            { name: 'three-renderer', test: /three[\\/]build[\\/]three\.module\.js/ },
          ],
        },
      },
    },
  },
});
