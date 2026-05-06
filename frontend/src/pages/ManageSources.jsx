import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Trash2, Globe, Play, PlusCircle, AlertCircle, Loader2, Settings } from 'lucide-react';

export function ManageSources() {
  const [sources, setSources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', type: 'rss', category: '' });
  const [editingSource, setEditingSource] = useState(null);

  async function fetchSources() {
    const sourceSnap = await getDocs(collection(db, 'sources'));
    setSources(sourceSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const catSnap = await getDocs(collection(db, 'categories'));
    const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCategories(cats);
    if (cats.length > 0 && !newSource.category) setNewSource(prev => ({ ...prev, category: cats[0].id }));
    setLoading(false);
  }

  useEffect(() => {
    fetchSources();
  }, []);

  const handleSubmitSource = async (e) => {
    e.preventDefault();
    if (!newSource.name || !newSource.url) return;

    setLoading(true);
    try {
      if (editingSource) {
        await updateDoc(doc(db, 'sources', editingSource), {
          ...newSource,
          updatedAt: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'sources'), {
          ...newSource,
          active: true,
          createdAt: Timestamp.now(),
          lastFetched: null
        });
      }
      setNewSource({ name: '', url: '', type: 'rss', category: categories[0]?.id || '' });
      setEditingSource(null);
      fetchSources();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (id) => {
    if (!confirm('Are you sure you want to delete this source?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'sources', id));
      fetchSources();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Content Sources</h2>
          <p className="text-muted-foreground">Manage the RSS feeds monitored by the automation script.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-xl p-6 sticky top-24">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <PlusCircle size={18} />
              Add New Source
            </h3>
            <form onSubmit={handleSubmitSource} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Display Name</label>
                <input
                  required
                  className="w-full bg-secondary/30 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Fireship"
                  value={newSource.name}
                  onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">RSS / Feed URL</label>
                <input
                  required
                  className="w-full bg-secondary/30 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://.../rss"
                  value={newSource.url}
                  onChange={e => setNewSource({ ...newSource, url: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Primary Category</label>
                <select
                  className="w-full bg-secondary/30 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  value={newSource.category}
                  onChange={e => setNewSource({ ...newSource, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : editingSource ? 'Update Source' : 'Add Source'}
              </button>
              
              {editingSource && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSource(null);
                    setNewSource({ name: '', url: '', type: 'rss', category: categories[0]?.id || '' });
                  }}
                  className="px-6 bg-secondary text-secondary-foreground py-3 rounded-xl font-bold hover:bg-secondary/80 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-secondary/30 rounded-xl animate-pulse" />)
          ) : sources.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
              No sources found. Add your first feed to start collecting knowledge.
            </div>
          ) : (
            sources.map(source => (
              <div key={source.id} className="bg-card border rounded-xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground">
                    {source.type === 'youtube_api' ? <Play size={20} /> : <Globe size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold">{source.name}</h4>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{source.url}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-medium uppercase">{source.category}</span>
                      {source.lastFetch && (
                        <span className="text-[10px] text-muted-foreground">Last check: {new Date(source.lastFetch.seconds * 1000).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setNewSource({
                          name: source.name,
                          url: source.url,
                          type: source.type,
                          category: source.category
                        });
                        setEditingSource(source.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="Edit Source"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                      title="Delete Source"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
