import { Product, Category, Collection, Order, Review, NewsletterSubscriber, ContactMessage, Job, JobApplication, User, Cart, Wishlist } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify, escapeRegex } from '../utils/text.js';
import { serializeOrder } from '../services/serializers.js';
import { cancelOrder } from '../services/order.service.js';

const page = (req) => {
  const p = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  return { skip: (p - 1) * limit, limit, page: p };
};

// Products & inventory

/** Raw product view for editing: real stock numbers, inactive products and every editable field. */
function adminProduct(p) {
  const variants = (p.variants || []).map((v) => ({
    sku: v.sku,
    label: v.label,
    color: v.color || '',
    swatch: v.swatch || '',
    price: v.price ?? null,
    compareAtPrice: v.compareAtPrice ?? null,
    stock: v.stock || 0,
    images: v.images || [],
  }));
  return {
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    category: p.category?.slug ? { id: p.category._id.toString(), name: p.category.name, slug: p.category.slug } : null,
    style: p.style,
    collections: p.collections,
    occasions: p.occasions,
    craftsmanship: p.craftsmanship,
    colors: p.colors,
    material: p.material,
    tags: p.tags,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    stock: p.stock || 0,
    variants,
    totalStock: variants.length ? variants.reduce((s, v) => s + v.stock, 0) : p.stock || 0,
    images: p.images,
    details: (p.details || []).map((d) => ({ label: d.label, value: d.value })),
    careInstructions: p.careInstructions,
    isNewArrival: p.isNewArrival,
    isBestSeller: p.isBestSeller,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    salesCount: p.salesCount,
    ratingAverage: p.ratingAverage,
    ratingCount: p.ratingCount,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

const LOW_STOCK = 5;
const stockExpr = { $cond: [{ $gt: [{ $size: { $ifNull: ['$variants', []] } }, 0] }, { $sum: '$variants.stock' }, '$stock'] };

export async function adminListProducts(req, res) {
  const { skip, limit, page: p } = page(req);
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { 'variants.sku': rx }];
  }
  if (req.query.category) {
    const cat = await Category.findOne({ slug: String(req.query.category) }, '_id');
    filter.category = cat?._id ?? null;
  }
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'hidden') filter.isActive = false;
  if (req.query.stock === 'out') filter.$expr = { $lte: [stockExpr, 0] };
  if (req.query.stock === 'low') filter.$expr = { $and: [{ $gt: [stockExpr, 0] }, { $lte: [stockExpr, LOW_STOCK] }] };

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('category', 'name slug'),
    Product.countDocuments(filter),
  ]);
  res.json({ items: items.map(adminProduct), total, page: p, pages: Math.max(1, Math.ceil(total / limit)) });
}

export async function adminGetProduct(req, res) {
  const product = await Product.findById(req.valid.params.id).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ product: adminProduct(product) });
}

export async function adminCreateProduct(req, res) {
  const body = req.valid.body;
  const product = await Product.create({ ...body, slug: slugify(body.slug || body.name) });
  res.status(201).json({ product: adminProduct(await product.populate('category', 'name slug')) });
}

export async function adminUpdateProduct(req, res) {
  const body = { ...req.valid.body };
  if (body.slug) body.slug = slugify(body.slug);
  const product = await Product.findByIdAndUpdate(req.valid.params.id, body, { returnDocument: 'after', runValidators: true }).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ product: adminProduct(product) });
}

/**
 * Permanently deletes a product. Past orders keep their own copy of the product details,
 * so order history is unaffected. Its reviews are removed and it is taken out of every
 * customer's bag and wishlist. (To only hide a product, set isActive: false instead.)
 */
export async function adminDeleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.valid.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  await Promise.all([
    Review.deleteMany({ product: product._id }),
    Wishlist.updateMany({}, { $pull: { products: product._id } }),
    Cart.updateMany({}, { $pull: { items: { product: product._id } } }),
  ]);
  res.json({ message: `"${product.name}" was deleted` });
}

export async function adminUpdateInventory(req, res) {
  const product = await Product.findById(req.valid.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  const { stock, variants } = req.valid.body;
  if (stock !== undefined) product.stock = stock;
  for (const v of variants || []) {
    const variant = product.variants.find((pv) => pv.sku === v.sku.toUpperCase());
    if (!variant) throw ApiError.badRequest(`Unknown variant ${v.sku}`);
    variant.stock = v.stock;
  }
  await product.save();
  res.json({ stock: product.stock, variants: product.variants.map((v) => ({ sku: v.sku, stock: v.stock })) });
}

// Categories & collections (generic CRUD — validated by the Mongoose schema)
/** Generic admin CRUD. `beforeDelete(item)` may throw to block a delete, `afterDelete(item)` cleans up references. */
const crud = (Model, fields, { beforeDelete, afterDelete } = {}) => ({
  list: async (_req, res) => res.json({ items: await Model.find().sort({ sortOrder: 1, name: 1 }) }),
  create: async (req, res) => {
    const data = pick(req.body, fields);
    data.slug = slugify(data.slug || data.name || '');
    res.status(201).json({ item: await Model.create(data) });
  },
  update: async (req, res) => {
    const data = pick(req.body, fields);
    if (data.slug) data.slug = slugify(data.slug);
    const item = await Model.findByIdAndUpdate(req.valid.params.id, data, { returnDocument: 'after', runValidators: true });
    if (!item) throw ApiError.notFound();
    res.json({ item });
  },
  remove: async (req, res) => {
    const item = await Model.findById(req.valid.params.id);
    if (!item) throw ApiError.notFound();
    if (beforeDelete) await beforeDelete(item);
    await item.deleteOne();
    if (afterDelete) await afterDelete(item);
    res.json({ message: `"${item.name}" was deleted` });
  },
});
const pick = (obj, keys) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => keys.includes(k)));

export const categoryAdmin = crud(Category, ['name', 'slug', 'navLabel', 'description', 'image', 'bannerImage', 'styles', 'sortOrder', 'showInNav', 'isActive'], {
  // Products must always belong to a category, so a category in use cannot be deleted.
  beforeDelete: async (category) => {
    const count = await Product.countDocuments({ category: category._id });
    if (count) throw ApiError.conflict(`"${category.name}" still has ${count} product${count === 1 ? '' : 's'}. Move or delete ${count === 1 ? 'it' : 'them'} first.`);
  },
});
export const collectionAdmin = crud(Collection, ['name', 'slug', 'tagline', 'description', 'image', 'bannerImage', 'sortOrder', 'isFeatured', 'isActive'], {
  // Products are only tagged with a collection, so untag them and keep the products.
  afterDelete: (collection) => Product.updateMany({ collections: collection.slug }, { $pull: { collections: collection.slug } }),
});

// Orders
export async function adminListOrders(req, res) {
  const { skip, limit, page: p } = page(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ orderNumber: rx }, { email: rx }, { 'shippingAddress.fullName': rx }, { 'shippingAddress.phone': rx }];
  }
  const [items, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), Order.countDocuments(filter)]);
  res.json({ items: items.map(serializeOrder), total, page: p, pages: Math.max(1, Math.ceil(total / limit)) });
}

export async function adminGetOrder(req, res) {
  const order = await Order.findById(req.valid.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ order: serializeOrder(order) });
}

export async function adminUpdateOrderStatus(req, res) {
  const order = await Order.findById(req.valid.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  const { status, note, trackingNumber, courier } = req.valid.body;
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  if (courier !== undefined) order.courier = courier;
  if (status === 'cancelled') {
    await cancelOrder(order, note || 'Cancelled by DARA');
  } else if (status !== order.status) {
    if (order.status === 'cancelled') throw ApiError.badRequest('Cancelled orders cannot be reopened');
    order.status = status;
    order.statusHistory.push({ status, note: note || '' });
    if (status === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
    await order.save();
  } else {
    await order.save();
  }
  res.json({ order: serializeOrder(order) });
}

// Reviews
export async function adminListReviews(req, res) {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json({ items: await Review.find(filter).sort({ createdAt: -1 }).limit(200).populate('product', 'name slug') });
}

export async function adminModerateReview(req, res) {
  const review = await Review.findByIdAndUpdate(req.valid.params.id, { status: req.valid.body.status }, { returnDocument: 'after' });
  if (!review) throw ApiError.notFound('Review not found');
  const [stats] = await Review.aggregate([
    { $match: { product: review.product, status: 'approved' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne({ _id: review.product }, { ratingAverage: stats ? Math.round(stats.avg * 10) / 10 : 0, ratingCount: stats?.count || 0 });
  res.json({ review });
}

// Jobs, applications, newsletter, contact
export const jobAdmin = {
  list: async (_req, res) => res.json({ items: await Job.find().sort({ createdAt: -1 }) }),
  create: async (req, res) => {
    const data = pick(req.body, ['title', 'department', 'location', 'type', 'summary', 'description', 'responsibilities', 'requirements', 'isOpen']);
    res.status(201).json({ item: await Job.create({ ...data, slug: slugify(req.body.slug || data.title || '') }) });
  },
  update: async (req, res) => {
    const data = pick(req.body, ['title', 'department', 'location', 'type', 'summary', 'description', 'responsibilities', 'requirements', 'isOpen']);
    const item = await Job.findByIdAndUpdate(req.valid.params.id, data, { returnDocument: 'after', runValidators: true });
    if (!item) throw ApiError.notFound();
    res.json({ item });
  },
};

export async function adminListApplications(_req, res) {
  res.json({ items: await JobApplication.find().sort({ createdAt: -1 }).limit(500).populate('job', 'title slug') });
}

export async function adminListSubscribers(_req, res) {
  res.json({ items: await NewsletterSubscriber.find().sort({ createdAt: -1 }).limit(5000) });
}

export async function adminListMessages(_req, res) {
  res.json({ items: await ContactMessage.find().sort({ createdAt: -1 }).limit(500) });
}

// Dashboard & customers
export async function adminStats(_req, res) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  // Revenue counts paid online orders and non-cancelled COD orders.
  const revenueMatch = { $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'cod', status: { $ne: 'cancelled' } }] };
  const [orderCounts, revenue, revenue30, customers, productCounts, lowStock, pendingReviews, newMessages, recentOrders] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: revenueMatch }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { ...revenueMatch, createdAt: { $gte: since } } }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
    User.countDocuments({ role: 'customer' }),
    Product.aggregate([{ $group: { _id: '$isActive', count: { $sum: 1 } } }]),
    Product.find({ isActive: true, $expr: { $lte: [stockExpr, LOW_STOCK] } }).sort({ updatedAt: -1 }).limit(10).populate('category', 'name slug'),
    Review.countDocuments({ status: 'pending' }),
    ContactMessage.countDocuments({ status: 'new' }),
    Order.find().sort({ createdAt: -1 }).limit(8),
  ]);
  res.json({
    orders: { total: orderCounts.reduce((s, o) => s + o.count, 0), byStatus: Object.fromEntries(orderCounts.map((o) => [o._id, o.count])) },
    revenue: { total: revenue[0]?.total ?? 0, orders: revenue[0]?.count ?? 0, last30Days: revenue30[0]?.total ?? 0, last30DaysOrders: revenue30[0]?.count ?? 0 },
    customers,
    products: {
      active: productCounts.find((c) => c._id === true)?.count ?? 0,
      hidden: productCounts.find((c) => c._id === false)?.count ?? 0,
    },
    lowStock: lowStock.map(adminProduct),
    pendingReviews,
    newMessages,
    recentOrders: recentOrders.map(serializeOrder),
  });
}

export async function adminListCustomers(req, res) {
  const { skip, limit, page: p } = page(req);
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ email: rx }, { name: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' }, lastOrderAt: { $max: '$createdAt' } } },
  ]);
  const byUser = new Map(stats.map((st) => [st._id.toString(), st]));
  res.json({
    items: users.map((u) => {
      const st = byUser.get(u._id.toString());
      return {
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        addresses: u.addresses.length,
        orders: st?.orders ?? 0,
        spent: st?.spent ?? 0,
        lastOrderAt: st?.lastOrderAt ?? null,
        lastLoginAt: u.lastLoginAt ?? null,
        createdAt: u.createdAt,
      };
    }),
    total,
    page: p,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function adminUpdateMessage(req, res) {
  const status = req.body?.status;
  if (!['new', 'read', 'resolved'].includes(status)) throw ApiError.badRequest('Invalid status');
  const item = await ContactMessage.findByIdAndUpdate(req.valid.params.id, { status }, { returnDocument: 'after' });
  if (!item) throw ApiError.notFound();
  res.json({ item });
}

export async function adminUpdateApplication(req, res) {
  const status = req.body?.status;
  if (!['new', 'reviewing', 'shortlisted', 'rejected', 'hired'].includes(status)) throw ApiError.badRequest('Invalid status');
  const item = await JobApplication.findByIdAndUpdate(req.valid.params.id, { status }, { returnDocument: 'after' });
  if (!item) throw ApiError.notFound();
  res.json({ item });
}
