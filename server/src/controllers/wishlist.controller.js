import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { productCard } from '../services/serializers.js';

const getWishlist = async (userId) => (await Wishlist.findOne({ user: userId })) || new Wishlist({ user: userId, products: [] });

async function respond(res, wishlist, status = 200) {
  const products = await Product.find({ _id: { $in: wishlist.products }, isActive: true }).populate('category', 'name slug');
  const byId = new Map(products.map((p) => [p._id.toString(), p]));
  // Preserve the order in which items were saved (most recent first).
  const items = [...wishlist.products].reverse().map((id) => byId.get(id.toString())).filter(Boolean).map(productCard);
  res.status(status).json({ items, productIds: items.map((i) => i.id) });
}

export async function getMyWishlist(req, res) {
  await respond(res, await getWishlist(req.user._id));
}

export async function addToWishlist(req, res) {
  const { productId } = req.valid.body;
  if (!(await Product.exists({ _id: productId, isActive: true }))) throw ApiError.notFound('Product not found');
  const wishlist = await getWishlist(req.user._id);
  if (!wishlist.products.some((id) => id.toString() === productId)) wishlist.products.push(productId);
  await wishlist.save();
  await respond(res, wishlist, 201);
}

export async function removeFromWishlist(req, res) {
  const wishlist = await getWishlist(req.user._id);
  wishlist.products = wishlist.products.filter((id) => id.toString() !== req.valid.params.id);
  await wishlist.save();
  await respond(res, wishlist);
}

export async function mergeWishlist(req, res) {
  const wishlist = await getWishlist(req.user._id);
  const valid = await Product.find({ _id: { $in: req.valid.body.productIds }, isActive: true }, '_id');
  for (const p of valid) {
    if (!wishlist.products.some((id) => id.equals(p._id))) wishlist.products.push(p._id);
  }
  await wishlist.save();
  await respond(res, wishlist);
}
