import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

let serviceAccount;

// Strategy 1: Try service-account.json file (local dev — most reliable)
const jsonPath = join(__dirname, 'service-account.json');
if (existsSync(jsonPath)) {
  try {
    serviceAccount = JSON.parse(readFileSync(jsonPath, 'utf8'));
    console.log('✅ Firebase: loaded credentials from service-account.json');
  } catch (e) {
    console.warn('⚠️  service-account.json found but failed to parse:', e.message);
  }
}

// Strategy 2: Fall back to FIREBASE_SERVICE_ACCOUNT_JSON env var (GitHub Actions)
if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log('✅ Firebase: loaded credentials from FIREBASE_SERVICE_ACCOUNT_JSON env var');
  } catch (e) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
    process.exit(1);
  }
}

if (!serviceAccount) {
  console.error('❌ No Firebase credentials found!');
  console.error('   Local dev: place service-account.json in automation/');
  console.error('   GitHub Actions: set FIREBASE_SERVICE_ACCOUNT_JSON secret');
  process.exit(1);
}

// Sanitize private key — handles escaped newlines from JSON strings
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key
    .replace(/\\n/g, '\n')
    .trim();
}

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

export const db = getFirestore();
export { Timestamp };
