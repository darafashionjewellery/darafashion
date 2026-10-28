import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    navLabel: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    image: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    styles: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
    showInNav: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Category = mongoose.model('Category', categorySchema);
