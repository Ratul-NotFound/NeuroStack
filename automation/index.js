/**
 * NeuroStack Daily Automation
 * Fetches new content from RSS feeds, summarizes with Gemini AI, saves to Firestore.
 * 
 * Run: node index.js
 * Triggered by: GitHub Actions daily at 06:00 UTC
 */
import { db, Timestamp } from './firestore.js';
import { fetchRSS, resolveYouTubeUrl, isFacebookUrl } from './fetchers/rssFetcher.js';
import { fetchYouTube } from './fetchers/youtubeFetcher.js';
import { summarizeContent } from './summarizer.js';

// ──────────────────────────────────────────────
// Utility: simple delay
// ──────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// Utility: exponential backoff for rate limits
// ──────────────────────────────────────────────
async function withExponentialBackoff(fn, maxRetries = 3, baseMs = 5000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.toLowerCase().includes('quota') ||
        err?.message?.toLowerCase().includes('rate limit');

      if (attempt === maxRetries || !isRateLimit) throw err;
      const waitMs = Math.min(baseMs * Math.pow(2, attempt), 60000);
      console.warn(`  ⏳ Rate limit hit. Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${maxRetries}...`);
      await delay(waitMs);
    }
  }
}

// ──────────────────────────────────────────────
// Detect source type for better Gemini prompting
// ──────────────────────────────────────────────
function detectSourceType(source) {
  const url = source.url || '';
  if (url.includes('youtube.com') || source.type === 'youtube' || source.type === 'youtube_rss') return 'video';
  if (url.includes('medium.com') || url.includes('blog') || url.includes('dev.to')) return 'blog';
  if (url.includes('techcrunch') || url.includes('theverge') || url.includes('news')) return 'article';
  return 'article';
}

// ──────────────────────────────────────────────
// Main automation function
// ──────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🧠 NeuroStack Daily Automation Starting    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`   Started: ${new Date().toISOString()}`);
  console.log('');

  // ── Step 1: Load categories ───────────────────
  console.log('📂 Loading categories from Firestore...');
  const categoriesSnapshot = await db.collection('categories').get();
  let allowedCategories = categoriesSnapshot.docs.map(doc => doc.id);

  if (allowedCategories.length === 0) {
    console.warn('⚠️  No categories found — seeding defaults. Run seed.js for full setup.');
    const defaults = [
      { id: 'ai', name: 'Artificial Intelligence' },
      { id: 'machine-learning', name: 'Machine Learning' },
      { id: 'web-development', name: 'Web Development' },
      { id: 'programming', name: 'Programming' },
      { id: 'new-tech', name: 'New Tech & Industry' },
      { id: 'general', name: 'General' },
    ];
    for (const cat of defaults) {
      await db.collection('categories').doc(cat.id).set({ name: cat.name, order: defaults.indexOf(cat) });
      allowedCategories.push(cat.id);
    }
  }

  console.log(`   ✅ Categories: ${allowedCategories.join(', ')}`);
  console.log('');

  // ── Step 2: Load active sources ───────────────
  console.log('📡 Loading sources from Firestore...');
  const sourcesSnapshot = await db.collection('sources').get();
  const allSources = sourcesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Only process sources that are not explicitly marked inactive
  const activeSources = allSources.filter(s => s.active !== false);
  
  console.log(`   ✅ ${activeSources.length} active source(s) found (${allSources.length - activeSources.length} skipped/inactive)`);
  console.log('');

  if (activeSources.length === 0) {
    console.warn('⚠️  No active sources! Run "node seed.js" to add curated learning sources.');
    process.exit(0);
  }

  // ── Step 3: Process each source ───────────────
  let totalNew = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  const results = [];

  for (let i = 0; i < activeSources.length; i++) {
    const source = activeSources[i];
    console.log(`[${i + 1}/${activeSources.length}] 🔍 "${source.name}" — ${source.url}`);

    // Skip Facebook — no public RSS
    if (isFacebookUrl(source.url)) {
      console.log(`   ⚠️  Skipping: Facebook pages have no public RSS feed.`);
      console.log(`   💡 Replace with an RSS-compatible source.`);
      results.push({ name: source.name, status: 'skipped-facebook', new: 0 });
      continue;
    }

    // Auto-fix YouTube handle URLs if needed
    let fetchUrl = source.url;
    const ytRss = resolveYouTubeUrl(source.url);
    if (ytRss && ytRss !== source.url) {
      console.log(`   🔄 Auto-fixing YouTube URL: ${source.url} → ${ytRss}`);
      fetchUrl = ytRss;
      // Persist the fix to Firestore so it's correct next time
      await db.collection('sources').doc(source.id).update({ url: ytRss });
    }

    // Fetch new items
    let items = [];
    try {
      const sourceType = source.type;
      if (sourceType === 'youtube' || sourceType === 'youtube_rss') {
        items = await fetchYouTube(fetchUrl, source.lastFetch || null);
      } else {
        items = await fetchRSS(fetchUrl, source.lastFetch || null);
      }
      console.log(`   📥 ${items.length} new item(s) to process`);
    } catch (err) {
      console.error(`   ❌ Fetch error: ${err.message}`);
      results.push({ name: source.name, status: 'error', new: 0 });
      totalErrors++;
      continue;
    }

    // Process each new item
    const sourceType = detectSourceType(source);
    let sourceNew = 0;

    for (const item of items) {
      // Duplicate check
      const existing = await db.collection('posts')
        .where('link', '==', item.link)
        .limit(1)
        .get();
      
      if (!existing.empty) {
        totalSkipped++;
        continue;
      }

      console.log(`   ✨ Summarizing: "${item.title.substring(0, 70)}..."`);

      // Rate limit: 15 RPM for Gemini free tier → delay 4.5s between requests
      await delay(4500);

      // Generate AI summary with exponential backoff
      let summaryResult;
      try {
        summaryResult = await withExponentialBackoff(() =>
          summarizeContent(
            item.title, 
            item.description, 
            item.content, 
            allowedCategories, 
            sourceType, 
            source.category,
            item.tags // New: Pass tags as extra context
          )
        );
      } catch (err) {
        console.error(`   ⚠️  AI summary failed, using fallback: ${err.message}`);
        summaryResult = {
          summary: `## 📄 ${item.title}\n\n${item.description?.substring(0, 400) || ''}\n\n---\n*View the original content for full details.*`,
          category: source.category || allowedCategories[0],
        };
      }

      const { summary, category } = summaryResult;

      // Validate category
      const finalCategory = allowedCategories.includes(category)
        ? category
        : (allowedCategories.includes(source.category) ? source.category : allowedCategories[0]);

      // Save to Firestore
      await db.collection('posts').add({
        title: item.title,
        summary,
        link: item.link,
        sourceName: source.name,
        sourceUrl: item.sourceUrl || source.url,
        category: finalCategory,
        publishedAt: item.publishedAt instanceof Date
          ? Timestamp.fromDate(item.publishedAt)
          : Timestamp.now(),
        fetchedAt: Timestamp.now(),
        isCustom: false,
      });

      totalNew++;
      sourceNew++;
      console.log(`   ✅ Saved [${finalCategory}]: "${item.title.substring(0, 60)}"`);
    }

    // Update lastFetch timestamp
    await db.collection('sources').doc(source.id).update({
      lastFetch: Timestamp.now(),
    });

    results.push({ name: source.name, status: 'ok', new: sourceNew });
    console.log('');
  }

  // ── Step 4: Print summary ────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║            🎉 Automation Complete!           ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`   ⏱  Duration: ${elapsed}s`);
  console.log(`   📝 New posts saved: ${totalNew}`);
  console.log(`   ⏩ Duplicates skipped: ${totalSkipped}`);
  console.log(`   ❌ Source errors: ${totalErrors}`);
  console.log('');
  console.log('   Per-source results:');
  results.forEach(r => {
    const icon = r.status === 'ok' ? '✅' : r.status === 'error' ? '❌' : '⚠️ ';
    console.log(`   ${icon} ${r.name}: ${r.new} new post(s)`);
  });
  console.log('');

  process.exit(0);
}

main().catch(err => {
  console.error('');
  console.error('💥 Fatal automation error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
