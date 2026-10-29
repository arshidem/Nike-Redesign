import legacyMedia from "../lib/legacyMedia.json";
const archived = new Set(legacyMedia);
export function mediaUrl(value) {
  if (typeof value !== 'string' || !value) return '/assets/editorial/image-unavailable.svg';
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    const name = url.pathname.split('/').at(-1);
    if (url.pathname.startsWith('/uploads/') && archived.has(name)) return `/uploads/${name}`;
    return value;
  }
  const normalized = value.replace(/\\/g, '/');
  const relative = normalized.includes('uploads/') ? normalized.slice(normalized.indexOf('uploads/')) : normalized.replace(/^\/+/, '');
  return `/${relative}`;
}
