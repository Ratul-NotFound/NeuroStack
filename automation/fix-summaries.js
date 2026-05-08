/**
 * NeuroStack Summary Repair Engine v2
 * Finds ALL posts with broken/fallback summaries and re-generates them
 * using the full 4-provider AI chain.
 */
import { db, Timestamp } from './firestore.js';
import { summarizeContent } from './summarizer.js';

const DELAY_BETWEEN_REQUESTS = 5000; // 5s — safe for Groq/Together free tiers

function isBroken(summary) {
  if (!summary || summary.trim().length === 0) return true;
  const fallbackPhrases = [
    'auto-summary unavailable',
    'ai summary pending',
    'ai summary unavailable',
    'quota reset',
    'view the original content for full details',
    'will be auto-repaired',
    '⚠️ ai summary pending'
  ];
  const lower = summary.toLowerCase();
  return fallbackPhrases.some(phrase => lower.includes(phrase));
}

async function fixSummaries() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🛠️  NeuroStack Repair Engine v2        ║');
  console.log('╚══════════════════════════════════════════╝');

  const catsSnap = await db.collection('categories').get();
  const allowedCategories = catsSnap.docs.map(d => d.id);
  console.log(`📂 Categories: ${allowedCategories.join(', ')}`);

  const postsSnap = await db.collection('posts').get();
  const allPosts = postsSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }));
  const brokenPosts = allPosts.filter(p => isBroken(p.summary));

  console.log(`📊 Total posts: ${allPosts.length}`);
  console.log(`🔍 Posts needing repair: ${brokenPosts.length}`);
  console.log('');

  if (brokenPosts.length === 0) {
    console.log('✅ All posts have proper AI summaries! Nothing to fix.');
    process.exit(0);
  }

  let fixed = 0;
  let failed = 0;

  for (let i = 0; i < brokenPosts.length; i++) {
    const post = brokenPosts[i];
    console.log(`[${i + 1}/${brokenPosts.length}] Repairing: "${post.title?.substring(0, 60)}"`);

    try {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));

      const result = await summarizeContent(
        post.title || 'Untitled',
        post.summary || '',  // use old broken summary as description context
        '',
        allowedCategories,
        'article',
        post.category || '',
        []
      );

      if (!isBroken(result.summary)) {
        await post.ref.update({
          summary: result.summary,
          category: result.category,
          repairedAt: Timestamp.now()
        });
        console.log(`   ✅ Fixed! Category: ${result.category}`);
        fixed++;
      } else {
        console.log(`   ⚠️  AI still returned fallback — skipping.`);
        failed++;
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      failed++;
    }
  }

  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║              Repair Complete              ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`   ✅ Fixed:  ${fixed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total:  ${brokenPosts.length}`);
  process.exit(0);
}

fixSummaries().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
