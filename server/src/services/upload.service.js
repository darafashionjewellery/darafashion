import crypto from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/text.js';

/** Where uploaded images are stored on the server. Served publicly at /uploads/... */
export const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || fileURLToPath(new URL('../../uploads', import.meta.url)));

/** Allowed target folders and the largest size (px) images in each are scaled down to. */
const FOLDERS = {
  products: 1600,
  categories: 1000,
  collections: 1600,
  banners: 2000,
};

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/**
 * Converts an uploaded image to an optimised WebP (auto-rotated, scaled to fit the folder's
 * maximum size, metadata stripped) and saves it with a unique name.
 * Returns the public URL path, e.g. /uploads/products/kundan-jhumka-1a2b3c4d.webp
 */
export async function saveImage(buffer, originalName, folder) {
  if (!FOLDERS[folder]) throw ApiError.badRequest(`Unknown upload folder "${folder}"`);
  const max = FOLDERS[folder];
  const base = slugify(String(originalName || 'image').replace(/\.[^.]+$/, '')).slice(0, 60) || 'image';
  const name = `${base}-${crypto.randomBytes(4).toString('hex')}.webp`;
  const dir = join(UPLOAD_DIR, folder);
  await mkdir(dir, { recursive: true });

  let info;
  try {
    info = await sharp(buffer, { failOn: 'error' })
      .rotate()
      .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(join(dir, name));
  } catch {
    throw ApiError.badRequest('This file could not be read as an image. Please upload a JPG, PNG or WebP.');
  }
  return { url: `/uploads/${folder}/${name}`, width: info.width, height: info.height, size: info.size };
}
