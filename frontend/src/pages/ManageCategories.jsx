import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Trash2, Hash, PlusCircle, AlertCircle, Loader2, Settings } from 'lucide-react';

export function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState({ name: '' });
  const [editingCat, setEditingCat] = useState(null);

  async function fetchCategories() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'categories'));
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCat.name) return;

    setLoading(true);
    try {
      if (editingCat) {
        await updateDoc(doc(db, 'categories', editingCat), {
          ...newCat,
          updatedAt: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'categories'), {
          ...newCat,
          createdAt: Timestamp.now()
        });
      }
      setNewCat({ name: '' });
      setEditingCat(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Warning: Deleting a category will leave posts in that category orphaned. Proceed?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'categories', id));
      fetchCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Intelligence Sectors</h2>
          <p className="text-muted-foreground text-lg">Define how your knowledge is organized.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border/50 rounded-2xl p-8 sticky top-24 shadow-sm">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <PlusCircle size={18} className="text-primary" />
              {editingCat ? 'Edit Category' : 'New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Sector Name</label>
                <input
                  required
                  className="w-full bg-secondary/30 border border-border/50 rounded-xl py-3 px-4 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                  placeholder="e.g. Neuroscience"
                  value={newCat.name}
                  onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : editingCat ? 'Update Sector' : 'Create Sector'}
                </button>
                
                {editingCat && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(null);
                      setNewCat({ name: '' });
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
          {loading && categories.length === 0 ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-20 bg-secondary/30 rounded-2xl animate-pulse" />)
          ) : categories.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground bg-secondary/10">
              <Hash size={40} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">No sectors defined yet.</p>
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="group bg-card border border-border/50 rounded-2xl p-5 flex items-center justify-between hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary/50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                    <Hash size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{cat.name}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Active Sector</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setNewCat({ name: cat.name });
                      setEditingCat(cat.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                    title="Edit Sector"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                    title="Delete Sector"
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
