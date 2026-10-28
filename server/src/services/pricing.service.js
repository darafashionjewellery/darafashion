import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { MAX_QTY_PER_LINE } from '../models/Cart.js';
import { siteConfig } from '../config/site.js';

/**
 * Resolves raw cart items ({ product, variantSku, quantity }) against the live catalogue.
 * All prices come from the database — never from the client.
 */
export async function priceLines(items) {
  const ids = [...new Set(items.map((i) => String(i.product)).filter((id) => mongoose.isValidObjectId(id)))];
  const products = await Product.find({ _id: { $in: ids } }).populate('category', 'name slug');
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  return items.map((item) => {
    const product = byId.get(String(item.product));
    const base = { id: item._id?.toString() ?? null, productId: String(item.product), variantSku: item.variantSku || null, quantity: item.quantity };

    if (!product || !product.isActive) return { ...base, available: false, issue: 'This product is no longer available' };

    let variant = null;
    if (product.variants.length) {
      variant = product.variants.find((v) => v.sku === item.variantSku);
      if (!variant) return { ...base, available: false, issue: 'Please choose an available option', product: summary(product) };
    }

    const stock = variant ? variant.stock : product.stock;
    const unitPrice = variant?.price ?? product.price;
    const compareAtPrice = variant?.compareAtPrice ?? product.compareAtPrice ?? null;
    const maxQuantity = Math.min(stock, MAX_QTY_PER_LINE);
    let issue = null;
    if (stock <= 0) issue = 'Out of stock';
    else if (item.quantity > stock) issue = `Only ${stock} left in stock`;

    return {
      ...base,
      available: stock > 0,
      issue,
      maxQuantity,
      unitPrice,
      compareAtPrice,
      lineTotal: unitPrice * item.quantity,
      variantLabel: variant?.label || '',
      image: variant?.images?.[0] || product.images[0] || '',
      product: summary(product),
    };
  });
}

const summary = (p) => ({ id: p._id.toString(), name: p.name, slug: p.slug, sku: p.sku, category: p.category?.slug ? { name: p.category.name, slug: p.category.slug } : null });

export function shippingOptions(subtotal) {
  return siteConfig.shipping.methods.map((m) => ({
    id: m.id,
    label: m.label,
    description: m.description,
    fee: m.freeAboveThreshold && subtotal >= siteConfig.shipping.freeShippingThreshold ? 0 : m.fee,
  }));
}

export function computeTotals(lines, shippingMethodId = 'standard') {
  const purchasable = lines.filter((l) => l.available && !l.issue);
  const subtotal = purchasable.reduce((sum, l) => sum + l.lineTotal, 0);
  const savings = purchasable.reduce((sum, l) => sum + (l.compareAtPrice && l.compareAtPrice > l.unitPrice ? (l.compareAtPrice - l.unitPrice) * l.quantity : 0), 0);
  const options = shippingOptions(subtotal);
  const shipping = options.find((o) => o.id === shippingMethodId) || options[0];
  const shippingFee = subtotal > 0 ? shipping.fee : 0;
  return {
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal,
    savings,
    shippingMethod: shipping,
    shippingFee,
    total: subtotal + shippingFee,
    shippingOptions: options,
    freeShippingThreshold: siteConfig.shipping.freeShippingThreshold,
    hasIssues: lines.some((l) => !l.available || l.issue),
  };
}
