import { useState, useEffect } from 'react';
import { openDB } from 'idb';
import { collection, query, where, getDocs, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const DB_NAME    = 'knowledge-hub-cache';
const DB_VERSION = 2; // bump version to auto-clear corrupted cache
const STORE_POSTS = 'posts';
const STORE_META  = 'meta';

const CACHE_TTL_MS   = 24 * 60 * 60 * 1000; // 24 hours before full re-sync
const BATCH_SIZE     = 500; // fetch 500 posts per Firebase round-trip
const MAX_CACHE_POSTS = 1000; // keep up to 1000 in IndexedDB

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Clean slate on version bump — ensures corrupted cache is cleared
      if (oldVersion < 2) {
        if (db.objectStoreNames.contains(STORE_POSTS)) db.deleteObjectStore(STORE_POSTS);
        if (db.objectStoreNames.contains(STORE_META))  db.deleteObjectStore(STORE_META);
      }
      db.createObjectStore(STORE_POSTS, { keyPath: 'id' });
      db.createObjectStore(STORE_META);
    },
  });
}

export function usePostsWithCache(category = 'all') {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    async function syncIntelligence() {
      setLoading(true);
      try {
        const idb = await getDB();

        // ── 1. Check cache freshness ────────────────────────────────────────
        const lastSync    = await idb.get(STORE_META, 'lastSync');    // ms timestamp
        const cachedCount = (await idb.count(STORE_POSTS)) || 0;
        const now         = Date.now();
        const isStale     = !lastSync || (now - lastSync) > CACHE_TTL_MS;
        const isEmpty     = cachedCount === 0;

        // ── 2. Decide what to fetch from Firebase ───────────────────────────
        if (isEmpty) {
          // ── First visit: fetch the latest BATCH_SIZE posts ────────────────
          console.log('📥 First load — fetching initial batch from Firebase...');
          const snap = await getDocs(
            query(
              collection(db, 'posts'),
              orderBy('publishedAt', 'desc'),
              limit(BATCH_SIZE)
            )
          );
          const incoming = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log(`   ✅ Got ${incoming.length} posts`);

          const tx = idb.transaction([STORE_POSTS, STORE_META], 'readwrite');
          for (const p of incoming) tx.objectStore(STORE_POSTS).put(p);
          tx.objectStore(STORE_META).put(now, 'lastSync');
          await tx.done;

        } else if (isStale) {
          // ── Returning user after 24h: fetch only new posts since lastSync ──
          const since = Timestamp.fromMillis(lastSync);
          console.log(`🔄 Incremental sync since ${since.toDate().toLocaleString()}...`);
          const snap = await getDocs(
            query(
              collection(db, 'posts'),
              where('publishedAt', '>', since),
              orderBy('publishedAt', 'desc'),
              limit(200) // new posts since last visit are usually <50
            )
          );
          const incoming = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log(`   ✅ ${incoming.length} new post(s) since last visit`);

          if (incoming.length > 0) {
            const tx = idb.transaction([STORE_POSTS, STORE_META], 'readwrite');
            for (const p of incoming) tx.objectStore(STORE_POSTS).put(p);
            tx.objectStore(STORE_META).put(now, 'lastSync');
            await tx.done;
          }
        } else {
          console.log(`⚡ Cache is fresh (${cachedCount} posts). Zero Firebase reads.`);
        }

        // ── 3. Serve from local cache (ZERO Firebase cost) ─────────────────
        const allCached = await idb.getAll(STORE_POSTS);
        const filtered  = allCached
          .filter(p => category === 'all' || p.category === category)
          .sort((a, b) => (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0))
          .slice(0, MAX_CACHE_POSTS);

        setPosts(filtered);

      } catch (err) {
        console.error('Smart Sync Failed:', err);
        setError(err.message);
        try {
          const idb = await getDB();
          const cached = await idb.getAll(STORE_POSTS);
          setPosts(cached.filter(p => category === 'all' || p.category === category));
        } catch { /* nothing we can do */ }
      } finally {
        setLoading(false);
      }
    }

    syncIntelligence();
  }, [category]);

  // Dev-only: hard reset — clears IndexedDB and re-fetches
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

  return { posts, loading, error, refreshCache };
}
