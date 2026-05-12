
import admin from 'firebase-admin';
import fetch from 'node-fetch';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function extractBestImage(url) {
  try {
    const res = await fetch(url, { 
      timeout: 5000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      }
    });
    const html = await res.text();
    
    // Robust multi-pattern matching for og:image
    const patterns = [
      /<meta[^>]+property=[\"']og:image[\"'][^>]+content=[\"']([^\"']+)[\"']/i,
      /<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+property=[\"']og:image[\"']/i,
      /<meta[^>]+name=[\"']twitter:image[\"'][^>]+content=[\"']([^\"']+)[\"']/i,
      /<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+name=[\"']twitter:image[\"']/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1];
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function finalBackfill() {
  console.log('🚀 Final High-Volume Article Backfill...');
  const snap = await db.collection('posts')
    .orderBy('fetchedAt', 'desc')
    .limit(200)
    .get();

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.thumbnail) continue;

    console.log(`🔍 Checking: ${data.title.substring(0, 30)}...`);
    const imgUrl = await extractBestImage(data.link);
    
    if (imgUrl) {
      await doc.ref.update({ 
        thumbnail: imgUrl,
        fetchedAt: admin.firestore.Timestamp.now() // Trigger sync!
      });
      console.log(`   ✅ Success!`);
      updated++;
    } else {
      console.log(`   ❌ Failed.`);
    }
    await new Promise(r => setTimeout(r, 100)); // Be nice
  }
  console.log(`\n🎉 Done! Updated ${updated} posts.`);
}

finalBackfill().catch(console.error);
