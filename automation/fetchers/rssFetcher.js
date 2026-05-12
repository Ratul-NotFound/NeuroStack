/**
 * RSS Feed Fetcher
 * Handles any RSS/Atom feed URL. Also auto-detects YouTube channel/handle URLs
 * and converts them to the proper YouTube RSS feed format.
 */
import Parser from 'rss-parser';
import https from 'https';
import http from 'http';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NeuroStack-Bot/1.0; +https://github.com/Ratul-NotFound/NuroStack)',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
  },
  customFields: {
    item: [
      ['media:group', 'mediaGroup'],
      ['media:description', 'mediaDescription'],
      ['media:thumbnail', 'thumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

/**
 * Checks if a URL is a YouTube page URL (not an RSS URL).
 * Returns the proper RSS feed URL if it is, null otherwise.
 */
export function resolveYouTubeUrl(url) {
  if (!url) return null;

  // Already a YouTube RSS feed — pass through
  if (url.includes('youtube.com/feeds/videos.xml')) return url;

  // youtube.com/channel/UCxxxxxx
  const channelMatch = url.match(/youtube\.com\/channel\/(UC[\w-]+)/i);
  if (channelMatch) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`;
  }

  // youtube.com/c/ChannelName or youtube.com/@handle
  // These don't map directly to RSS without the API, but we can try the feed endpoint
  const handleMatch = url.match(/youtube\.com\/(?:c\/|@)([\w.-]+)/i);
  if (handleMatch) {
    // YouTube RSS supports the "user" path for some channels
    return `https://www.youtube.com/feeds/videos.xml?user=${handleMatch[1]}`;
  }

  // youtube.com/user/username
  const userMatch = url.match(/youtube\.com\/user\/([\w.-]+)/i);
  if (userMatch) {
    return `https://www.youtube.com/feeds/videos.xml?user=${userMatch[1]}`;
  }

  // Bare channel ID (starts with UC)
  if (/^UC[\w-]{20,}$/.test(url.trim())) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${url.trim()}`;
  }

  return null; // Not a YouTube URL
}

/**
 * Checks if a URL points to Facebook (which has no public RSS).
 */
export function isFacebookUrl(url) {
  return url && /facebook\.com|fb\.com/i.test(url);
}

/**
 * Fetches and parses an RSS/Atom feed.
 * @param {string} url - Feed URL (auto-detects YouTube and converts)
 * @param {object|null} lastFetch - Firestore Timestamp of last successful fetch
 * @returns {Promise<Array>} Array of normalized feed items
 */
export async function fetchRSS(url, lastFetch) {
  // Reject Facebook URLs immediately — no public RSS
  if (isFacebookUrl(url)) {
    console.warn(`  ⚠️  Facebook pages don't support RSS feeds. Source URL: ${url}`);
    console.warn(`  💡 Tip: Use the page's Atom/RSS feed if they have one, or replace with an equivalent blog/newsletter.`);
    return [];
  }

  // Auto-convert YouTube page URLs to RSS feed URLs
  const youtubeRss = resolveYouTubeUrl(url);
  const feedUrl = youtubeRss || url;

  if (youtubeRss && youtubeRss !== url) {
    console.log(`  🔄 YouTube URL auto-converted: ${url} → ${feedUrl}`);
  }

  try {
    const feed = await parser.parseURL(feedUrl);
    const lastFetchDate = lastFetch ? lastFetch.toDate() : new Date(0);

    const items = feed.items
      .filter(item => {
        const pubDate = new Date(item.pubDate || item.isoDate || 0);
        return pubDate > lastFetchDate;
      })
      .map(item => {
        // Extract best available description — handles YouTube media:description
        const description =
          item.mediaGroup?.['media:description']?.[0] ||
          item.mediaDescription ||
          item.contentEncoded ||
          item.contentSnippet ||
          item.content ||
          item.summary ||
          '';

        // Extract thumbnail
        const thumbnail = 
          item.mediaGroup?.['media:thumbnail']?.[0]?.$.url || 
          item.thumbnail?.$.url || 
          item.enclosure?.url ||
          (Array.isArray(item.enclosures) ? item.enclosures[0]?.url : null) ||
          null;

        return {
          title: (item.title || 'Untitled').trim(),
          link: item.link || item.guid || '',
          description: typeof description === 'string' ? description : String(description),
          content: item.contentEncoded || item.content || description,
          thumbnail: thumbnail, // New field
          publishedAt: new Date(item.pubDate || item.isoDate || Date.now()),
          sourceUrl: feed.link || feedUrl,
          tags: Array.isArray(item.categories) ? item.categories : (item.categories ? [item.categories] : []),
        };
      })
      .filter(item => item.title && item.link); // Must have at least title and link

    return items;
  } catch (error) {
    console.error(`  ❌ Error fetching RSS from ${feedUrl}:`, error.message);
    return [];
  }
}
