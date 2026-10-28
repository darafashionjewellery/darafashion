/**
 * Starts the API against a throwaway in-memory MongoDB, seeded with sample data.
 * Useful for trying the storefront before MongoDB Atlas is configured.
 * Data is lost when the process stops. The MongoDB binary is downloaded on first run.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
process.env.MONGO_URI = mongo.getUri('dara');
process.env.ENABLE_COD ??= 'true';

const { connectDB } = await import('../src/config/db.js');
const { seed } = await import('../src/seed/seed.js');
const { createApp } = await import('../src/app.js');
const { env } = await import('../src/config/env.js');

await connectDB(process.env.MONGO_URI);
await seed();
createApp().listen(env.port, () => {
  console.log(`DARA API (in-memory MongoDB) on http://localhost:${env.port}`);
  console.log('OTP emails are printed below. Data resets when this process stops.');
});

const stop = async () => {
  await mongo.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
