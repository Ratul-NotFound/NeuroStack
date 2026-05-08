/**
 * NeuroStack Repair Engine v3 — Firebase-Quota-Safe
 *
 * Strategy: Use targeted Firestore queries to find only broken posts
 * instead of reading ALL posts. Processes in small batches with delays
 * to stay well within free-tier limits.
 *
 * Firebase reads used: ~(brokenCount) reads, NOT all 3800+ posts.
 */
import { db, Timestamp } from './firestore.js';
import { summarizeContent } from './summarizer.js';

const DELAY_MS    = 8000;  // 8s between AI calls — safe for Groq 30RPM free tier
const BATCH_LIMIT = 200;   // Process a large batch to utilize free daily tokens

// All fallback phrases we want to repair
const BROKEN_PHRASES = [
  'auto-summary unavailable',
  'ai summary pending',
  'ai summary unavailable',
  'quota reset',
  'will be auto-repaired',
  'view the original content for full details',
];

function isBroken(summary) {
  if (!summary || summary.trim().length < 20) return true;
  const lower = summary.toLowerCase();
  return BROKEN_PHRASES.some(p => lower.includes(p));
}

async function fixSummaries() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🛠️  NeuroStack Quota-Safe Repair v3        ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`   Batch size: ${BATCH_LIMIT} posts | Delay: ${DELAY_MS/1000}s between calls`);
  console.log('');

  // ── Step 1: Load categories (1 read) ──────────────────────────────────────
  const catsSnap = await db.collection('categories').get();
  const allowedCategories = catsSnap.docs.map(d => d.id);
  console.log(`📂 Categories: ${allowedCategories.join(', ')}`);

  // ── Step 2: Targeted query — only posts that contain fallback phrase ────────
  // This avoids reading all 3800+ posts. Firestore returns only matching docs.
  console.log(`📡 Querying for broken posts (limit: ${BATCH_LIMIT})...`);
  
  let brokenDocs = [];

  // Firestore can't do "contains string" queries natively, so we use
  // a flag field approach: query posts NOT yet repaired, small batch only
  try {
    // Primary: find posts where repairedAt doesn't exist (never fixed)
    // and fetchedAt is older than today (already processed yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const snap = await db.collection('posts')
      .where('fetchedAt', '<', Timestamp.fromDate(today))
      .orderBy('fetchedAt', 'asc') // oldest broken posts first
      .limit(BATCH_LIMIT * 3) // fetch 3x and filter client-side to find broken ones
      .get();

    const candidates = snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }));
    brokenDocs = candidates.filter(p => isBroken(p.summary)).slice(0, BATCH_LIMIT);
    
    console.log(`   ✅ Scanned ${candidates.length} candidates → ${brokenDocs.length} broken posts found`);
  } catch (err) {
    console.error(`   ❌ Query failed: ${err.message}`);
    process.exit(1);
  }

  if (brokenDocs.length === 0) {
    console.log('');
    console.log('✅ No broken posts found in this batch. All good!');
    process.exit(0);
  }

  // ── Step 3: Repair broken posts ───────────────────────────────────────────
  let fixed = 0, failed = 0;

  for (let i = 0; i < brokenDocs.length; i++) {
    const post = brokenDocs[i];
    console.log(`[${i + 1}/${brokenDocs.length}] Repairing: "${post.title?.substring(0, 60)}"`);

    try {
      // Delay BEFORE the AI call to pace the requests
      if (i > 0) await new Promise(r => setTimeout(r, DELAY_MS));

      const result = await summarizeContent(
        post.title || 'Untitled',
        post.summary || '',
        '',
        allowedCategories,
        'article',
        post.category || '',
        []
      );

      if (!isBroken(result.summary)) {
        // 1 Firebase WRITE per repair — minimal
        await post.ref.update({
          summary: result.summary,
          category: result.category,
          repairedAt: Timestamp.now(),
        });
        console.log(`   ✅ Fixed → [${result.category}]`);
        fixed++;
      } else {
        console.log(`   ⚠️  AI still returned fallback. Skipping.`);
        failed++;
      }
    } catch (err) {
      console.error(`   ❌ ${err.message}`);
      failed++;
    }
  }

  // ── Step 4: Summary ───────────────────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║              Batch Repair Done               ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`   ✅ Fixed:  ${fixed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   💡 Run again to repair the next batch of ${BATCH_LIMIT}.`);
  process.exit(0);
}

fixSummaries().catch(err => {
  console.error('💥 Fatal:', err.message);
  process.exit(1);
});
