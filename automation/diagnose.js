import { db } from './firestore.js';

async function diagnose() {
  console.log('🔍 NeuroStack Automation Diagnostic');
  console.log('---------------------------------');

  // 1. Check Sources
  const sourcesSnap = await db.collection('sources').get();
  console.log(`📡 Sources in DB: ${sourcesSnap.size}`);
  
  sourcesSnap.forEach(doc => {
    const data = doc.data();
    const lastFetch = data.lastFetch ? data.lastFetch.toDate().toLocaleString() : 'NEVER';
    console.log(`   - ${data.name}: Last Sync: ${lastFetch}`);
  });

  // 2. Check Today's Posts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const postsSnap = await db.collection('posts')
    .where('fetchedAt', '>=', today)
    .get();
  
  console.log('');
  console.log(`📝 Posts saved TODAY: ${postsSnap.size}`);
  
  if (postsSnap.size > 0) {
    console.log('✅ Automation IS working! New posts were found today.');
  } else {
    console.log('⚠️  Automation did NOT save any new posts today.');
    console.log('   Possible reasons:');
    console.log('   - No new news in RSS feeds');
    console.log('   - GitHub Actions failed to run');
    console.log('   - Missing API keys in GitHub Secrets');
  }

  process.exit(0);
}

diagnose();
