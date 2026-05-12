import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { PenTool, CheckCircle, Loader2 } from 'lucide-react';

export function NewPost() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState({
    title: '',
    summary: '',
    link: '',
    thumbnail: '', // New field
    sourceName: 'Admin',
    category: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCats() {
      const snap = await getDocs(collection(db, 'categories'));
      const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(cats);
      if (cats.length > 0) setPost(prev => ({ ...prev, category: cats[0].id }));
    }
    fetchCats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        ...post,
        publishedAt: Timestamp.now(),
        fetchedAt: Timestamp.now(),
        isCustom: true
      });
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Create Custom Post</h2>
        <p className="text-muted-foreground">Manually add an entry to the knowledge repository.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-2xl p-8 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Title</label>
          <input
            required
            className="w-full bg-secondary/30 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Key insights from..."
            value={post.title}
            onChange={e => setPost({ ...post, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Category</label>
            <select
              className="w-full bg-secondary/30 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary"
              value={post.category}
              onChange={e => setPost({ ...post, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Reference Link (Optional)</label>
            <input
              className="w-full bg-secondary/30 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://..."
              value={post.link}
              onChange={e => setPost({ ...post, link: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Thumbnail URL (Optional)</label>
            <input
              className="w-full bg-secondary/30 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://.../image.jpg"
              value={post.thumbnail}
              onChange={e => setPost({ ...post, thumbnail: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center justify-between">
            Summary (Markdown)
            <span className="text-[10px] text-muted-foreground uppercase">Supports rich text</span>
          </label>
          <textarea
            required
            rows={10}
            className="w-full bg-secondary/30 border rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            placeholder="### Overview\n\n- Key point 1\n- Key point 2"
            value={post.summary}
            onChange={e => setPost({ ...post, summary: e.target.value })}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-3 border rounded-xl font-semibold hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            className="flex-[2] bg-primary text-primary-foreground px-4 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
            Publish Entry
          </button>
        </div>
      </form>
    </div>
  );
}
