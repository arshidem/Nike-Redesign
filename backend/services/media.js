const crypto = require('node:crypto');
const cloudinary = require('../config/cloudinary');
function configured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}
function verifiedUpload(file, userId) {
  if (!configured()) throw Object.assign(new Error('Media storage is not configured'), { status: 503 });
  const publicId = String(file.public_id || '');
  if (!publicId.startsWith(`nike/${userId}/`) || !/^nike\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_/-]+$/.test(publicId) || !Number.isSafeInteger(file.version) || !['jpg','jpeg','png','webp','avif'].includes(file.format)) throw Object.assign(new Error('Invalid image reference'), { status: 400 });
  const signature = cloudinary.utils.api_sign_request({ public_id: publicId, version: file.version }, process.env.CLOUDINARY_API_SECRET);
  if (typeof file.signature !== 'string' || file.signature.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(file.signature), Buffer.from(signature))) throw Object.assign(new Error('Image signature is invalid'), { status: 400 });
  return { fieldname: file.fieldname, path: cloudinary.url(publicId, { secure: true, resource_type: 'image', type: 'upload', version: file.version, format: file.format }) };
}
async function removeMedia(url) {
  // Legacy /uploads assets are an immutable public archive. Only delete our Cloudinary assets.
  if (typeof url !== 'string' || !configured()) return;
  try {
    const parsed = new URL(url);
    const prefix = `/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
    if (parsed.hostname !== 'res.cloudinary.com' || !parsed.pathname.startsWith(prefix)) return;
    const publicId = parsed.pathname.slice(prefix.length).replace(/^v\d+\//, '').replace(/\.[a-zA-Z0-9]+$/, '');
    if (!publicId.startsWith('nike/')) return;
    await cloudinary.uploader.destroy(publicId);
  } catch { console.error('media_cleanup_failed'); }
}
module.exports = { configured, verifiedUpload, removeMedia };
