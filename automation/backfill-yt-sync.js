
import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  return match ? match[1] : null;
}

async function backfillYouTube() {
  console.log('🚀 Re-running YouTube Backfill with Sync Trigger...');
  const snap = await db.collection('posts').get();
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const ytId = getYouTubeId(data.link);
    if (ytId) {
      const thumbUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
      await doc.ref.update({ 
        thumbnail: thumbUrl,
        fetchedAt: admin.firestore.Timestamp.now() 
      });
      updated++;
    }
  }
  console.log(`✅ Done! Updated ${updated} YouTube posts.`);
}

backfillYouTube().catch(console.error);
