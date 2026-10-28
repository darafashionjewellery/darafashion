# DARA Fashions — Jewellery E-commerce

Online store and admin dashboard for **DARA — Fashion Jewellery & Accessories**: necklaces, earrings, bangles and accessories.

| Part | Stack |
| --- | --- |
| `client/` | React 19 + TypeScript, Vite, Tailwind CSS v4, React Router, Axios, Lucide icons |
| `server/` | Node.js + Express 5 (JavaScript, ES modules), Mongoose, Zod validation |
| Database | MongoDB Atlas |
| Accounts | Email + password; a 6-digit email code verifies sign-ups and password resets |
| Email | Brevo API, any SMTP provider, or console output in development |
| Payments | Razorpay (verified on the server) and optional Cash on Delivery |
| Images | Local assets in `client/public/assets`, plus admin uploads stored on the server |

---

## Getting started

Requirements: **Node.js 20+** and a **MongoDB Atlas** database (or local MongoDB).

```bash
git clone https://github.com/darafashionjewellery/darafashion.git
cd darafashion

# API
cd server
npm install
cp .env.example .env         # then fill in MONGO_URI, JWT_SECRET and the email settings
npm run seed:catalog         # adds the categories and collections (no sample products)
npm run dev                  # http://localhost:5000

# Storefront (second terminal)
cd client
npm install
npm run dev                  # http://localhost:5173
```

The storefront proxies `/api` and `/uploads` to the API in development, so log-in cookies and uploaded images work without extra setup.

**Try it without a database:** `cd server && npm run dev:memory` starts the API on a temporary in-memory MongoDB with sample products. Everything is lost when it stops.

**Become an admin:** add your email to `ADMIN_EMAILS` in `server/.env`, restart the API, log in, then open `/admin`.

---

## Features

**Storefront**
- Home page: hero banner, shop by category, new arrivals, best sellers, bridal and festive banners, featured products, newsletter
- Category pages with sub-category menus, filters (sub-category, occasion, craftsmanship, colour, price, availability), sorting and pagination
- Product pages with image gallery and zoom, finish options, stock levels, reviews and related products
- Search with live suggestions, quick view, wishlist and shopping bag (guest bags are kept and merged at login)
- Checkout with saved addresses, shipping options, Razorpay or Cash on Delivery
- Customer account: profile, addresses, orders and order tracking
- Information pages: About, Contact, FAQ, shipping, returns, privacy and terms

**Admin dashboard (`/admin`)**
- Dashboard with revenue, orders to fulfil, low-stock alerts and recent orders
- Orders: search, filter, update status, add courier and tracking number
- Products: create, edit, hide or delete; finish options with their own stock; images by URL or file upload
- Categories and collections: create, edit and delete, with sub-categories shown in the menu
- Customers, review approval, contact messages, newsletter export and careers

**Categories**

| Category | Sub-categories |
| --- | --- |
| Necklaces | Antique Necklaces, AD Necklaces, Kundan Necklaces, Moissanite Necklaces, Chokers, Long Haram |
| Earrings | Jhumkas, Chandbalis, AD Earrings, Balis / Hoops, Studs |
| Bangles | Antique Bangles, Stone Bangles, AD Bangles, Bracelet |
| Accessories | Mattals - Ear Chains, Maang Tikkas, Choti - Jadai Billai, Hip Chain, Anklet, Vanki |

Sub-categories can be changed in **Admin → Categories & Collections**.

---

## Scripts

| Folder | Command | What it does |
| --- | --- | --- |
| server | `npm run dev` | API with auto-reload |
| server | `npm start` | API for production |
| server | `npm run dev:memory` | API on a temporary in-memory database with sample data |
| server | `npm run seed:catalog` | Adds missing categories and collections; never overwrites admin edits |
| server | `npm run seed` | Loads the full **sample** catalogue — development databases only |
| server | `npm test` | API integration tests |
| client | `npm run dev` | Storefront dev server |
| client | `npm run build` | Type-check and build into `client/dist` |
| client | `npm run check:images` | Checks every image path in `src/config/assets.ts` and flags oversized files |

---

## Configuration

All server settings live in `server/.env`. See [`server/.env.example`](server/.env.example) for the full annotated list.

| Setting | Purpose |
| --- | --- |
| `MONGO_URI` | Database connection |
| `JWT_SECRET`, `OTP_SECRET` | Long random strings used to sign sessions and codes |
| `CLIENT_URL` | Storefront address(es) allowed to call the API |
| `EMAIL_TRANSPORT` + `BREVO_*` or `SMTP_*` | How emails are sent |
| `RAZORPAY_*`, `ENABLE_COD` | Payment options |
| `ADMIN_EMAILS` | Who can open the admin dashboard |
| `UPLOAD_DIR` | Where uploaded images are stored (default `server/uploads`) |
| `CONTACT_*`, `SOCIAL_*`, `SHIPPING_*`, `ANNOUNCEMENTS` | Store contact details, links, shipping fees and announcement bar text |

Client (optional, `client/.env`): set `VITE_API_URL` only when the API is hosted on a different domain from the storefront.

---

## Images

- **Site images** (hero, banners, occasion tiles, logo) are files in `client/public/assets/` and are set in [`client/src/config/assets.ts`](client/src/config/assets.ts).
- **Product, category and collection images** are set in the admin. Paste a URL or upload a file. Uploads are resized, converted to WebP and saved in `server/uploads/`.

| Image | Recommended size |
| --- | --- |
| Home hero banner | 1920 × 800 |
| Other banners | 1600 × 700 (keep the subject on the right half) |
| Product photos | 1200 × 1500 (portrait 4:5) |
| Category images | 600 × 600 (square) |
| Collection images | 800 × 1000 (portrait 4:5) |
| Occasion tiles | 600 × 750 (portrait 4:5) |
| Logo | 600 × 180 (transparent PNG) |

Keep image files under about 300 KB. Don't put your own photos in `client/public/assets/placeholders/`; that folder holds generated sample artwork.

---

## Project structure

```
client/
  public/assets/        site images (banners, categories, occasions, placeholders)
  scripts/              placeholder generator, image checker
  src/
    components/         ui, layout, product, listing, home, checkout, account, admin
    config/             assets.ts (site images), navigation.ts (menu)
    content/            policy and FAQ text
    context/            site, auth, cart, wishlist and toast state
    layouts/  pages/  routes/  services/  types/  hooks/  lib/
server/
  src/
    config/  controllers/  middleware/  models/  routes/  services/  validators/  seed/  utils/
  scripts/              dev-memory.js, check-syntax.js
  tests/                API integration tests
  uploads/              admin-uploaded images (not in git)
```

---

## Security

- Passwords are hashed with scrypt and never returned by the API. Failed logins are rate-limited.
- Email codes are 6 digits, stored hashed, valid for 5 minutes, single use, with at most 5 attempts.
- Sessions use a signed JWT in an httpOnly cookie.
- Prices, totals and stock are always calculated on the server.
- An online order is marked paid only after the Razorpay signature and payment are verified on the server.
- Secrets live only in `server/.env`, which is excluded from git.

---

## Deploying

1. Set `NODE_ENV=production`, a strong `JWT_SECRET`, `CLIENT_URL`, the email settings and the Razorpay keys.
2. Build the storefront with `cd client && npm run build` and serve `client/dist` with a fallback to `index.html`.
3. Run the API with `cd server && npm start`. Route `/api` and `/uploads` to it.
4. Keep `server/uploads/` on persistent storage and back it up.
