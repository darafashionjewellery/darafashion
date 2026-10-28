import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../config/db.js';
import { Category, Collection, Product } from '../models/index.js';
import { categories, collections, products } from './data.js';

/**
 * Upserts development catalogue data. Safe to run repeatedly.
 * Pass { reset: true } (or `npm run seed -- --reset`) to delete existing products first.
 * Pass { catalogOnly: true } (or `npm run seed:catalog`) to add only missing categories and
 * collections — no sample products, and existing (admin-edited) entries are left untouched.
 */
export async function seed({ reset = false, catalogOnly = false, log = console.log } = {}) {
  if (catalogOnly) {
    let added = 0;
    for (const [Model, items] of [[Category, categories], [Collection, collections]]) {
      for (const item of items) {
        const res = await Model.updateOne({ slug: item.slug }, { $setOnInsert: item }, { upsert: true });
        added += res.upsertedCount;
      }
    }
    log(`Catalogue ready: ${added} new categories/collections added (existing ones left unchanged). No sample products were added.`);
    return;
  }

  if (reset) await Product.deleteMany({});

  for (const c of categories) await Category.updateOne({ slug: c.slug }, { $set: c }, { upsert: true });
  for (const c of collections) await Collection.updateOne({ slug: c.slug }, { $set: c }, { upsert: true });

  const catIds = new Map((await Category.find({}, 'slug')).map((c) => [c.slug, c._id]));
  for (const [i, p] of products.entries()) {
    // Stagger createdAt so "newest" sorting is deterministic.
    const createdAt = new Date(Date.now() - (products.length - i) * 60 * 60 * 1000);
    await Product.updateOne(
      { sku: p.sku },
      { $set: { ...p, category: catIds.get(p.category), updatedAt: new Date() }, $setOnInsert: { createdAt } },
      { upsert: true, timestamps: false },
    );
  }

  log(`Seeded ${categories.length} categories, ${collections.length} collections, ${products.length} products.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  connectDB()
    .then(() => seed({ reset: process.argv.includes('--reset'), catalogOnly: process.argv.includes('--catalog-only') }))
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
