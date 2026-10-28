import { Cart, MAX_QTY_PER_LINE } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { priceLines, computeTotals } from '../services/pricing.service.js';

const getCart = async (userId) => (await Cart.findOne({ user: userId })) || new Cart({ user: userId, items: [] });

async function respond(res, cart, status = 200, shippingMethod) {
  const lines = await priceLines(cart.items);
  res.status(status).json({ items: lines, totals: computeTotals(lines, shippingMethod) });
}

async function assertPurchasable(productId, variantSku) {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw ApiError.notFound('Product not found');
  if (product.variants.length) {
    const variant = product.variants.find((v) => v.sku === variantSku);
    if (!variant) throw ApiError.badRequest('Please choose an option');
    return variant.stock;
  }
  return product.stock;
}

const sameLine = (item, productId, variantSku) => item.product.toString() === productId && (item.variantSku || null) === (variantSku || null);

export async function getMyCart(req, res) {
  await respond(res, await getCart(req.user._id), 200, req.query.shippingMethod);
}

export async function addItem(req, res) {
  const { productId, variantSku = null, quantity } = req.valid.body;
  const stock = await assertPurchasable(productId, variantSku);
  const cart = await getCart(req.user._id);
  const existing = cart.items.find((i) => sameLine(i, productId, variantSku));
  const desired = Math.min((existing?.quantity || 0) + quantity, MAX_QTY_PER_LINE);
  if (stock <= 0) throw ApiError.conflict('This item is out of stock');
  if (desired > stock) throw ApiError.conflict(`Only ${stock} left in stock`);

  if (existing) existing.quantity = desired;
  else cart.items.push({ product: productId, variantSku, quantity: desired });
  await cart.save();
  await respond(res, cart, 201);
}

export async function updateItem(req, res) {
  const cart = await getCart(req.user._id);
  const item = cart.items.id(req.valid.params.id);
  if (!item) throw ApiError.notFound('Item not found in your bag');
  const stock = await assertPurchasable(item.product.toString(), item.variantSku);
  if (req.valid.body.quantity > stock) throw ApiError.conflict(stock > 0 ? `Only ${stock} left in stock` : 'This item is out of stock');
  item.quantity = req.valid.body.quantity;
  await cart.save();
  await respond(res, cart);
}

export async function removeItem(req, res) {
  const cart = await getCart(req.user._id);
  const item = cart.items.id(req.valid.params.id);
  if (item) {
    item.deleteOne();
    await cart.save();
  }
  await respond(res, cart);
}

/** Merges a guest (localStorage) bag into the customer's saved bag after login. */
export async function mergeCart(req, res) {
  const cart = await getCart(req.user._id);
  const priced = await priceLines(req.valid.body.items.map((i) => ({ product: i.productId, variantSku: i.variantSku || null, quantity: i.quantity })));
  for (const line of priced) {
    if (!line.available) continue;
    const existing = cart.items.find((i) => sameLine(i, line.productId, line.variantSku));
    const qty = Math.min((existing?.quantity || 0) + line.quantity, line.maxQuantity);
    if (qty < 1) continue;
    if (existing) existing.quantity = qty;
    else cart.items.push({ product: line.productId, variantSku: line.variantSku, quantity: qty });
  }
  await cart.save();
  await respond(res, cart);
}

/** Server-side pricing for a guest bag (nothing is stored). */
export async function quote(req, res) {
  const lines = await priceLines(req.valid.body.items.map((i, idx) => ({ _id: String(idx), product: i.productId, variantSku: i.variantSku || null, quantity: i.quantity })));
  res.json({ items: lines, totals: computeTotals(lines, req.valid.body.shippingMethod) });
}
