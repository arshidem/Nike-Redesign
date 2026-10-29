const { verifiedUpload } = require('../services/media');
function references(mode, allowedField, maximum = 52) {
  return (req, res, next) => {
    try {
      if (req.is('multipart/form-data')) return res.status(415).json({ message: 'Upload images directly using /api/media/sign, then submit JSON image references.' });
      const incoming = req.body.uploadedFiles || [];
      if (!Array.isArray(incoming) || incoming.length > maximum) return res.status(400).json({ message: 'Invalid image references' });
      const files = incoming.map(file => {
        if (!file || typeof file.fieldname !== 'string' || (allowedField ? file.fieldname !== allowedField : !/^(featuredImg|variant_\d{1,2}_images)$/.test(file.fieldname))) throw Object.assign(new Error('Invalid image field'), { status: 400 });
        return verifiedUpload(file, req.user._id.toString());
      });
      const grouped = Object.groupBy(files, file => file.fieldname);
      if ((grouped.featuredImg?.length || 0) > 1) return res.status(400).json({ message: 'Only one featured image is allowed' });
      req.files = mode === 'fields' ? grouped : files;
      if (mode === 'any') for (const [name, entries] of Object.entries(grouped)) req.files[name] = entries;
      next();
    } catch (error) { next(error); }
  };
}
module.exports = { any: () => references('any'), fields: () => references('fields'), array: (field, maximum) => references('array', field, maximum) };
