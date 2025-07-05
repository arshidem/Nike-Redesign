const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Use absolute path and ensure directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Improved storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const randomString = crypto.randomBytes(16).toString('hex');
    const uniqueSuffix = `${Date.now()}-${randomString}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
  }
});

// Enhanced file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|avif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Error: Only images (JPEG, PNG, WEBP, AVIF) are allowed!'), false);
};

// Create Multer instance with better limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 52, // Maximum number of files
    fields: 20, // For other form fields,
    parts:100
  }
});

// Cleanup middleware for failed uploads
upload.cleanupOnError = (err, req, res, next) => {
  if (req.files) {
    Object.values(req.files).flat().forEach(file => {
      fs.unlink(file.path, () => {});
    });
  }
  next(err);
};

module.exports = upload;