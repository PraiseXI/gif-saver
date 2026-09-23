export function parseGifUrl(value: string): URL | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
}

export function gifFilename(url: URL): string {
  const raw = url.pathname.split('/').pop() || 'gif';
  let last: string;
  try {
    last = decodeURIComponent(raw);
  } catch {
    last = raw;
  }
  const clean = last.replace(/[^a-z0-9._-]/gi, '-').replace(/\.+$/, '').slice(0, 80);
  return (clean || 'animation').replace(/\.[^.]+$/, '') + '.gif';
}
