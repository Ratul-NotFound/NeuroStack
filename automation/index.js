import { db, Timestamp } from './firestore.js';
import { fetchRSS } from './fetchers/rssFetcher.js';
import { summarizeContent } from './summarizer.js';

async function main() {
  console.log('Starting daily fetch automation...');

  // 1. Fetch categories to provide to Gemini
  const categoriesSnapshot = await db.collection('categories').get();
  const allowedCategories = categoriesSnapshot.docs.map(doc => doc.id);
  
  if (allowedCategories.length === 0) {
    console.warn('No categories found in Firestore. Seeding default...');
    // Seed default categories if empty
    const defaults = ['General', 'AI', 'Web Development', 'Business'];
    for (const cat of defaults) {
      await db.collection('categories').doc(cat.toLowerCase()).set({ name: cat });
      allowedCategories.push(cat.toLowerCase());
    }
  }

  // 2. Fetch sources
  const sourcesSnapshot = await db.collection('sources').get();
  
  for (const sourceDoc of sourcesSnapshot.docs) {
    const source = sourceDoc.data();
    const sourceId = sourceDoc.id;
    console.log(`Checking source: ${source.name} (${source.url})`);

    let items = [];
    if (source.type === 'rss') {
      items = await fetchRSS(source.url, source.lastFetch);
    }

    console.log(`Found ${items.length} new items for ${source.name}`);

    for (const item of items) {
      // Check if post already exists
      const existing = await db.collection('posts').where('link', '==', item.link).get();
      if (!existing.empty) continue;

      console.log(`Summarizing: ${item.title}`);
      
      // Delay to respect Gemini RPM (15 RPM -> 1 request every 4 seconds)
      await new Promise(resolve => setTimeout(resolve, 4500));

      const { summary, category } = await summarizeContent(
        item.title,
        item.description,
        item.content,
        allowedCategories
      );

      await db.collection('posts').add({
        title: item.title,
        summary,
        link: item.link,
        sourceName: source.name,
        sourceUrl: source.sourceUrl || item.sourceUrl,
        category: category || source.category || allowedCategories[0],
        publishedAt: Timestamp.fromDate(item.publishedAt),
        fetchedAt: Timestamp.now(),
        isCustom: false
      });
    }

    // Update lastFetch for the source
    await db.collection('sources').doc(sourceId).update({
      lastFetch: Timestamp.now()
    });
  }

  console.log('Automation finished.');
  process.exit(0);
}

main().catch(err => {
  console.error('Automation failed:', err);
  process.exit(1);
});
