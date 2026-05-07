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
    async function fetchData() {
      setLoading(true);
      try {
        const idb = await openDB(DB_NAME, 1, {
          upgrade(db) {
            db.createObjectStore(STORE_POSTS, { keyPath: 'id' });
            db.createObjectStore(STORE_META);
          },
        });

        // 1. Get last fetch timestamp from IDB
        const lastFetch = await idb.get(STORE_META, 'lastFetch');
        const now = Date.now();

        let cachedPosts = await idb.getAll(STORE_POSTS);
        
        // Filter by category client-side if needed
        const filterPosts = (allPosts) => {
          if (category === 'all') return allPosts;
          return allPosts.filter(p => p.category === category);
        };

        // 2. Determine if we need to fetch from Firestore
        const isExpired = !lastFetch || (now - lastFetch > 24 * 60 * 60 * 1000);

        if (isExpired || cachedPosts.length === 0 || category !== 'all') {
          console.log(`Fetching fresh posts for category: ${category}`);
          const postsRef = collection(db, 'posts');
          
          let q;
          if (category === 'all') {
            q = query(postsRef, orderBy('publishedAt', 'desc'), limit(100));
          } else {
            // Remove orderBy here to avoid index requirement; sort in JS instead
            q = query(postsRef, where('category', '==', category), limit(200));
          }
          
          const snapshot = await getDocs(q);
          let newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Sort in JS to avoid composite index requirement
          if (category !== 'all') {
            newPosts = newPosts.sort((a, b) => 
              (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0)
            );
          }
          
          // Only update cache for 'all' to avoid messing up global cache with partial data
          if (category === 'all') {
            const tx = idb.transaction([STORE_POSTS, STORE_META], 'readwrite');
            await tx.objectStore(STORE_POSTS).clear();
            for (const post of newPosts) {
              await tx.objectStore(STORE_POSTS).put(post);
            }
            await tx.objectStore(STORE_META).put(now, 'lastFetch');
            await tx.done;
          }

          setPosts(newPosts);
        } else {
          // 3. Incrementally fetch new posts since lastFetch
          console.log('Incremental fetch for new posts...');
          const lastFetchTimestamp = Timestamp.fromMillis(lastFetch);
          const postsRef = collection(db, 'posts');
          const q = query(postsRef, where('fetchedAt', '>', lastFetchTimestamp), orderBy('fetchedAt', 'desc'));
          const snapshot = await getDocs(q);
          
          const incrementalPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          if (incrementalPosts.length > 0) {
            const tx = idb.transaction([STORE_POSTS, STORE_META], 'readwrite');
            for (const post of incrementalPosts) {
              await tx.objectStore(STORE_POSTS).put(post);
            }
            await tx.objectStore(STORE_META).put(now, 'lastFetch');
            await tx.done;
            
            // Merge with cache
            const allPosts = [...incrementalPosts, ...cachedPosts].sort((a, b) => 
              (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0)
            );
            // Keep only top 500 to prevent IDB bloat
            const limitedPosts = allPosts.slice(0, 500);
            setPosts(filterPosts(limitedPosts));
          } else {
            setPosts(filterPosts(cachedPosts.sort((a, b) => 
              (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0)
            )));
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [category]);

  const refreshCache = async () => {
    try {
      const idb = await openDB(DB_NAME, 1);
      const tx = idb.transaction([STORE_POSTS, STORE_META], 'readwrite');
      await tx.objectStore(STORE_POSTS).clear();
      await tx.objectStore(STORE_META).clear();
      await tx.done;
      window.location.reload();
    } catch (err) {
      console.error('Cache clear error:', err);
      window.location.reload();
    }
  };

  return { posts, loading, error, refreshCache };
}
