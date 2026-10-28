import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`DARA API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    if (env.email.transport === 'console') console.log('Email transport: console — OTP emails are printed to this log.');
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
