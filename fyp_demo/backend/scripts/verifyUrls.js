const urls = process.argv.slice(2);
for (const url of urls) {
  const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  console.log(r.status, url.split('photo-')[1]?.slice(0, 30));
}
