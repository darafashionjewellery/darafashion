import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';
process.env.EMAIL_TRANSPORT = 'memory';
process.env.ENABLE_COD = 'true';
process.env.OTP_RESEND_COOLDOWN_SECONDS = '60';
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.ADMIN_EMAILS = 'admin@example.com';

const { MongoMemoryServer } = await import('mongodb-memory-server');
const mongoose = (await import('mongoose')).default;
const request = (await import('supertest')).default;
const { createApp } = await import('../src/app.js');
const { seed } = await import('../src/seed/seed.js');
const { getOutbox } = await import('../src/services/email.service.js');
const { Product, Order, OtpVerification, Review } = await import('../src/models/index.js');

let mongo;
let app;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('dara-test'));
  await seed({ log: () => {} });
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const lastOtp = (email) => {
  const msg = [...getOutbox()].reverse().find((m) => m.to === email);
  return msg?.text.match(/\b(\d{6})\b/)[1];
};

const PASSWORD = 'Secret123';

/** Signs up (first time) or logs in with a password, returning an agent that holds the session cookie. */
async function login(email) {
  const agent = request.agent(app);
  const { User } = await import('../src/models/index.js');
  if (!(await User.exists({ email }))) {
    await OtpVerification.deleteOne({ email });
    await agent.post('/api/auth/signup').send({ name: 'Test User', email, password: PASSWORD }).expect(200);
    const res = await agent.post('/api/auth/signup/verify').send({ email, otp: lastOtp(email) }).expect(201);
    return { agent, user: res.body.user };
  }
  const res = await agent.post('/api/auth/login').send({ email, password: PASSWORD }).expect(200);
  return { agent, user: res.body.user };
}

describe('catalogue', () => {
  test('lists categories with counts', async () => {
    const res = await request(app).get('/api/categories').expect(200);
    const earrings = res.body.items.find((c) => c.slug === 'earrings');
    assert.ok(earrings.productCount > 0);
  });

  test('filters by category, price and sorts by price', async () => {
    const res = await request(app).get('/api/products?category=earrings&maxPrice=1000&sort=price_asc&facets=true').expect(200);
    assert.ok(res.body.items.length > 0);
    for (const p of res.body.items) {
      assert.equal(p.category.slug, 'earrings');
      assert.ok(p.price <= 1000);
    }
    const prices = res.body.items.map((p) => p.price);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
    // Category facet ignores its own selection so other categories remain selectable.
    assert.ok(res.body.facets.category.length > 1);
    assert.ok(res.body.facets.style.some((s) => s.value === 'jhumkas'));
  });

  test('search matches partial words', async () => {
    const res = await request(app).get('/api/products?q=jhum').expect(200);
    assert.ok(res.body.items.every((p) => /jhum/i.test(p.name) || /jhum/i.test(p.style)));
    assert.ok(res.body.total >= 2);
  });

  test('gets product by slug, 404 for unknown', async () => {
    const res = await request(app).get('/api/products/kavya-jhumka-earrings').expect(200);
    assert.equal(res.body.product.variants.length, 2);
    await request(app).get('/api/products/does-not-exist').expect(404);
  });

  test('rejects invalid query params', async () => {
    await request(app).get('/api/products?sort=bogus').expect(400);
  });
});

describe('auth: sign-up with email OTP, password login', () => {
  test('sign-up validates input', async () => {
    await request(app).post('/api/auth/signup').send({ name: 'A', email: 'nope', password: 'x' }).expect(400);
    await request(app).post('/api/auth/signup').send({ name: 'Weak Pass', email: 'weak@example.com', password: 'abcdefgh' }).expect(400);
  });

  test('sign-up sends one OTP, creates the account only after verification, sets httpOnly cookie', async () => {
    const email = 'new.customer@example.com';
    const sentBefore = getOutbox().length;
    await request(app).post('/api/auth/signup').send({ name: 'Anika Rao', email, password: PASSWORD }).expect(200);
    assert.equal(getOutbox().length, sentBefore + 1);
    await request(app).post('/api/auth/signup/resend').send({ email }).expect(429); // cooldown

    const { User } = await import('../src/models/index.js');
    assert.equal(await User.exists({ email }), null, 'no account before verification');
    const record = await OtpVerification.findOne({ email });
    const otp = lastOtp(email);
    assert.notEqual(record.otpHash, otp, 'OTP must be stored hashed');
    assert.ok(!record.pending.passwordHash.includes(PASSWORD), 'password must be stored hashed');

    const res = await request(app).post('/api/auth/signup/verify').send({ email, otp }).expect(201);
    assert.equal(res.body.user.name, 'Anika Rao');
    assert.equal(res.body.user.passwordHash, undefined);
    const cookie = res.headers['set-cookie'][0];
    assert.match(cookie, /dara_session=/);
    assert.match(cookie, /HttpOnly/i);

    await request(app).post('/api/auth/signup/verify').send({ email, otp }).expect(400); // single use
    await request(app).post('/api/auth/signup').send({ name: 'Again', email, password: PASSWORD }).expect(409); // already registered
  });

  test('login uses the password and sends no email', async () => {
    const email = 'returning@example.com';
    await login(email);
    const sentBefore = getOutbox().length;
    await request(app).post('/api/auth/login').send({ email, password: 'Wrong1234' }).expect(401);
    await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: PASSWORD }).expect(401);
    const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD }).expect(200);
    assert.match(res.headers['set-cookie'][0], /dara_session=/);
    assert.equal(getOutbox().length, sentBefore, 'login must not send email');
  });

  test('forgot password resets with an OTP; unknown emails get the same reply and no email', async () => {
    const email = 'forgetful@example.com';
    await login(email);
    const sentBefore = getOutbox().length;
    await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@example.com' }).expect(200);
    assert.equal(getOutbox().length, sentBefore, 'no email for unknown accounts');

    await request(app).post('/api/auth/forgot-password').send({ email }).expect(200);
    const otp = lastOtp(email);
    await request(app).post('/api/auth/reset-password').send({ email, otp, password: 'short' }).expect(400);
    await request(app).post('/api/auth/reset-password').send({ email, otp, password: 'NewSecret456' }).expect(200);
    await request(app).post('/api/auth/login').send({ email, password: PASSWORD }).expect(401);
    await request(app).post('/api/auth/login').send({ email, password: 'NewSecret456' }).expect(200);
    // A reset code cannot be used to complete a sign-up.
    await request(app).post('/api/auth/signup/verify').send({ email, otp }).expect(400);
  });

  test('locks the OTP after five wrong attempts', async () => {
    const email = 'guesser@example.com';
    await request(app).post('/api/auth/signup').send({ name: 'Guesser', email, password: PASSWORD }).expect(200);
    const otp = lastOtp(email);
    const wrong = otp === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++) await request(app).post('/api/auth/signup/verify').send({ email, otp: wrong }).expect(400);
    await request(app).post('/api/auth/signup/verify').send({ email, otp: wrong }).expect(429);
    await request(app).post('/api/auth/signup/verify').send({ email, otp }).expect(400); // correct code no longer works
  });

  test('expired OTP is rejected', async () => {
    const email = 'late@example.com';
    await request(app).post('/api/auth/signup').send({ name: 'Late', email, password: PASSWORD }).expect(200);
    await OtpVerification.updateOne({ email }, { expiresAt: new Date(Date.now() - 1000) });
    await request(app).post('/api/auth/signup/verify').send({ email, otp: lastOtp(email) }).expect(400);
  });

  test('accounts without a password are told to reset it', async () => {
    const { User } = await import('../src/models/index.js');
    await User.create({ email: 'legacy@example.com', name: 'Legacy' });
    const res = await request(app).post('/api/auth/login').send({ email: 'legacy@example.com', password: PASSWORD }).expect(401);
    assert.match(res.body.message, /Forgot password/);
  });

  test('me / logout', async () => {
    const { agent } = await login('me@example.com');
    const me = await agent.get('/api/auth/me').expect(200);
    assert.equal(me.body.user.email, 'me@example.com');
    await agent.post('/api/auth/logout').expect(200);
    const after = await agent.get('/api/auth/me').expect(200);
    assert.equal(after.body.user, null);
  });

  test('protected routes require login', async () => {
    await request(app).get('/api/cart').expect(401);
    await request(app).get('/api/orders/my').expect(401);
    await request(app).get('/api/admin/orders').expect(401);
  });
});

describe('cart, wishlist and orders', () => {
  const address = { fullName: 'Test Customer', phone: '9876543210', line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' };

  test('guest quote prices from the database, not the client', async () => {
    const p = await Product.findOne({ slug: 'zoya-chandbali-earrings' });
    const res = await request(app).post('/api/cart/quote').send({ items: [{ productId: p.id, quantity: 2, price: 1 }] }).expect(200);
    assert.equal(res.body.totals.subtotal, p.price * 2);
  });

  test('variant is required for products with variants', async () => {
    const { agent } = await login('variant@example.com');
    const p = await Product.findOne({ slug: 'kavya-jhumka-earrings' });
    await agent.post('/api/cart/items').send({ productId: p.id, quantity: 1 }).expect(400);
    const res = await agent.post('/api/cart/items').send({ productId: p.id, variantSku: p.variants[1].sku, quantity: 1 }).expect(201);
    assert.equal(res.body.items[0].variantLabel, p.variants[1].label);
  });

  test('cart CRUD, stock limits and COD order with stock decrement', async () => {
    const { agent } = await login('buyer@example.com');
    const p = await Product.findOne({ slug: 'zoya-chandbali-earrings' });
    const startStock = p.stock;

    let res = await agent.post('/api/cart/items').send({ productId: p.id, quantity: 1 }).expect(201);
    const itemId = res.body.items[0].id;
    res = await agent.patch(`/api/cart/items/${itemId}`).send({ quantity: 2 }).expect(200);
    assert.equal(res.body.totals.subtotal, p.price * 2);
    await agent.patch(`/api/cart/items/${itemId}`).send({ quantity: startStock + 1 > 10 ? 10 : startStock + 1 }).expect((r) => assert.ok([200, 409].includes(r.status)));
    await agent.patch(`/api/cart/items/${itemId}`).send({ quantity: 2 }).expect(200);

    const order = await agent.post('/api/orders').send({ address, shippingMethod: 'standard', paymentMethod: 'cod', saveAddress: true }).expect(201);
    assert.equal(order.body.order.status, 'placed');
    assert.equal(order.body.order.subtotal, p.price * 2);
    assert.equal(order.body.order.total, order.body.order.subtotal + order.body.order.shippingFee);
    assert.match(order.body.order.orderNumber, /^DARA\d+/);

    const after = await Product.findById(p.id);
    assert.equal(after.stock, startStock - 2);

    const cart = await agent.get('/api/cart').expect(200);
    assert.equal(cart.body.items.length, 0);

    const mine = await agent.get('/api/orders/my').expect(200);
    assert.equal(mine.body.items.length, 1);

    const me = await agent.get('/api/auth/me');
    assert.equal(me.body.user.addresses.length, 1);

    // Another customer cannot read this order.
    const { agent: other } = await login('other@example.com');
    await other.get(`/api/orders/${order.body.order.id}`).expect(404);

    // Cancelling restores stock.
    await agent.post(`/api/orders/${order.body.order.id}/cancel`).expect(200);
    assert.equal((await Product.findById(p.id)).stock, startStock);
  });

  test('cannot order out-of-stock items', async () => {
    const { agent } = await login('oos@example.com');
    const p = await Product.findOne({ slug: 'meher-ad-necklace' });
    await agent.post('/api/cart/items').send({ productId: p.id, quantity: 1 }).expect(201);
    await Product.updateOne({ _id: p.id }, { stock: 0 });
    await agent.post('/api/orders').send({ address, paymentMethod: 'cod' }).expect(409);
    await Product.updateOne({ _id: p.id }, { stock: p.stock });
  });

  test('empty cart cannot be ordered', async () => {
    const { agent } = await login('empty@example.com');
    await agent.post('/api/orders').send({ address, paymentMethod: 'cod' }).expect(400);
  });

  test('wishlist add / list / remove', async () => {
    const { agent } = await login('wish@example.com');
    const p = await Product.findOne({ slug: 'tara-stud-earrings' });
    await agent.post('/api/wishlist/items').send({ productId: p.id }).expect(201);
    await agent.post('/api/wishlist/items').send({ productId: p.id }).expect(201);
    let res = await agent.get('/api/wishlist').expect(200);
    assert.equal(res.body.items.length, 1);
    res = await agent.delete(`/api/wishlist/items/${p.id}`).expect(200);
    assert.equal(res.body.items.length, 0);
  });
});

describe('payments', () => {
  async function pendingOrder(user) {
    const p = await Product.findOne({ slug: 'riya-bangle-set' });
    return Order.create({
      orderNumber: `DARA-T-${Date.now()}`,
      user: user.id,
      email: user.email,
      items: [{ product: p._id, name: p.name, sku: p.sku, unitPrice: p.price, quantity: 1, lineTotal: p.price }],
      shippingAddress: { fullName: 'X', phone: '9876543210', line1: 'a', city: 'b', state: 'c', pincode: '560001' },
      subtotal: p.price,
      shippingFee: 0,
      total: p.price,
      paymentMethod: 'razorpay',
      payment: { razorpayOrderId: `order_${crypto.randomBytes(6).toString('hex')}` },
    });
  }

  test('rejects a forged checkout signature and never marks paid', async () => {
    const { agent, user } = await login('payer@example.com');
    const order = await pendingOrder(user);
    await agent
      .post(`/api/orders/${order.id}/verify-payment`)
      .send({ razorpay_order_id: order.payment.razorpayOrderId, razorpay_payment_id: 'pay_fake', razorpay_signature: 'deadbeef' })
      .expect(400);
    const fresh = await Order.findById(order.id);
    assert.notEqual(fresh.paymentStatus, 'paid');
  });

  test('webhook with valid signature marks paid; invalid signature rejected', async () => {
    const { user } = await login('hook@example.com');
    const order = await pendingOrder(user);
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_123', order_id: order.payment.razorpayOrderId, amount: order.total * 100 } } },
    });
    await request(app).post('/api/payments/razorpay/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', 'bad').send(body).expect(400);

    const sig = crypto.createHmac('sha256', 'test_webhook_secret').update(body).digest('hex');
    await request(app).post('/api/payments/razorpay/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', sig).send(body).expect(200);
    const fresh = await Order.findById(order.id);
    assert.equal(fresh.paymentStatus, 'paid');
    assert.equal(fresh.status, 'placed');
  });
});

describe('reviews, forms and admin', () => {
  test('reviews require moderation before display', async () => {
    const { agent } = await login('reviewer@example.com');
    const p = await Product.findOne({ slug: 'tara-stud-earrings' });
    await agent.post(`/api/products/${p.id}/reviews`).send({ rating: 5, body: 'Lovely earrings, very elegant.' }).expect(201);
    let res = await request(app).get(`/api/products/${p.id}/reviews`).expect(200);
    assert.equal(res.body.items.length, 0);

    const { agent: admin } = await login('admin@example.com');
    const review = await Review.findOne({ product: p.id });
    await admin.patch(`/api/admin/reviews/${review.id}`).send({ status: 'approved' }).expect(200);
    res = await request(app).get(`/api/products/${p.id}/reviews`).expect(200);
    assert.equal(res.body.items.length, 1);
    assert.equal(res.body.ratingCount, 1);
  });

  test('admin dashboard, product editing and order lookup', async () => {
    const { agent: admin } = await login('admin@example.com');
    const stats = await admin.get('/api/admin/stats').expect(200);
    assert.ok(stats.body.products.active > 0);
    assert.ok(stats.body.orders.total >= 1);
    assert.ok(Array.isArray(stats.body.lowStock));

    const low = await admin.get('/api/admin/products?stock=out').expect(200);
    assert.ok(low.body.items.every((p) => p.totalStock <= 0));

    const list = await admin.get('/api/admin/products?q=riya').expect(200);
    const product = list.body.items[0];
    const res = await admin.patch(`/api/admin/products/${product.id}`).send({ price: 1999, compareAtPrice: null, isFeatured: true }).expect(200);
    assert.equal(res.body.product.price, 1999);
    assert.equal(res.body.product.compareAtPrice, null);
    const one = await admin.get(`/api/admin/products/${product.id}`).expect(200);
    assert.equal(one.body.product.isFeatured, true);

    const orders = await admin.get('/api/admin/orders?q=DARA').expect(200);
    const detail = await admin.get(`/api/admin/orders/${orders.body.items[0].id}`).expect(200);
    assert.equal(detail.body.order.id, orders.body.items[0].id);

    const customers = await admin.get('/api/admin/customers?q=buyer').expect(200);
    assert.equal(customers.body.items[0].email, 'buyer@example.com');
  });

  test('admin deletes: category in use is blocked, collection untags products, product is removed everywhere', async () => {
    const { agent: admin } = await login('admin@example.com');
    const { Category, Collection, Wishlist } = await import('../src/models/index.js');

    const necklaces = await Category.findOne({ slug: 'necklaces' });
    const blocked = await admin.delete(`/api/admin/categories/${necklaces.id}`).expect(409);
    assert.match(blocked.body.message, /still has \d+ product/);

    const empty = await Category.create({ name: 'Temporary', slug: 'temporary' });
    await admin.delete(`/api/admin/categories/${empty.id}`).expect(200);
    assert.equal(await Category.exists({ slug: 'temporary' }), null);

    const everyday = await Collection.findOne({ slug: 'everyday' });
    const tagged = await Product.countDocuments({ collections: 'everyday' });
    assert.ok(tagged > 0);
    await admin.delete(`/api/admin/collections/${everyday.id}`).expect(200);
    assert.equal(await Product.countDocuments({ collections: 'everyday' }), 0);
    assert.ok((await Product.countDocuments()) > 0, 'products are kept');

    const { agent: shopper } = await login('deleter@example.com');
    const p = await Product.findOne({ slug: 'myra-hoop-earrings' });
    await shopper.post('/api/wishlist/items').send({ productId: p.id }).expect(201);
    await admin.delete(`/api/admin/products/${p.id}`).expect(200);
    assert.equal(await Product.exists({ _id: p._id }), null);
    const wl = await Wishlist.findOne({ products: p._id });
    assert.equal(wl, null, 'removed from wishlists');
    await request(app).get('/api/products/myra-hoop-earrings').expect(404);
  });

  test('admin image upload converts to WebP and is served; non-images are rejected', async () => {
    const { agent: admin } = await login('admin@example.com');
    const sharp = (await import('sharp')).default;
    const png = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: '#880e4f' } }).png().toBuffer();

    const res = await admin.post('/api/admin/uploads?folder=banners').attach('file', png, 'My Banner.png').expect(201);
    assert.match(res.body.url, /^\/uploads\/banners\/my-banner-[0-9a-f]{8}\.webp$/);
    assert.equal(res.body.width, 2000, 'scaled to the banner maximum');

    const served = await request(app).get(res.body.url).expect(200);
    assert.equal(served.headers['content-type'], 'image/webp');

    await admin.post('/api/admin/uploads?folder=products').attach('file', Buffer.from('not an image'), { filename: 'x.txt', contentType: 'text/plain' }).expect(400);
    await admin.post('/api/admin/uploads?folder=../../etc').attach('file', png, 'x.png').expect(400);
    await request(app).post('/api/admin/uploads?folder=products').attach('file', png, 'x.png').expect(401);

    const { rm } = await import('node:fs/promises');
    const { UPLOAD_DIR } = await import('../src/services/upload.service.js');
    await rm(`${UPLOAD_DIR}/${res.body.url.replace('/uploads/', '')}`, { force: true });
  });

  test('non-admins cannot use admin APIs', async () => {
    const { agent } = await login('customer@example.com');
    await agent.get('/api/admin/orders').expect(403);
  });

  test('newsletter subscribe is idempotent and validated', async () => {
    await request(app).post('/api/newsletter/subscribe').send({ email: 'bad' }).expect(400);
    await request(app).post('/api/newsletter/subscribe').send({ email: 'news@example.com' }).expect(201);
    await request(app).post('/api/newsletter/subscribe').send({ email: 'news@example.com' }).expect(201);
  });

  test('site config exposes payment availability, never secrets', async () => {
    const res = await request(app).get('/api/site/config').expect(200);
    assert.equal(res.body.payments.cod, true);
    assert.equal(JSON.stringify(res.body).includes('test_key_secret'), false);
  });
});
