import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { Review, Order } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/text.js';
import { productCard, productDetail, serializeReview } from '../services/serializers.js';

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
  popular: { salesCount: -1, createdAt: -1 },
};

/**
 * Builds the Mongo filter. "scope" is the page context (search term, collection, tag);
 * each facet filter is kept separately so facet counts can exclude their own selection.
 */
async function buildFilters(q) {
  const scope = { isActive: true };
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    scope.$or = [{ name: rx }, { tags: rx }, { style: rx }, { sku: rx }, { colors: rx }];
  }
  if (q.collection) scope.collections = q.collection;
  if (q.tag === 'new') scope.isNewArrival = true;
  if (q.tag === 'bestseller') scope.isBestSeller = true;
  if (q.tag === 'featured') scope.isFeatured = true;
  if (q.exclude) scope._id = { $ne: new mongoose.Types.ObjectId(q.exclude) };
  if (q.ids.length) scope._id = { ...scope._id, $in: q.ids.map((id) => new mongoose.Types.ObjectId(id)) };

  const facets = {};
  if (q.category.length) {
    const cats = await Category.find({ slug: { $in: q.category } }, '_id');
    facets.category = { category: { $in: cats.map((c) => c._id) } };
  }
  if (q.occasion.length) facets.occasion = { occasions: { $in: q.occasion } };
  if (q.style.length) facets.style = { style: { $in: q.style } };
  if (q.craft.length) facets.craft = { craftsmanship: { $in: q.craft.map((c) => new RegExp(`^${escapeRegex(c)}$`, 'i')) } };
  if (q.color.length) facets.color = { colors: { $in: q.color } };
  if (q.material.length) facets.material = { material: { $in: q.material.map((m) => new RegExp(`^${escapeRegex(m)}$`, 'i')) } };
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    facets.price = { price: { ...(q.minPrice !== undefined && { $gte: q.minPrice }), ...(q.maxPrice !== undefined && { $lte: q.maxPrice }) } };
  }
  if (q.inStock === 'true') facets.availability = { $or: [{ stock: { $gt: 0 } }, { 'variants.stock': { $gt: 0 } }] };

  return { scope, facets };
}

const combine = (scope, facets, except) => ({
  $and: [scope, ...Object.entries(facets).filter(([k]) => k !== except).map(([, v]) => v)],
});

async function computeFacets(scope, facets) {
  const group = (field, key) => [
    { $match: combine({}, facets, key) },
    { $unwind: `$${field}` },
    { $match: { [field]: { $nin: ['', null] } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ];
  const [result] = await Product.aggregate([
    { $match: scope },
    {
      $facet: {
        category: group('category', 'category'),
        style: group('style', 'style'),
        occasion: group('occasions', 'occasion'),
        craft: group('craftsmanship', 'craft'),
        color: group('colors', 'color'),
        material: group('material', 'material'),
        price: [{ $match: combine({}, facets, 'price') }, { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }],
        availability: [
          { $match: combine({}, facets, 'availability') },
          { $match: { $or: [{ stock: { $gt: 0 } }, { 'variants.stock': { $gt: 0 } }] } },
          { $count: 'inStock' },
        ],
      },
    },
  ]);

  const cats = await Category.find({ _id: { $in: result.category.map((c) => c._id) } }, 'name slug');
  const catById = new Map(cats.map((c) => [c._id.toString(), c]));
  const opts = (rows) => rows.map((r) => ({ value: String(r._id).toLowerCase(), label: String(r._id), count: r.count }));

  return {
    category: result.category
      .map((r) => catById.get(r._id.toString()))
      .filter(Boolean)
      .map((c) => ({ value: c.slug, label: c.name, count: result.category.find((r) => r._id.equals(c._id)).count })),
    style: opts(result.style),
    occasion: opts(result.occasion),
    craft: opts(result.craft),
    color: opts(result.color),
    material: opts(result.material),
    price: result.price[0] ? { min: result.price[0].min, max: result.price[0].max } : { min: 0, max: 0 },
    inStockCount: result.availability[0]?.inStock ?? 0,
  };
}

export async function listProducts(req, res) {
  const q = req.valid.query;
  const { scope, facets } = await buildFilters(q);
  const filter = combine(scope, facets);
  const sort = SORTS[q.sort] || SORTS.newest;

  const [items, total, popularityAvailable] = await Promise.all([
    Product.find(filter).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit).populate('category', 'name slug'),
    Product.countDocuments(filter),
    Product.exists({ isActive: true, salesCount: { $gt: 0 } }),
  ]);

  res.json({
    items: items.map(productCard),
    total,
    page: q.page,
    limit: q.limit,
    pages: Math.max(1, Math.ceil(total / q.limit)),
    popularityAvailable: Boolean(popularityAvailable),
    ...(q.facets === 'true' ? { facets: await computeFacets(scope, facets) } : {}),
  });
}

async function findProduct(idOrSlug) {
  const filter = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: String(idOrSlug).toLowerCase() };
  const product = await Product.findOne({ ...filter, isActive: true }).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

export async function getProduct(req, res) {
  res.json({ product: productDetail(await findProduct(req.params.id)) });
}

export async function relatedProducts(req, res) {
  const product = await findProduct(req.params.id);
  const items = await Product.find({ isActive: true, category: product.category._id, _id: { $ne: product._id } })
    .sort({ isBestSeller: -1, createdAt: -1 })
    .limit(8)
    .populate('category', 'name slug');
  res.json({ items: items.map(productCard) });
}

export async function productReviews(req, res) {
  const product = await findProduct(req.params.id);
  const reviews = await Review.find({ product: product._id, status: 'approved' }).sort({ createdAt: -1 }).limit(50);
  res.json({ items: reviews.map(serializeReview), ratingAverage: product.ratingAverage, ratingCount: product.ratingCount });
}

export async function createReview(req, res) {
  const product = await findProduct(req.params.id);
  const exists = await Review.exists({ product: product._id, user: req.user._id });
  if (exists) throw ApiError.conflict('You have already reviewed this product.');
  const verifiedPurchase = Boolean(
    await Order.exists({ user: req.user._id, 'items.product': product._id, status: 'delivered' }),
  );
  const displayName = req.user.name ? req.user.name.split(' ')[0] : 'DARA Customer';
  await Review.create({ ...req.valid.body, product: product._id, user: req.user._id, displayName, verifiedPurchase });
  res.status(201).json({ message: 'Thank you! Your review will appear once it has been approved.' });
}

/** Approved, positive reviews for the Happy Customers page and homepage. */
export async function featuredReviews(req, res) {
  const limit = Math.min(Number(req.query.limit) || 12, 48);
  const reviews = await Review.find({ status: 'approved', rating: { $gte: 4 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('product', 'name slug images');
  res.json({ items: reviews.map(serializeReview) });
}

export async function listCategories(_req, res) {
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
    Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countById = new Map(counts.map((c) => [c._id.toString(), c.count]));
  res.json({
    items: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      navLabel: c.navLabel || c.name,
      description: c.description,
      image: c.image,
      bannerImage: c.bannerImage,
      styles: c.styles,
      showInNav: c.showInNav,
      productCount: countById.get(c._id.toString()) || 0,
    })),
  });
}

const serializeCollection = (c) => ({
  id: c._id.toString(),
  name: c.name,
  slug: c.slug,
  tagline: c.tagline,
  description: c.description,
  image: c.image,
  bannerImage: c.bannerImage,
  isFeatured: c.isFeatured,
});

export async function listCollections(_req, res) {
  const items = await Collection.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ items: items.map(serializeCollection) });
}

export async function getCollection(req, res) {
  const c = await Collection.findOne({ slug: req.params.slug.toLowerCase(), isActive: true });
  if (!c) throw ApiError.notFound('Collection not found');
  res.json({ collection: serializeCollection(c) });
}
