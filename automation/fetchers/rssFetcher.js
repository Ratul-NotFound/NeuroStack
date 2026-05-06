import Parser from 'rss-parser';

const parser = new Parser();

export async function fetchRSS(url, lastFetch) {
  try {
    const feed = await parser.parseURL(url);
    const lastFetchDate = lastFetch ? lastFetch.toDate() : new Date(0);
    
    return feed.items
      .filter(item => {
        const pubDate = new Date(item.pubDate || item.isoDate);
        return pubDate > lastFetchDate;
      })
      .map(item => ({
        title: item.title,
        link: item.link,
        description: item.contentSnippet || item.content || item.summary,
        content: item.content,
        publishedAt: new Date(item.pubDate || item.isoDate),
        sourceUrl: feed.link
      }));
  } catch (error) {
    console.error(`Error fetching RSS from ${url}:`, error);
    return [];
  }
}
