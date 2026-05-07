import { useState, useEffect } from 'react';
import { openDB } from 'idb';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const DB_NAME = 'knowledge-hub-cache';
const STORE_POSTS = 'posts';
const STORE_META = 'meta';

export function usePostsWithCache(category = 'all') {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function syncIntelligence() {
      setLoading(true);
      try {
        const idb = await openDB(DB_NAME, 1, {
          upgrade(db) {
            db.createObjectStore(STORE_POSTS, { keyPath: 'id' });
            db.createObjectStore(STORE_META);
          },
        });

        // 1. Check last sync time
        const lastSync = await idb.get(STORE_META, 'lastSync');
        const now = Date.now();
        const lastSyncTimestamp = lastSync ? Timestamp.fromMillis(lastSync) : Timestamp.fromMillis(0);
        
        // 2. Fetch ONLY what we don't have
        console.log(`Syncing intelligence since: ${lastSyncTimestamp.toDate().toLocaleString()}`);
        const postsRef = collection(db, 'posts');
        
        // We always fetch the latest since lastSync
        // No 'where' category here = 0 extra indexes needed and 100% reuse of data
        const q = query(
          postsRef, 
          where('publishedAt', '>', lastSyncTimestamp),
          orderBy('publishedAt', 'desc'),
          limit(200) // Safety limit for first-time or long-time sync
        );

        const snapshot = await getDocs(q);
        const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (newPosts.length > 0) {
          console.log(`📥 Downloaded ${newPosts.length} new insights.`);
          const tx = idb.transaction([STORE_POSTS, STORE_META], 'readwrite');
          for (const post of newPosts) {
            await tx.objectStore(STORE_POSTS).put(post);
          }
          await tx.objectStore(STORE_META).put(now, 'lastSync');
          await tx.done;
        }

        // 3. Load from local cache (0 Firebase Cost)
        const allCached = await idb.getAll(STORE_POSTS);
        
        // Filter and Sort locally
        const filtered = allCached
          .filter(p => category === 'all' || p.category === category)
          .sort((a, b) => (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0))
          .slice(0, 500); // Keep UI fast

        setPosts(filtered);
      } catch (err) {
        console.error('Smart Sync Failed:', err);
        setError(err.message);
        // Fallback to offline cache
        const idb = await openDB(DB_NAME, 1);
        const cached = await idb.getAll(STORE_POSTS);
        setPosts(cached.filter(p => category === 'all' || p.category === category));
      } finally {
        setLoading(false);
      }
    }

    syncIntelligence();
  }, [category]);

  const refreshCache = async () => {
    try {
      const idb = await openDB(DB_NAME, 1);
      const tx = idb.transaction([STORE_POSTS, STORE_META], 'readwrite');
      await tx.objectStore(STORE_POSTS).clear();
      await tx.objectStore(STORE_META).clear(); // Clears 'lastSync'
      await tx.done;
      window.location.reload();
    } catch (err) {
      console.error('Cache clear error:', err);
      window.location.reload();
    }
  };

  return { posts, loading, error, refreshCache };
}
