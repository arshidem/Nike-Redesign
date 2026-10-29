import axios from 'axios';
/** Send file bytes directly to durable storage, never through a Vercel Function body. */
export async function prepareMediaData(formData, token, purpose) {
  const data = {}, files = [];
  for (const [fieldname, value] of formData.entries()) {
    if (value instanceof File && value.size) files.push({ fieldname, file: value });
    else if (!(value instanceof File)) data[fieldname] = value;
  }
  data.uploadedFiles = [];
  if (!files.length) return data;
  const { data: signed } = await axios.post('/api/media/sign', { purpose }, { headers: { Authorization: `Bearer ${token}` } });
  // Sequential uploads bound memory and avoid flooding the media provider.
  for (const { fieldname, file } of files) {
    if (!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Use JPEG, PNG, WebP, or AVIF images up to 10 MB.');
    const body = new FormData();
    body.append('file', file);
    for (const key of ['api_key','timestamp','signature','folder']) body.append(key, signed[key]);
    const { data: image } = await axios.post(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloud_name)}/image/upload`, body);
    data.uploadedFiles.push({ fieldname, public_id: image.public_id, version: image.version, signature: image.signature, format: image.format });
  }
  return data;
}
