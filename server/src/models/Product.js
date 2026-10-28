import mongoose from 'mongoose';

export const OCCASIONS = ['wedding', 'festive', 'party', 'daily', 'gifting'];

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    label: { type: String, required: true, trim: true },
    color: { type: String, trim: true, default: '' },
    swatch: { type: String, trim: true, default: '' },
    price: { type: Number, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, min: 0, default: 0 },
    images: { type: [String], default: [] },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, trim: true, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    style: { type: String, trim: true, lowercase: true, default: '' },
    collections: { type: [String], default: [] },
    occasions: { type: [{ type: String, enum: OCCASIONS }], default: [] },
    craftsmanship: { type: String, trim: true, default: '' },
    colors: { type: [String], default: [] },
    // Only set material when it has been verified by DARA.
    material: { type: String, trim: true, default: '' },
    tags: { type: [String], default: [] },

    // Prices are whole INR rupees.
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, min: 0, default: 0 },
    variants: { type: [variantSchema], default: [] },

    images: { type: [String], default: [] },
    details: { type: [{ label: String, value: String }], default: [] },
    careInstructions: { type: [String], default: [] },

    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    salesCount: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', description: 'text', tags: 'text', style: 'text' }, { weights: { name: 5, tags: 3, style: 2 } });
productSchema.index({ category: 1, isActive: 1, price: 1 });
productSchema.index({ collections: 1 });
productSchema.index({ occasions: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ 'variants.sku': 1 });

/** Total sellable units across variants (or the base stock when there are no variants). */
productSchema.virtual('totalStock').get(function totalStock() {
  return this.variants?.length ? this.variants.reduce((sum, v) => sum + (v.stock || 0), 0) : this.stock || 0;
});

export const Product = mongoose.model('Product', productSchema);
