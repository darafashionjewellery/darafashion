# DARA image assets

Everything in this folder is served at `/assets/...`.

```
assets/
  logo.webp          ← add the DARA logo here, then set `logo` in src/config/assets.ts
  banners/           ← hero, bridal, festive, wedding, about … (wide, ~1600×700)
  categories/        ← one image per category (square, ~600×600)
  collections/       ← one image per collection (portrait 4:5, ~800×1000)
  occasions/         ← wedding, festive, party, daily, gifting (portrait 4:5)
  products/          ← product photos, ideally grouped by category (portrait 4:5, ~1000×1250)
  placeholders/      ← GENERATED placeholder art — safe to delete once real images are in place
```

Prefer `.webp` (or optimised `.jpg`) and keep product photos under ~250 KB each.

- Banner / occasion images → update the paths in `client/src/config/assets.ts`.
- Category and collection images → stored in MongoDB (`image`, `bannerImage`). Update them in
  `server/src/seed/data.js` and run `npm run seed`, or use the admin API.
- Product images → stored on each product in MongoDB (`images: [...]`, plus optional per-variant `images`).
