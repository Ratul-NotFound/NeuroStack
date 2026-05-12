
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
      timeout: 8000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    
    // Robust multi-pattern matching for og:image
    const patterns = [
      /<meta[^>]+property=[\"']og:image[\"'][^>]+content=[\"']([^\"']+)[\"']/i,
      /<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+property=[\"']og:image[\"']/i,
      /<meta[^>]+name=[\"']twitter:image[\"'][^>]+content=[\"']([^\"']+)[\"']/i,
      /<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+name=[\"']twitter:image[\"']/i,
      /<link[^>]+rel=[\"']image_src[\"'][^>]+href=[\"']([^\"']+)[\"']/i
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

async function fixSpecificPosts() {
  console.log('🚀 Running High-Precision Backfill...');
  
  // Get latest 50 posts
  const snap = await db.collection('posts')
    .orderBy('fetchedAt', 'desc')
    .limit(50)
    .get();

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.thumbnail && !data.thumbnail.includes('placeholder')) continue;

    console.log(`🔍 Checking: ${data.title.substring(0, 40)}...`);
    const imgUrl = await extractBestImage(data.link);
    
    if (imgUrl) {
      await doc.ref.update({ thumbnail: imgUrl });
      console.log(`   ✅ Found: ${imgUrl.substring(0, 60)}...`);
      updated++;
    } else {
      console.log(`   ❌ No image found.`);
    }
  }

  console.log(`\n🎉 Done! Fixed ${updated} posts.`);
}

fixSpecificPosts().catch(console.error);
