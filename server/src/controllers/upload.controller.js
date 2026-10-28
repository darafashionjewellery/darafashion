import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, saveImage } from '../services/upload.service.js';

// Files are kept in memory only long enough to be converted and written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) =>
    ALLOWED_TYPES.includes(file.mimetype) ? cb(null, true) : cb(ApiError.badRequest('Only JPG, PNG, WebP, GIF or AVIF images can be uploaded.')),
});

/** Parses a single "file" field and turns multer errors into friendly API errors. */
export const uploadSingle = (req, res, next) =>
  upload.single('file')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return next(ApiError.badRequest(`Images must be smaller than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`));
    next(err);
  });

/** POST /api/admin/uploads?folder=products|categories|collections|banners  (multipart field: file) */
export async function uploadImage(req, res) {
  if (!req.file) throw ApiError.badRequest('Choose an image to upload.');
  const result = await saveImage(req.file.buffer, req.file.originalname, String(req.query.folder || 'products'));
  res.status(201).json(result);
}
