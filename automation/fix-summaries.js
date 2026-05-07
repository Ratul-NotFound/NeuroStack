import { db } from './firestore.js';
import { summarizeContent } from './summarizer.js';

async function fixSummaries() {
  console.log('🛠️ NeuroStack Summary Repair Tool');
  console.log('---------------------------------');

  // 1. Get all categories for context
  const catsSnap = await db.collection('categories').get();
  const allowedCategories = catsSnap.docs.map(d => d.id);

  // 2. Find posts with the fallback summary
  const postsSnap = await db.collection('posts').get();
  const brokenPosts = postsSnap.docs.filter(doc => 
    doc.data().summary && doc.data().summary.includes('Auto-summary unavailable')
  );

  console.log(`🔍 Found ${brokenPosts.length} posts needing repair.`);

  for (let i = 0; i < brokenPosts.length; i++) {
    const postDoc = brokenPosts[i];
    const data = postDoc.data();
    
    console.log(`[${i+1}/${brokenPosts.length}] ✨ Repairing: "${data.title.substring(0, 50)}..."`);

    try {
      // Use 10s delay to be 100% safe under OpenRouter's 8RPM limit
      await new Promise(resolve => setTimeout(resolve, 10000));

      const result = await summarizeContent(
        data.title, 
        '', 
        data.summary, 
        allowedCategories, 
        'article',
        '', // categoryHint
        []  // tags
      );

      // If it returned a real summary (not a fallback)
      if (!result.summary.includes('Auto-summary unavailable')) {
        await postDoc.ref.update({
          summary: result.summary,
          category: result.category
        });
        console.log(`   ✅ Success! Category: ${result.category}`);
      } else {
        console.log(`   ⚠️  AI still returned fallback. Quota might still be full.`);
        break; // Stop if we are still hitting limits
      }
    } catch (err) {
      console.error(`   ❌ Repair failed: ${err.message}`);
      if (err.message.includes('429') || err.message.includes('quota')) {
        console.log('   🛑 Quota exhausted. Try again in an hour.');
        break;
      }
    }
  }

  console.log('---------------------------------');
  console.log('✅ Repair session finished.');
  process.exit(0);
}

fixSummaries().catch(console.error);
