/**
 * NeuroStack Source Seeder & URL Fixer
 * 
 * Run this ONCE to:
 * 1. Fix existing sources in Firestore that have wrong/broken URLs
 * 2. Seed your Firestore with categories and a curated list of top learning sources
 *    covering: AI, Machine Learning, Web Development, Programming, and general tech
 * 
 * Usage: node seed.js
 */
import { db, Timestamp } from './firestore.js';
import { resolveYouTubeUrl, isFacebookUrl } from './fetchers/rssFetcher.js';

// ============================================================
// YOUR CURATED LEARNING SOURCES
// Add/remove as you like. These cover AI, ML, Web Dev, Tech.
// ============================================================
const CURATED_SOURCES = [
  // ─── AI & Machine Learning ───────────────────────────────────
  {
    name: '3Blue1Brown',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCYO_jab_esuFRV4b17AJtAw',
    type: 'rss',
    category: 'ai',
    description: 'Visual math & deep learning concepts — best for understanding ML intuitively'
  },
  {
    name: 'Andrej Karpathy',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXUPKJO5MZQMU11T6R9T7tg',
    type: 'rss',
    category: 'ai',
    description: 'Ex-Tesla AI director — deep dives on LLMs, neural nets'
  },
  {
    name: 'Two Minute Papers',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg',
    type: 'rss',
    category: 'ai',
    description: 'Latest AI research papers explained in 2 minutes'
  },
  {
    name: 'Yannic Kilcher',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCZHmQk67mSJgfCCTn7xBfew',
    type: 'rss',
    category: 'ai',
    description: 'Deep ML paper reviews — GPT, diffusion models, transformers'
  },
  {
    name: 'Sentdex',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCfzlCWGWYyIQ0aLC5w48gBQ',
    type: 'rss',
    category: 'machine-learning',
    description: 'Practical Python ML & AI tutorials'
  },
  {
    name: 'Towards Data Science',
    url: 'https://medium.com/feed/towards-data-science',
    type: 'rss',
    category: 'machine-learning',
    description: 'Top ML/AI articles and tutorials from practitioners'
  },
  {
    name: 'Google AI Blog',
    url: 'https://blog.research.google/feeds/posts/default',
    type: 'rss',
    category: 'ai',
    description: 'Official Google Research blog — latest AI breakthroughs'
  },
  {
    name: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    type: 'rss',
    category: 'ai',
    description: 'Official OpenAI announcements and research updates'
  },
  {
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    type: 'rss',
    category: 'ai',
    description: 'Practical ML tutorials and model releases from Hugging Face'
  },

  // ─── Web Development ─────────────────────────────────────────
  {
    name: 'Fireship',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCVyRiMvfUNMA1UPlDPzG5Ow',
    type: 'rss',
    category: 'web-development',
    description: 'Fast-paced web dev tutorials — React, Firebase, JavaScript in 100 seconds'
  },
  {
    name: 'Traversy Media',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC29ju8bIPH5as8OGnQzwJyA',
    type: 'rss',
    category: 'web-development',
    description: 'Full-stack web dev tutorials — React, Node, Python, PHP'
  },
  {
    name: 'Kevin Powell',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCJZv4d5rbIKd4QHMPkcABCw',
    type: 'rss',
    category: 'web-development',
    description: 'CSS wizard — mastering layouts, animations, modern CSS'
  },
  {
    name: 'Web Dev Simplified',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCFbNIlppjAuEX4znoulh0Cw',
    type: 'rss',
    category: 'web-development',
    description: 'Simplifying complex web dev concepts with projects'
  },
  {
    name: 'CSS-Tricks',
    url: 'https://css-tricks.com/feed/',
    type: 'rss',
    category: 'web-development',
    description: 'Top CSS and frontend articles, tips, and techniques'
  },
  {
    name: 'Smashing Magazine',
    url: 'https://www.smashingmagazine.com/feed/',
    type: 'rss',
    category: 'web-development',
    description: 'In-depth frontend, UX, and design articles for professionals'
  },
  {
    name: 'Dev.to (Web Dev)',
    url: 'https://dev.to/feed/tag/webdev',
    type: 'rss',
    category: 'web-development',
    description: 'Community articles on web development from dev.to'
  },

  // ─── Programming & CS ─────────────────────────────────────────
  {
    name: 'Code With Harry',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCeVMnSShP_Iviwkknt83cww',
    type: 'rss',
    category: 'programming',
    description: 'Programming tutorials in Hindi — Python, Web Dev, DSA'
  },
  {
    name: 'Tech With Tim',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC4JX40jDee_tINbkjycV4Sg',
    type: 'rss',
    category: 'programming',
    description: 'Python, ML, and game dev tutorials with clear explanations'
  },
  {
    name: 'freeCodeCamp',
    url: 'https://www.freecodecamp.org/news/rss/',
    type: 'rss',
    category: 'programming',
    description: 'Free tutorials and articles on all programming topics'
  },

  // ─── New Tech & Industry News ─────────────────────────────────
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    type: 'rss',
    category: 'new-tech',
    description: 'Breaking tech news — startups, AI, products, industry trends'
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    type: 'rss',
    category: 'new-tech',
    description: 'Consumer tech and science news with great writing'
  },
  {
    name: 'Hacker News (Best)',
    url: 'https://news.ycombinator.com/rss',
    type: 'rss',
    category: 'new-tech',
    description: 'Top tech/startup discussions from the HN community'
  },
  {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    type: 'rss',
    category: 'new-tech',
    description: 'Deep tech journalism — AI ethics, breakthroughs, future tech'
  },
];

// ============================================================
// CATEGORIES TO CREATE
// ============================================================
const CATEGORIES = [
  { id: 'ai',              name: 'Artificial Intelligence', order: 1 },
  { id: 'machine-learning', name: 'Machine Learning',      order: 2 },
  { id: 'web-development', name: 'Web Development',        order: 3 },
  { id: 'programming',    name: 'Programming',             order: 4 },
  { id: 'new-tech',       name: 'New Tech & Industry',     order: 5 },
  { id: 'general',        name: 'General',                 order: 6 },
];

async function fixExistingSources() {
  console.log('\n🔧 Checking existing sources for broken URLs...');
  const snap = await db.collection('sources').get();

  for (const doc of snap.docs) {
    const data = doc.data();
    const url = data.url;

    if (isFacebookUrl(url)) {
      console.log(`  ⚠️  Source "${data.name}" uses Facebook URL — Facebook has no public RSS.`);
      console.log(`     Marking as inactive. Please replace with an RSS alternative.`);
      await doc.ref.update({ active: false, note: 'Facebook pages do not support RSS. Please update URL.' });
      continue;
    }

    const youtubeRss = resolveYouTubeUrl(url);
    if (youtubeRss && youtubeRss !== url) {
      console.log(`  🔄 Fixing YouTube URL for "${data.name}": ${url} → ${youtubeRss}`);
      await doc.ref.update({ url: youtubeRss });
    }
  }

  console.log('  ✅ Existing source URLs checked and fixed.');
}

async function seedCategories() {
  console.log('\n📂 Seeding categories...');
  for (const cat of CATEGORIES) {
    const ref = db.collection('categories').doc(cat.id);
    const existing = await ref.get();
    if (!existing.exists) {
      await ref.set({ name: cat.name, order: cat.order });
      console.log(`  ✅ Created category: ${cat.name}`);
    } else {
      console.log(`  ⏩ Category already exists: ${cat.name}`);
    }
  }
}

async function seedSources() {
  console.log('\n📡 Seeding curated learning sources...');
  const existingSnap = await db.collection('sources').get();
  const existingUrls = new Set(existingSnap.docs.map(d => d.data().url));

  let added = 0;
  let skipped = 0;

  for (const source of CURATED_SOURCES) {
    if (existingUrls.has(source.url)) {
      console.log(`  ⏩ Already exists: ${source.name}`);
      skipped++;
      continue;
    }

    await db.collection('sources').add({
      name: source.name,
      url: source.url,
      type: source.type,
      category: source.category,
      active: true,
      lastFetch: null,
      createdAt: Timestamp.now(),
    });
    console.log(`  ✅ Added: ${source.name} [${source.category}]`);
    added++;
  }

  console.log(`\n  📊 Summary: ${added} added, ${skipped} already existed`);
}

async function main() {
  console.log('🌱 NeuroStack Seeder & URL Fixer');
  console.log('================================\n');

  await fixExistingSources();
  await seedCategories();
  await seedSources();

  console.log('\n✨ Done! Your NeuroStack is now configured with:');
  console.log(`   • ${CATEGORIES.length} categories`);
  console.log(`   • ${CURATED_SOURCES.length} curated learning sources`);
  console.log('\nRun "node index.js" to start the first fetch!');
  process.exit(0);
}

main().catch(err => {
  console.error('💥 Seeder failed:', err);
  process.exit(1);
});
