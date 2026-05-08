import { db, Timestamp } from './firestore.js';
import { summarizeContent } from './summarizer.js';

async function upgradeSummaries() {
  console.log('🚀 Upgrading the 10 most recent posts to the new highly detailed multi-paragraph format...');

  // Fetch the 10 most recent posts
  const snap = await db.collection('posts')
    .orderBy('publishedAt', 'desc')
    .limit(10)
    .get();

  const posts = snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }));
  console.log(`Found ${posts.length} posts. Re-generating summaries...`);

  // We need to fetch the categories array to pass to summarizeContent
  const catsSnap = await db.collection('categories').get();
  const allowedCategories = catsSnap.docs.map(d => d.id);

  let updated = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`\n[${i+1}/10] Upgrading: "${post.title.substring(0, 50)}..."`);
    
    try {
      // Small delay for rate limits
      if (i > 0) await new Promise(r => setTimeout(r, 5000));

      const result = await summarizeContent(
        post.title,
        '', // We don't have the original description easily accessible without re-fetching RSS, but the existing summary works as content
        post.summary, 
        allowedCategories,
        'article',
        post.category
      );

      // Update Firestore with the beautiful new summary
      await post.ref.update({
        summary: result.summary,
        category: result.category,
        repairedAt: Timestamp.now()
      });

      console.log(`✅ Success! Upgraded summary format.`);
      updated++;
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`);
    }
  }

  console.log(`\n🎉 Upgrade complete! ${updated} posts have been rewritten into the new multi-paragraph format.`);
  process.exit(0);
}

upgradeSummaries().catch(e => {
  console.error(e);
  process.exit(1);
});
