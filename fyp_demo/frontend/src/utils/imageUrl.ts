/** Upgrade Unsplash URLs for reliable browser loading (auto=format, q=80). */
export function normalizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url?.trim()) return undefined;
  if (!url.includes('images.unsplash.com')) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    u.searchParams.set('q', '80');
    if (!u.searchParams.has('w')) u.searchParams.set('w', '400');
    if (!u.searchParams.has('fm')) u.searchParams.set('fm', 'jpg');
    return u.toString();
  } catch {
    return url;
  }
}

export function dicebearAvatar(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}
