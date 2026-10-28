const LOW_STOCK = 5;

const discountPercent = (price, compareAtPrice) =>
  compareAtPrice && compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

const stockInfo = (stock) => ({ inStock: stock > 0, lowStock: stock > 0 && stock <= LOW_STOCK ? stock : null });

const serializeCategory = (c) => (c && c.slug ? { id: c._id?.toString(), name: c.name, slug: c.slug } : null);

function serializeVariants(p) {
  return (p.variants || []).map((v) => {
    const price = v.price ?? p.price;
    const compareAtPrice = v.compareAtPrice ?? p.compareAtPrice ?? null;
    return {
      sku: v.sku,
      label: v.label,
      color: v.color,
      swatch: v.swatch,
      price,
      compareAtPrice,
      discountPercent: discountPercent(price, compareAtPrice),
      images: v.images || [],
      ...stockInfo(v.stock || 0),
    };
  });
}

const totalStock = (p) => (p.variants?.length ? p.variants.reduce((s, v) => s + (v.stock || 0), 0) : p.stock || 0);

export function productCard(p) {
  const variants = serializeVariants(p);
  return {
    id: p._id.toString(),
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    discountPercent: discountPercent(p.price, p.compareAtPrice),
    images: p.images || [],
    category: serializeCategory(p.category),
    style: p.style,
    colors: p.colors || [],
    isNewArrival: p.isNewArrival,
    isBestSeller: p.isBestSeller,
    ratingAverage: p.ratingAverage,
    ratingCount: p.ratingCount,
    hasVariants: variants.length > 0,
    variants,
    ...stockInfo(totalStock(p)),
  };
}

export function productDetail(p) {
  return {
    ...productCard(p),
    description: p.description,
    collections: p.collections,
    occasions: p.occasions,
    craftsmanship: p.craftsmanship,
    material: p.material,
    details: (p.details || []).map((d) => ({ label: d.label, value: d.value })),
    careInstructions: p.careInstructions || [],
  };
}

export function serializeOrder(o) {
  return {
    id: o._id.toString(),
    orderNumber: o.orderNumber,
    email: o.email,
    items: o.items.map((i) => ({
      productId: i.product?.toString(),
      name: i.name,
      slug: i.slug,
      sku: i.sku,
      variantSku: i.variantSku,
      variantLabel: i.variantLabel,
      image: i.image,
      unitPrice: i.unitPrice,
      compareAtPrice: i.compareAtPrice ?? null,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    shippingAddress: o.shippingAddress,
    shippingMethod: o.shippingMethod,
    subtotal: o.subtotal,
    discountTotal: o.discountTotal,
    shippingFee: o.shippingFee,
    total: o.total,
    currency: o.currency,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
    statusHistory: o.statusHistory.map((h) => ({ status: h.status, note: h.note, at: h.at })),
    trackingNumber: o.trackingNumber,
    courier: o.courier,
    createdAt: o.createdAt,
  };
}

export function serializeReview(r) {
  return {
    id: r._id.toString(),
    displayName: r.displayName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    verifiedPurchase: r.verifiedPurchase,
    createdAt: r.createdAt,
    product: r.product?.slug ? { name: r.product.name, slug: r.product.slug, image: r.product.images?.[0] || '' } : undefined,
  };
}
