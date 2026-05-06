import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { readFileSync } from 'fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'service-account.json'), 'utf8')
);

// Thoroughly sanitize the private key
serviceAccount.private_key = serviceAccount.private_key
  .replace(/\\n/g, '\n')
  .trim();

// Ensure it starts and ends correctly
if (!serviceAccount.private_key.startsWith('-----BEGIN PRIVATE KEY-----')) {
  serviceAccount.private_key = `-----BEGIN PRIVATE KEY-----\n${serviceAccount.private_key}`;
}
if (!serviceAccount.private_key.endsWith('-----END PRIVATE KEY-----')) {
  serviceAccount.private_key = `${serviceAccount.private_key}\n-----END PRIVATE KEY-----`;
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

export const db = getFirestore();
export { Timestamp };
