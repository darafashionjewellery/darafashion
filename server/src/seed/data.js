/**
 * DEVELOPMENT SEED DATA.
 * Names, prices and stock are samples so the storefront can be exercised end-to-end.
 * Replace them with DARA's verified catalogue before launch — do not publish the
 * sample descriptions as real product information.
 *
 * Image paths point at generated placeholders in client/public/assets/placeholders/.
 * See README → "Adding products and images" to swap in real photography.
 */

const ph = (path) => `/assets/placeholders/${path}`;

export const categories = [
  { slug: 'necklaces', name: 'Necklaces', styles: ['Antique Necklaces', 'AD Necklaces', 'Kundan Necklaces', 'Moissanite Necklaces', 'Chokers', 'Long Haram'], sortOrder: 1 },
  { slug: 'earrings', name: 'Earrings', styles: ['Jhumkas', 'Chandbalis', 'AD Earrings', 'Balis / Hoops', 'Studs'], sortOrder: 2 },
  { slug: 'bangles', name: 'Bangles', styles: ['Antique Bangles', 'Stone Bangles', 'AD Bangles', 'Bracelet'], sortOrder: 3 },
  { slug: 'accessories', name: 'Accessories', styles: ['Mattals - Ear Chains', 'Maang Tikkas', 'Choti - Jadai Billai', 'Hip Chain', 'Anklet', 'Vanki'], sortOrder: 8 },
].map((c) => ({
  ...c,
  description: `Explore DARA ${c.name.toLowerCase()} for every occasion.`,
  image: ph(`categories/${c.slug}.svg`),
  bannerImage: ph('banners/category.svg'),
}));

export const collections = [
  { slug: 'bridal', name: 'Bridal Collection', tagline: 'For your most special day', description: 'Statement pieces chosen to complete your bridal look.', isFeatured: true, sortOrder: 1 },
  { slug: 'festive', name: '   ', tagline: 'Shine brighter this season', description: 'Celebration-ready jewellery for festivals and family gatherings.', isFeatured: true, sortOrder: 2 },
  { slug: 'everyday', name: 'Everyday Elegance', tagline: 'Light pieces for daily wear', description: 'Easy, versatile designs for work, college and weekends.', isFeatured: false, sortOrder: 4 },
].map((c) => ({ ...c, image: ph(`collections/${c.slug}.svg`), bannerImage: ph(`banners/${c.slug}.svg`) }));

const SAMPLE_DESCRIPTION =
  'Sample product for development. Replace this description with DARA’s verified product details, including finish, dimensions and materials.';

const CARE = [
  'Store in a dry pouch or box, away from moisture.',
  'Avoid contact with perfume, lotions and water.',
  'Wipe gently with a soft, dry cloth after use.',
];

const toneVariants = (sku, tones) =>
  tones.map(([label, swatch], i) => ({ sku: `${sku}-${label.split(' ')[0].toUpperCase()}`, label, color: label.toLowerCase(), swatch, stock: 6 + ((i * 5) % 9) }));

const TONES = { gold: ['Gold Tone', '#C9A24B'], rose: ['Rose Gold Tone', '#D9A08B'], silver: ['Silver Tone', '#C0C0C0'], antique: ['Antique Gold Tone', '#A27B3B'] };

// [name, category, style, craftsmanship, occasions, colors, price, compareAtPrice, flags, tones?]
const rows = [
  ['Aanya Kundan Choker', 'necklaces', 'chokers', 'Kundan', ['wedding', 'festive'], ['gold', 'green'], 3499, 4299, 'new best feat', ['gold', 'antique']],
  ['Meher AD Necklace', 'necklaces', 'ad necklaces', 'Minimal', ['party', 'daily'], ['gold'], 1899, 2399, 'new'],
  ['Rivaa Temple Long Haram', 'necklaces', 'long haram', 'Temple', ['wedding'], ['gold', 'red'], 5999, 6999, 'best'],
  ['Saanvi Kundan Necklace Set', 'necklaces', 'kundan necklaces', 'Pearl Work', ['wedding', 'gifting'], ['white', 'gold'], 4499, null, 'feat'],
  ['Ira Antique Necklace', 'necklaces', 'antique necklaces', 'Oxidised', ['party', 'festive'], ['silver'], 1599, 1999, ''],
  ['Noor Statement Choker', 'necklaces', 'chokers', 'Kundan', ['wedding'], ['gold', 'pink'], 3999, null, 'new'],

  ['Kavya Jhumka Earrings', 'earrings', 'jhumkas', 'Temple', ['festive', 'wedding'], ['gold'], 1299, 1599, 'new best', ['gold', 'antique']],
  ['Zoya Chandbali Earrings', 'earrings', 'chandbalis', 'Kundan', ['wedding', 'party'], ['gold', 'white'], 2499, 2999, 'best feat'],
  ['Tara Stud Earrings', 'earrings', 'studs', 'Minimal', ['daily', 'gifting'], ['gold'], 599, null, 'new', ['gold', 'rose', 'silver']],
  ['Diya AD Earrings', 'earrings', 'ad earrings', 'Pearl Work', ['party'], ['white', 'gold'], 899, 1199, ''],
  ['Myra Hoop Earrings', 'earrings', 'balis / hoops', 'Minimal', ['daily'], ['gold'], 749, null, 'best', ['gold', 'silver']],
  ['Inaaya Oxidised Jhumka', 'earrings', 'jhumkas', 'Oxidised', ['festive', 'daily'], ['silver'], 699, 899, 'new'],

  ['Riya Bangle Set', 'bangles', 'stone bangles', 'Kundan', ['wedding', 'festive'], ['gold', 'red'], 2199, 2699, 'best'],
  ['Prisha Kada', 'bangles', 'antique bangles', 'Temple', ['festive'], ['gold'], 1799, null, 'new feat'],
  ['Anvi Openable Bangle', 'bangles', 'ad bangles', 'Minimal', ['daily', 'gifting'], ['gold'], 999, 1299, '', ['gold', 'rose']],
  ['Siya Pearl Bangles', 'bangles', 'stone bangles', 'Pearl Work', ['wedding', 'party'], ['white', 'gold'], 2499, null, 'new'],

  ['Gauri Maang Tikka', 'accessories', 'maang tikkas', 'Kundan', ['wedding', 'festive'], ['gold', 'red'], 1099, 1399, 'new best'],
  ['Laila Jadai Billai', 'accessories', 'choti - jadai billai', 'Pearl Work', ['party', 'daily'], ['white', 'gold'], 599, null, 'new'],
  ['Amaira Vanki', 'accessories', 'vanki', 'Kundan', ['party', 'gifting'], ['gold'], 799, 999, ''],
  ['Suhana Anklet', 'accessories', 'anklet', 'Oxidised', ['daily', 'festive'], ['silver'], 649, null, 'feat'],
];

const collectionsFor = (occasions, craft) => {
  const c = [];
  if (occasions.includes('wedding') && ['Kundan', 'Temple'].includes(craft)) c.push('bridal');
  if (occasions.includes('festive')) c.push('festive');
  if (occasions.includes('daily')) c.push('everyday');
  return c;
};

export const products = rows.map(([name, category, style, craftsmanship, occasions, colors, price, compareAtPrice, flags, tones], i) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const sku = `DARA-${category.slice(0, 3).toUpperCase()}-${String(101 + i)}`;
  const variants = tones ? toneVariants(sku, tones.map((t) => TONES[t])) : [];
  return {
    name,
    slug,
    sku,
    category,
    style,
    craftsmanship,
    occasions,
    colors,
    collections: collectionsFor(occasions, craftsmanship),
    tags: [style, craftsmanship.toLowerCase(), category],
    description: SAMPLE_DESCRIPTION,
    price,
    compareAtPrice: compareAtPrice || undefined,
    stock: variants.length ? 0 : i % 11 === 4 ? 0 : 4 + ((i * 7) % 15),
    variants,
    images: [ph(`products/${category}-1.svg`), ph(`products/${category}-2.svg`), ph(`products/${category}-3.svg`)],
    careInstructions: CARE,
    isNewArrival: flags.includes('new'),
    isBestSeller: flags.includes('best'),
    isFeatured: flags.includes('feat'),
  };
});
