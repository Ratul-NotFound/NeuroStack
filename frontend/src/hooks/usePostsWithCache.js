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
        // If last fetch was > 24h ago or cache is empty
        const isExpired = !lastFetch || (now - lastFetch > 24 * 60 * 60 * 1000);

        if (isExpired || cachedPosts.length === 0) {
          console.log('Cache expired or empty, fetching fresh posts...');
          const postsRef = collection(db, 'posts');
          const q = query(postsRef, orderBy('publishedAt', 'desc'), limit(100));
          const snapshot = await getDocs(q);
          
          const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Update IDB
          const tx = idb.transaction([STORE_POSTS, STORE_META], 'readwrite');
          await tx.objectStore(STORE_POSTS).clear();
          for (const post of newPosts) {
            await tx.objectStore(STORE_POSTS).put(post);
          }
          await tx.objectStore(STORE_META).put(now, 'lastFetch');
          await tx.done;

          setPosts(filterPosts(newPosts));
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
    const idb = await openDB(DB_NAME, 1);
    await idb.clear(STORE_POSTS);
    await idb.clear(STORE_META);
    window.location.reload();
  };

  return { posts, loading, error, refreshCache };
}
