import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(uri = env.mongoUri) {
  if (!uri) throw new Error('MONGO_URI is not set. Add it to server/.env (see .env.example).');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { autoIndex: !env.isProd });
  return mongoose.connection;
}
