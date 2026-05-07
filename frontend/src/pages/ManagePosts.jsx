import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import { Trash2, Edit2, ExternalLink, Search, X, CheckCircle, Loader2, ChevronDown } from 'lucide-react';

export function ManagePosts() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [postsSnap, catsSnap] = await Promise.all([
        getDocs(query(collection(db, 'posts'), orderBy('publishedAt', 'desc'))),
        getDocs(collection(db, 'categories')),
      ]);
      setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCategories(catsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = posts.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sourceName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEdit = (post) => {
    setEditingPost(post.id);
    setEditForm({
      title: post.title,
      summary: post.summary,
      category: post.category,
      link: post.link || '',
      isCustom: post.isCustom || false,
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'posts', editingPost), {
        ...editForm,
        updatedAt: Timestamp.now(),
      });
      setPosts(posts.map(p => p.id === editingPost ? { ...p, ...editForm } : p));
      setEditingPost(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(posts.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Posts</h1>
          <p className="text-muted-foreground mt-1">{posts.length} total posts</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search posts..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Inline Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card/90 backdrop-blur-sm border-b border-border/50 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-lg">Edit Post</h2>
              <button onClick={() => setEditingPost(null)} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest block mb-1.5">Title</label>
                <input
                  className="w-full bg-secondary/30 border border-border/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest block mb-1.5">Category</label>
                  <select
                    className="w-full bg-secondary/30 border border-border/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest block mb-1.5">Link</label>
                  <input
                    className="w-full bg-secondary/30 border border-border/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={editForm.link}
                    onChange={e => setEditForm({ ...editForm, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest block mb-1.5">Summary (Markdown)</label>
                <textarea
                  rows={8}
                  className="w-full bg-secondary/30 border border-border/50 rounded-xl p-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                  value={editForm.summary}
                  onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isCustom}
                    onChange={e => setEditForm({ ...editForm, isCustom: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-semibold">Mark as Custom Post</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingPost(null)}
                  className="flex-1 border border-border/50 rounded-xl py-3 font-semibold hover:bg-secondary transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-[2] bg-primary text-primary-foreground rounded-xl py-3 font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-secondary/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground">
          {searchQuery ? 'No posts match your search.' : 'No posts yet. Run the automation to start collecting.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <div key={post.id} className="group bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/30 transition-all">
              <div className="flex items-start gap-4">
                <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider flex-shrink-0 mt-0.5">
                  {post.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{post.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{post.sourceName}</span>
                    {post.isCustom && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md font-bold uppercase border border-amber-500/20">
                        Custom
                      </span>
                    )}
                    {post.publishedAt?.seconds && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.publishedAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {post.link && (
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="Open original"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => startEdit(post)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                    title="Edit post"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                    title="Delete post"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
