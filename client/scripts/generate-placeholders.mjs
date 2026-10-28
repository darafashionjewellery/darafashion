/**
 * Generates lightweight SVG placeholder artwork in public/assets/placeholders/.
 * These stand in for real photography until DARA's images are added.
 * Run: npm run placeholders   (safe to re-run; only touches the placeholders folder)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'placeholders');

const palettes = [
  { bg1: '#FFF5F1', bg2: '#FFE0D6', ink: '#880E4F', soft: '#FFCCBC', gem: '#EC407A' },
  { bg1: '#FFF0EC', bg2: '#FFD4C7', ink: '#C2185B', soft: '#FF8A80', gem: '#880E4F' },
  { bg1: '#FFE6DD', bg2: '#FFCCBC', ink: '#880E4F', soft: '#FFF5F1', gem: '#EC407A' },
];
const silverPalette = { bg1: '#F7F3F4', bg2: '#E3DADD', ink: '#6E5560', soft: '#C9B8BE', gem: '#EC407A' };

const beads = (cx, cy, rx, ry, n, r, start = 0.15, end = 0.85, fill) =>
  Array.from({ length: n }, (_, i) => {
    const t = Math.PI * (start + ((end - start) * i) / (n - 1));
    return `<circle cx="${(cx - rx * Math.cos(t)).toFixed(1)}" cy="${(cy + ry * Math.sin(t)).toFixed(1)}" r="${r}" fill="${fill}"/>`;
  }).join('');

const jhumka = (x, y, s, p) => `
  <g transform="translate(${x} ${y}) scale(${s})" stroke="${p.ink}" stroke-width="4" fill="none">
    <circle cx="0" cy="0" r="14" fill="${p.soft}"/>
    <circle cx="0" cy="0" r="5" fill="${p.gem}" stroke="none"/>
    <line x1="0" y1="14" x2="0" y2="40"/>
    <path d="M-48 100 Q-48 40 0 40 Q48 40 48 100 Z" fill="${p.soft}"/>
    <path d="M-30 70 Q0 52 30 70" />
    ${Array.from({ length: 7 }, (_, i) => `<line x1="${-42 + i * 14}" y1="100" x2="${-42 + i * 14}" y2="118"/><circle cx="${-42 + i * 14}" cy="124" r="5" fill="${p.ink}" stroke="none"/>`).join('')}
  </g>`;

const motifs = {
  necklaces: (p) => `
    <path d="M190 240 Q400 720 610 240" stroke="${p.ink}" stroke-width="5" fill="none"/>
    ${beads(400, 240, 210, 420, 17, 11, 0.08, 0.92, p.soft)}
    ${beads(400, 240, 210, 420, 9, 5, 0.2, 0.8, p.ink)}
    <path d="M400 640 L430 690 L400 760 L370 690 Z" fill="${p.gem}" stroke="${p.ink}" stroke-width="4"/>
    <circle cx="400" cy="635" r="16" fill="${p.soft}" stroke="${p.ink}" stroke-width="4"/>`,
  earrings: (p) => `${jhumka(290, 330, 1.7, p)}${jhumka(510, 330, 1.7, p)}`,
  bangles: (p) => `
    <ellipse cx="350" cy="500" rx="190" ry="190" stroke="${p.ink}" stroke-width="22" fill="none"/>
    <ellipse cx="350" cy="500" rx="190" ry="190" stroke="${p.soft}" stroke-width="6" fill="none" stroke-dasharray="4 18"/>
    <ellipse cx="460" cy="470" rx="190" ry="190" stroke="${p.soft}" stroke-width="22" fill="none"/>
    <ellipse cx="460" cy="470" rx="190" ry="190" stroke="${p.ink}" stroke-width="4" fill="none" stroke-dasharray="2 14"/>`,
  bracelets: (p) => `
    <ellipse cx="400" cy="500" rx="230" ry="150" stroke="${p.ink}" stroke-width="5" fill="none"/>
    ${Array.from({ length: 22 }, (_, i) => {
      const t = (Math.PI * 2 * i) / 22;
      return `<ellipse cx="${(400 + 230 * Math.cos(t)).toFixed(1)}" cy="${(500 + 150 * Math.sin(t)).toFixed(1)}" rx="16" ry="10" transform="rotate(${((t * 180) / Math.PI + 90).toFixed(0)} ${(400 + 230 * Math.cos(t)).toFixed(1)} ${(500 + 150 * Math.sin(t)).toFixed(1)})" fill="${p.soft}" stroke="${p.ink}" stroke-width="3"/>`;
    }).join('')}
    <circle cx="400" cy="650" r="22" fill="${p.gem}" stroke="${p.ink}" stroke-width="4"/>`,
  rings: (p) => `
    <circle cx="400" cy="560" r="170" stroke="${p.ink}" stroke-width="26" fill="none"/>
    <circle cx="400" cy="560" r="170" stroke="${p.soft}" stroke-width="6" fill="none"/>
    <path d="M330 390 L400 300 L470 390 L400 430 Z" fill="${p.gem}" stroke="${p.ink}" stroke-width="5"/>
    <path d="M330 390 L470 390 M365 345 L400 430 L435 345" stroke="${p.ink}" stroke-width="3" fill="none"/>`,
  pendants: (p) => `
    <path d="M220 180 L400 520 L580 180" stroke="${p.ink}" stroke-width="4" fill="none" stroke-dasharray="10 8"/>
    <circle cx="400" cy="540" r="22" fill="${p.soft}" stroke="${p.ink}" stroke-width="4"/>
    <path d="M400 565 C470 640 470 740 400 790 C330 740 330 640 400 565 Z" fill="${p.soft}" stroke="${p.ink}" stroke-width="5"/>
    <path d="M400 625 C435 665 435 720 400 745 C365 720 365 665 400 625 Z" fill="${p.gem}"/>`,
  silver: (p) => `
    <circle cx="300" cy="420" r="60" fill="${p.soft}" stroke="${p.ink}" stroke-width="5"/>
    <circle cx="300" cy="420" r="22" fill="#ffffff" stroke="${p.ink}" stroke-width="3"/>
    <circle cx="520" cy="560" r="130" stroke="${p.ink}" stroke-width="20" fill="none"/>
    <circle cx="520" cy="430" r="28" fill="#ffffff" stroke="${p.ink}" stroke-width="5"/>`,
  accessories: (p) => `
    <path d="M400 150 L400 470" stroke="${p.ink}" stroke-width="4" stroke-dasharray="10 8"/>
    <circle cx="400" cy="150" r="20" fill="${p.soft}" stroke="${p.ink}" stroke-width="4"/>
    <circle cx="400" cy="540" r="80" fill="${p.soft}" stroke="${p.ink}" stroke-width="5"/>
    <circle cx="400" cy="540" r="34" fill="${p.gem}" stroke="${p.ink}" stroke-width="4"/>
    ${Array.from({ length: 9 }, (_, i) => `<line x1="${336 + i * 16}" y1="610" x2="${336 + i * 16}" y2="660" stroke="${p.ink}" stroke-width="3"/><circle cx="${336 + i * 16}" cy="668" r="7" fill="${p.ink}"/>`).join('')}`,
};

const frame = (w, h, p, inner, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  ${inner}
  <text x="${w - 24}" y="${h - 24}" text-anchor="end" font-family="Georgia, serif" font-size="${Math.round(w / 40)}" letter-spacing="4" fill="${p.ink}" opacity="0.45">${label}</text>
</svg>`;

const write = (rel, svg) => {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, svg);
};

const categories = Object.keys(motifs);

// Products: 800×1000 (4:5), three angles per category
for (const cat of categories) {
  [0, 1, 2].forEach((v) => {
    const p = cat === 'silver' ? silverPalette : palettes[v];
    const transform = ['translate(0 0) scale(1)', 'translate(80 120) scale(0.8)', 'rotate(-8 400 500) translate(0 20)'][v];
    write(`products/${cat}-${v + 1}.svg`, frame(800, 1000, p, `<g transform="${transform}">${motifs[cat](p)}</g>`, 'DARA · PLACEHOLDER'));
  });
  // Categories: 600×600
  const p = cat === 'silver' ? silverPalette : palettes[0];
  write(`categories/${cat}.svg`, frame(600, 600, p, `<g transform="translate(-10 -110) scale(0.77)">${motifs[cat](p)}</g>`, 'DARA'));
}

// Collections: 800×1000 and banners: 1600×700 (art sits on the right so text can overlay on the left)
const collectionMotif = { bridal: 'necklaces', festive: 'earrings', wedding: 'bangles', everyday: 'bracelets' };
for (const [slug, cat] of Object.entries(collectionMotif)) {
  write(`collections/${slug}.svg`, frame(800, 1000, palettes[1], motifs[cat](palettes[1]), 'DARA · PLACEHOLDER'));
}

const banner = (name, cats, p) =>
  write(
    `banners/${name}.svg`,
    frame(
      1600,
      700,
      p,
      `<circle cx="1180" cy="350" r="330" fill="${p.soft}" opacity="0.35"/>
       ${cats.map((c, i) => `<g transform="translate(${820 + i * 330} ${cats.length > 1 ? 40 : -60}) scale(${cats.length > 1 ? 0.62 : 0.8})">${motifs[c](p)}</g>`).join('')}`,
      'DARA · PLACEHOLDER',
    ),
  );

banner('hero', ['necklaces', 'earrings'], palettes[0]);
banner('bridal', ['necklaces'], palettes[1]);
banner('festive', ['earrings', 'bangles'], palettes[2]);
banner('wedding', ['bangles', 'accessories'], palettes[1]);
banner('everyday', ['bracelets', 'rings'], palettes[0]);
banner('category', ['pendants'], palettes[0]);
banner('about', ['rings', 'pendants'], palettes[1]);

// Occasions: 600×750
const occasionMotif = { wedding: 'necklaces', festive: 'earrings', party: 'rings', daily: 'bracelets', gifting: 'pendants' };
for (const [slug, cat] of Object.entries(occasionMotif)) {
  write(`occasions/${slug}.svg`, frame(600, 750, palettes[(slug.length) % 3], `<g transform="translate(-100 -110) scale(0.95)">${motifs[cat](palettes[(slug.length) % 3])}</g>`, 'DARA'));
}

console.log(`Placeholders written to ${root}`);
