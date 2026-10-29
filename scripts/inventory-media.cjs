const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const destination = path.join(process.cwd(), 'public/uploads');
const manifestPath = path.join(process.cwd(), 'nike/src/lib/legacyMedia.json');
function writeManifest() {
  fs.mkdirSync(destination, { recursive: true });
  const names = fs.readdirSync(destination).filter(name => /^[\w.-]+\.(?:jpg|jpeg|png|webp|avif)$/i.test(name)).sort();
  fs.writeFileSync(manifestPath, JSON.stringify(names, null, 2) + '\n');
  return names;
}
async function main() {
  if (process.argv.includes('--local-only')) { console.log(`Indexed ${writeManifest().length} archived images.`); return; }
  if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI in the environment for a read-only legacy-media inventory.');
  const importing = process.argv.includes('--import');
  let origin;
  if (importing) { origin = new URL(process.env.LEGACY_MEDIA_ORIGIN || ''); if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search) throw new Error('LEGACY_MEDIA_ORIGIN must be an HTTPS origin without credentials or a path.'); }
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000, maxPoolSize: 2 });
  const files = new Set();
  const collect = value => {
    if (typeof value === 'string' && /uploads[\\/]/.test(value)) {
      const normalized = value.replace(/\\/g, '/'); const name = normalized.slice(normalized.lastIndexOf('/') + 1);
      if (/^[\w.-]+\.(?:jpg|jpeg|png|webp|avif)$/i.test(name)) files.add(name);
    } else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  try {
    const projections = { products: { featuredImg: 1, variants: 1 }, reviews: { images: 1 }, orders: { items: 1 }, carts: { items: 1 }, users: { profilePicture: 1 }, interests: { image: 1 } };
    for (const [collection, projection] of Object.entries(projections)) {
      for await (const document of mongoose.connection.db.collection(collection).find({}, { projection })) collect(document);
    }
    let missing = [...files].filter(name => !fs.existsSync(path.join(destination, name)));
    console.log(JSON.stringify({ referenced: files.size, missing: missing.length, missingFiles: missing }, null, 2));
    if (importing) for (const name of missing) {
      const response = await fetch(new URL(`/uploads/${encodeURIComponent(name)}`, origin), { signal: AbortSignal.timeout(15000), redirect: 'error' });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Could not import image ${name}`);
      const contentLength = Number(response.headers.get('content-length') || 0);
      if (contentLength > 20 * 1024 * 1024) throw new Error(`Image ${name} exceeds the import limit.`);
      const chunks = []; let size = 0;
      for await (const chunk of response.body) { size += chunk.length; if (size > 20 * 1024 * 1024) throw new Error(`Image ${name} exceeds the import limit.`); chunks.push(chunk); }
      fs.mkdirSync(destination, { recursive: true }); fs.writeFileSync(path.join(destination, name), Buffer.concat(chunks));
    }
    writeManifest();
    missing = [...files].filter(name => !fs.existsSync(path.join(destination, name)));
    if (missing.length) { console.error('Legacy images are still missing. Keep the old host until they are copied.'); process.exitCode = 1; }
    else console.log('All referenced legacy upload filenames are present locally. No database records were changed.');
  } finally { await mongoose.disconnect(); }
}
main().catch(() => { console.error('Legacy-media inventory/import failed. Check the database connection, source origin, and file availability.'); process.exitCode = 1; });
