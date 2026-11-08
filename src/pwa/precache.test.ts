import { expect, it } from 'vitest';
import { precacheManifest } from './precache';

it('includes nested assets with relative paths and excludes the worker itself', () => {
  expect(precacheManifest([{path:'icons/icon-192.png',digest:'a'}, {path:'index.html',digest:'b'}, {path:'sw.js',digest:'old'}]).urls)
    .toEqual(['./icons/icon-192.png', './index.html']);
});
it('is stable across traversal order without mutating inputs', () => {
  const files = [{path:'index.html',digest:'a'}, {path:'assets/main.js',digest:'b'}];
  expect(precacheManifest(files)).toEqual(precacheManifest([...files].reverse()));
  expect(files[0]?.path).toBe('index.html');
});
it('invalidates the cache for changed content, added, removed or renamed files', () => {
  const original = [{path:'index.html',digest:'a'}];
  for (const changed of [[], [{path:'index.html',digest:'b'}], [{path:'other.html',digest:'a'}], [...original,{path:'new.js',digest:'c'}]]) {
    expect(precacheManifest(changed).version).not.toBe(precacheManifest(original).version);
  }
});
