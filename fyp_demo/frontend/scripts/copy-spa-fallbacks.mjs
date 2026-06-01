/**
 * Render may serve extensionless route stubs as downloads (F5 prompts to save "home").
 * Use <route>/index.html so the CDN serves text/html correctly.
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
  const dir = path.join(distDir, routePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

console.log(
  `copy-spa-fallbacks: wrote index.html under ${staticPaths.length} route folders`
);
