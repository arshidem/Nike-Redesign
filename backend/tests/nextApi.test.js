const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

test('combined API exposes health and preserves authorization on existing and upload routes', async () => {
  const dbPath = require.resolve('../config/db');
  const previous = require.cache[dbPath];
  let connections = 0;
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: async () => { connections++; } };
  delete require.cache[require.resolve('../app')];
  const app = require('../app')();
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200); assert.equal((await health.json()).status, 'ok'); assert.equal(connections, 0);
    for (const route of ['/api/auth/me','/api/admin/users','/api/interests']) {
      const response = await fetch(`${base}${route}`); assert.equal(response.status, 401, route);
    }
    const media = await fetch(`${base}/api/media/sign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ purpose: 'product' }) });
    assert.equal(media.status, 401);
    const missing = await fetch(`${base}/api/does-not-exist`); assert.equal(missing.status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (previous) require.cache[dbPath] = previous; else delete require.cache[dbPath];
    delete require.cache[require.resolve('../app')];
  }
});

test('Cloudinary references reject forged signatures, foreign owners, and arbitrary URLs', () => {
  const env = { CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: 'test-secret' };
  const previous = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  Object.assign(process.env, env);
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({ cloud_name: 'test-cloud', api_key: 'test-key', api_secret: 'test-secret' });
  const { verifiedUpload } = require('../services/media');
  const file = { fieldname: 'featuredImg', public_id: 'nike/user1/folder/photo', version: 123, format: 'png', secure_url: 'https://attacker.example/picture.png' };
  file.signature = cloudinary.utils.api_sign_request({ public_id: file.public_id, version: file.version }, env.CLOUDINARY_API_SECRET);
  try {
    const result = verifiedUpload(file, 'user1');
    assert.match(result.path, /^https:\/\/res.cloudinary.com\/test-cloud\/image\/upload\/v123\/nike\/user1\/folder\/photo.png$/);
    assert.ok(!result.path.includes('attacker'));
    assert.throws(() => verifiedUpload({ ...file, signature: 'x'.repeat(40) }, 'user1'), /signature/);
    assert.throws(() => verifiedUpload(file, 'different-user'), /reference/);
  } finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});
