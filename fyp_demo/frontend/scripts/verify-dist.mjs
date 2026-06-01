import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('verify-dist: missing dist/index.html — run vite build first');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const assetsDir = path.join(distDir, 'assets');
const jsFiles = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'))
  : [];

if (html.includes('/src/main.tsx')) {
  console.error(
    'verify-dist: dist/index.html still references /src/main.tsx — publish directory must be dist/, not the source folder'
  );
  process.exit(1);
}

if (!html.includes('/assets/') || jsFiles.length === 0) {
  console.error('verify-dist: dist/index.html has no built JS bundle in assets/');
  process.exit(1);
}

console.log('verify-dist: OK — production bundle ready');
