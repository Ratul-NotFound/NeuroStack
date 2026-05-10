/**
 * usePostsWithCache — Smart Differential Sync Engine
 *
 * Firebase read strategy:
 *  - First visit:      fetch latest 500 posts (500 reads, one time ever)
 *  - Daily sync:       fetch ONLY posts published since lastSync (~10–50 reads)
 *  - Already cached:   0 Firebase reads — served entirely from IndexedDB
 *
 * UI strategy:
 *  - Exposes ALL cached posts for accurate count calculation
 *  - Paginates 50 at a time locally (0 Firebase reads per "Load More")
 */
import { useState, useEffect, useCallback } from 'react';
import { openDB } from 'idb';
import {
  collection, query, where, getDocs,
  orderBy, limit, Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const DB_NAME    = 'neurostack-v9';   // fresh cache for 1-read smart sync validation
const STORE_POSTS = 'posts';
const STORE_META  = 'meta';
const PAGE_SIZE  = 50;
const INITIAL_FETCH = 500;            // reads on first ever visit
const SYNC_INTERVAL = 1 * 60 * 60 * 1000; // 1 hour

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(idb) {
      idb.createObjectStore(STORE_POSTS, { keyPath: 'id' });
      idb.createObjectStore(STORE_META);
    },
  });
}

// Compute counts for all time filters from a list of posts
function computeCounts(posts) {
  const now  = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let all = 0, today = 0, week = 0, month = 0;
  for (const p of posts) {
    const d = p.publishedAt?.seconds
      ? new Date(p.publishedAt.seconds * 1000)
      : null;
    all++;
    if (d) {
      if (d >= todayStart)  today++;
      if (d >= weekStart)   week++;
      if (d >= monthStart)  month++;
    }
  }
  return { all, today, week, month };
}

export function usePostsWithCache(category = 'all') {
  // All posts from cache matching current category + time filter
  const [allFiltered, setAllFiltered] = useState([]);
  // What's actually shown on screen (paginated slice)
  const [visiblePosts, setVisiblePosts] = useState([]);
  const [page, setPage]       = useState(1);
  const [counts, setCounts]   = useState({ all: 0, today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError]     = useState(null);

  // ── Main sync effect ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function syncIntelligence() {
      setLoading(true);
      setPage(1);
      try {
        const idb = await getDB();

        let lastSync = await idb.get(STORE_META, 'lastSync') || 0; // stores max publishedAt in ms
        const cachedCount = await idb.count(STORE_POSTS);
        let needsSync = false;

        if (cachedCount === 0) {
          // ── First ever visit: fetch initial batch ───────────────────────
          setSyncing(true);
          console.log(`🚀 First load — fetching ${INITIAL_FETCH} posts from Firebase...`);
          const snap = await getDocs(
            query(collection(db, 'posts'), orderBy('publishedAt', 'desc'), limit(INITIAL_FETCH))
          );
          if (cancelled) return;
          const incoming = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log(`   ✅ Received ${incoming.length} posts`);

          const tx = idb.transaction([STORE_POSTS, STORE_META], 'readwrite');
          let maxMs = 0;
          for (const p of incoming) {
            tx.objectStore(STORE_POSTS).put(p);
            const pMs = p.publishedAt?.seconds ? p.publishedAt.seconds * 1000 : 0;
            if (pMs > maxMs) maxMs = pMs;
          }
          tx.objectStore(STORE_META).put(maxMs, 'lastSync');
          await tx.done;
          setSyncing(false);

        } else {
          // ── Smart Sync: 1-Read Validation ──────────────────────────────
          // Cost: 1 Read. Checks if the server has a post newer than our cache.
          const latestSnap = await getDocs(
            query(collection(db, 'posts'), orderBy('publishedAt', 'desc'), limit(1))
          );
          
          if (!latestSnap.empty) {
            const serverLatest = latestSnap.docs[0].data();
            const serverMs = serverLatest.publishedAt?.seconds ? serverLatest.publishedAt.seconds * 1000 : 0;
            
            if (serverMs > lastSync) {
              needsSync = true;
              console.log(`🔄 New news detected! (Server: ${new Date(serverMs).toLocaleTimeString()} > Local: ${new Date(lastSync).toLocaleTimeString()})`);
            }
          }

          if (needsSync) {
            setSyncing(true);
            const since = Timestamp.fromMillis(lastSync);
            console.log(`📥 Downloading missing posts...`);
            const snap = await getDocs(
              query(
                collection(db, 'posts'),
                where('publishedAt', '>', since),
                orderBy('publishedAt', 'desc'),
                limit(200)
              )
            );
            if (cancelled) return;
            const incoming = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log(`   ✅ ${incoming.length} new post(s) added to cache`);

            const tx = idb.transaction([STORE_POSTS, STORE_META], 'readwrite');
            let maxMs = lastSync;
            for (const p of incoming) {
              tx.objectStore(STORE_POSTS).put(p);
              const pMs = p.publishedAt?.seconds ? p.publishedAt.seconds * 1000 : 0;
              if (pMs > maxMs) maxMs = pMs;
            }
            tx.objectStore(STORE_META).put(maxMs, 'lastSync');
            await tx.done;
            setSyncing(false);
          } else {
            console.log(`⚡ Cache is perfectly up to date (${cachedCount} posts). Total Cost: 1 Firebase Read.`);
          }
        }

        // ── Serve from IndexedDB (0 Firebase cost) ──────────────────────
        const all = await idb.getAll(STORE_POSTS);
        if (cancelled) return;

        // Filter by category
        const catFiltered = category === 'all'
          ? all
          : all.filter(p => p.category === category);

        // Sort by newest first
        catFiltered.sort((a, b) =>
          (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0)
        );

        // Compute counts for this category across all time windows
        setCounts(computeCounts(catFiltered));
        setAllFiltered(catFiltered);
        setVisiblePosts(catFiltered.slice(0, PAGE_SIZE));

      } catch (err) {
        if (cancelled) return;
        console.error('Sync error:', err);
        setError(err.message);
        // Fallback: show whatever is in cache
        try {
          const idb = await getDB();
          const all = await idb.getAll(STORE_POSTS);
          const catFiltered = category === 'all'
            ? all
            : all.filter(p => p.category === category);
          catFiltered.sort((a, b) =>
            (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0)
          );
          setCounts(computeCounts(catFiltered));
          setAllFiltered(catFiltered);
          setVisiblePosts(catFiltered.slice(0, PAGE_SIZE));
        } catch { /* truly offline */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    syncIntelligence();
    return () => { cancelled = true; };
  }, [category]);

  // ── Update visible slice when page changes ───────────────────────────────
  useEffect(() => {
    setVisiblePosts(allFiltered.slice(0, page * PAGE_SIZE));
  }, [page, allFiltered]);

  // ── Load More (pure local, 0 Firebase reads) ─────────────────────────────
  const loadMore = useCallback(() => {
    setPage(p => p + 1);
  }, []);

  const hasMore = visiblePosts.length < allFiltered.length;

  // ── Dev: hard reset ───────────────────────────────────────────────────────
  const refreshCache = async () => {
    try {
      const idb = await getDB();
      const tx  = idb.transaction([STORE_POSTS, STORE_META], 'readwrite');
      tx.objectStore(STORE_POSTS).clear();
      tx.objectStore(STORE_META).clear();
      await tx.done;
    } catch { /* ignore */ }
    window.location.reload();
  };

  return {
    posts: visiblePosts,
    allCount: allFiltered.length,
    counts,       // { all, today, week, month } — exact counts per filter
    hasMore,
    loadMore,
    loading,
    syncing,
    error,
    refreshCache,
  };
}
