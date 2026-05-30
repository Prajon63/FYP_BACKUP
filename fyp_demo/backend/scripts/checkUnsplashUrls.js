import { readFileSync } from 'fs';

const text = readFileSync(new URL('../seedData.js', import.meta.url), 'utf8');
const urls = [...new Set(text.match(/https:\/\/images\.unsplash\.com\/[^'"]+/g) || [])];
const bad = [];

for (const url of urls) {
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (!r.ok) bad.push({ status: r.status, url });
  } catch (e) {
    bad.push({ status: e.message, url });
  }
}

console.log(`Checked ${urls.length} URLs, ${bad.length} failed`);
bad.forEach((b) => console.log(b.status, b.url));
