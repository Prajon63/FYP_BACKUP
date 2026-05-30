import { readFileSync } from 'fs';

// Load testUsers by importing seed - easier to eval profilePicture lines
const text = readFileSync(new URL('../seedData.js', import.meta.url), 'utf8');

// Extract photo IDs from profilePicture lines
const lines = text.split('\n').filter((l) => l.includes('profilePicture:'));
const entries = [];

for (const line of lines) {
  const m = line.match(/photo-([a-z0-9-]+)/);
  if (m) entries.push({ id: m[0], line: line.trim().slice(0, 80) });
  else entries.push({ id: line, line: line.trim().slice(0, 80) });
}

const byId = new Map();
for (const e of entries) {
  if (!byId.has(e.id)) byId.set(e.id, []);
  byId.get(e.id).push(e);
}

for (const [id, list] of byId) {
  if (list.length > 1) {
    console.log('DUPLICATE', id, 'x', list.length);
    list.forEach((x) => console.log(' ', x.line));
  }
}

console.log('total profiles', entries.length, 'unique ids', byId.size);
