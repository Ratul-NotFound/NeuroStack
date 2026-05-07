/**
 * YouTube Channel RSS Fetcher
 * Uses YouTube's FREE public RSS feed — no API key required, no quota cost.
 * 
 * Supported URL formats:
 *   - https://www.youtube.com/channel/UCxxxxxx       → direct channel ID
 *   - https://www.youtube.com/@handle                → handle (maps to /user/)
 *   - https://www.youtube.com/c/ChannelName          → legacy custom URL
 *   - https://www.youtube.com/user/username          → legacy username
 *   - UCxxxxxx (bare channel ID)                     → direct
 *   - https://www.youtube.com/feeds/videos.xml?...   → already RSS, pass through
 */
import { fetchRSS, resolveYouTubeUrl } from './rssFetcher.js';

/**
 * Fetches new videos from a YouTube channel using the public RSS feed.
 * @param {string} url - Any YouTube URL format or channel ID
 * @param {object|null} lastFetch - Firestore Timestamp of last successful fetch
 * @returns {Promise<Array>} Array of normalized video items
 */
export async function fetchYouTube(url, lastFetch) {
  const rssUrl = resolveYouTubeUrl(url);

  if (!rssUrl) {
    console.warn(`  ⚠️  Could not resolve YouTube RSS URL from: "${url}"`);
    console.warn('  💡 Tip: Use the YouTube channel RSS URL format:');
    console.warn('     https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxxxx');
    console.warn('     Find channel_id by visiting the channel → View Source → search "channel_id"');
    return [];
  }

  console.log(`  📺 YouTube RSS: ${rssUrl}`);
  
  // Delegate to the shared RSS fetcher
  return fetchRSS(rssUrl, lastFetch);
}
