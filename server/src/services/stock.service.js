import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

/** Atomically decrements stock for one line; returns false if not enough stock. */
async function decrement({ productId, variantSku, quantity }) {
  const filter = variantSku
    ? { _id: productId, isActive: true, variants: { $elemMatch: { sku: variantSku, stock: { $gte: quantity } } } }
    : { _id: productId, isActive: true, stock: { $gte: quantity } };
  const update = variantSku
    ? { $inc: { 'variants.$.stock': -quantity, salesCount: quantity } }
    : { $inc: { stock: -quantity, salesCount: quantity } };
  const { modifiedCount } = await Product.updateOne(filter, update);
  return modifiedCount === 1;
}

async function increment({ productId, variantSku, quantity }) {
  if (variantSku) {
    await Product.updateOne({ _id: productId, 'variants.sku': variantSku }, { $inc: { 'variants.$.stock': quantity, salesCount: -quantity } });
  } else {
    await Product.updateOne({ _id: productId }, { $inc: { stock: quantity, salesCount: -quantity } });
  }
}

/**
 * Reserves stock for every line or none of them. Uses conditional updates with
 * compensation, so it works on standalone MongoDB as well as Atlas replica sets.
 */
export async function reserveStock(lines) {
  const reserved = [];
  for (const line of lines) {
    const ok = await decrement(line);
    if (!ok) {
      await Promise.all(reserved.map(increment));
      throw ApiError.conflict(`Sorry, "${line.name}" no longer has enough stock. Please review your bag.`);
    }
    reserved.push(line);
  }
}

export async function releaseStock(lines) {
  await Promise.all(lines.map(increment));
}
