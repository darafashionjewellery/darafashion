import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tagline: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    image: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Collection = mongoose.model('Collection', collectionSchema);
