/**
 * Render may serve 0-byte stubs at SPA paths and skip rewrites.
 * Copy index.html to each static route path so F5 on /discover, /home, etc. works.
 */
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('copy-spa-fallbacks: dist/index.html missing — run vite build first');
  process.exit(1);
}

const html = fs.readFileSync(indexPath);

/** Paths that match App.tsx routes (no dynamic :params). */
const staticPaths = [
  'home',
  'discover',
  'matches',
  'messages',
  'settings',
  'about',
  'forgot-password',
  'profile',
  'preferences/setup',
];

for (const routePath of staticPaths) {
  const target = path.join(distDir, routePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
}

console.log(`copy-spa-fallbacks: wrote index.html to ${staticPaths.length} route paths`);
