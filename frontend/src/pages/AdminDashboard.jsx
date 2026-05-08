import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NavLink } from 'react-router-dom';
import { FileText, Database, Layers, RefreshCcw, TrendingUp, Clock, PlusCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export function AdminDashboard() {
  const [stats, setStats] = useState({ posts: 0, sources: 0, categories: 0, lastFetch: null });
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [postsSnap, sourcesSnap, categoriesSnap, recentSnap] = await Promise.all([
          getDocs(collection(db, 'posts')),
          getDocs(collection(db, 'sources')),
          getDocs(collection(db, 'categories')),
          getDocs(query(collection(db, 'posts'), orderBy('fetchedAt', 'desc'), limit(5))),
        ]);

        // Find the most recent lastFetch among sources
        let lastFetch = null;
        sourcesSnap.docs.forEach(doc => {
          const lf = doc.data().lastFetch;
          if (lf && (!lastFetch || lf.seconds > lastFetch.seconds)) lastFetch = lf;
        });

        setStats({
          posts: postsSnap.size,
          sources: sourcesSnap.size,
          categories: categoriesSnap.size,
          lastFetch,
        });

        setRecentPosts(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // 'success', 'error'

  const handleManualSync = async () => {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    const repo = import.meta.env.VITE_GITHUB_REPO; // Format: "username/repo"

    if (!token || !repo) {
      alert("⚠️ GitHub API not configured. Please add VITE_GITHUB_TOKEN and VITE_GITHUB_REPO to your .env file.");
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/daily-fetch.yml/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      });

      if (response.ok) {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus(null), 5000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to trigger');
      }
    } catch (err) {
      console.error('Sync trigger error:', err);
      setSyncStatus('error');
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const statCards = [
    { label: 'Total Posts', value: stats.posts, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', link: '/admin/posts' },
    { label: 'Active Sources', value: stats.sources, icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-500/10', link: '/admin/sources' },
    { label: 'Categories', value: stats.categories, icon: Layers, color: 'text-violet-500', bg: 'bg-violet-500/10', link: '/admin/categories' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and quick actions.</p>
        </div>
        
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
            syncStatus === 'success' ? 'bg-emerald-500 text-white' :
            syncStatus === 'error' ? 'bg-red-500 text-white' :
            'bg-card border border-border/50 hover:border-primary text-foreground hover:text-primary'
          } ${isSyncing ? 'opacity-50 cursor-wait' : ''}`}
        >
          <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : syncStatus === 'success' ? 'Sync Triggered!' : 'Trigger Manual Sync'}
        </button>
      </div>

      {/* Last Fetch Status */}
      <div className="flex items-center gap-3 bg-card border border-border/50 rounded-2xl p-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <RefreshCcw size={18} className="text-emerald-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Last Automation Run</p>
          <p className="font-semibold text-sm">
            {loading ? 'Loading...' : stats.lastFetch
              ? format(new Date(stats.lastFetch.seconds * 1000), "MMMM d, yyyy — HH:mm 'UTC'")
              : 'No fetch recorded yet — trigger the GitHub Action to start'
            }
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, link }) => (
          <NavLink
            key={label}
            to={link}
            className="group bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={22} className={color} />
              </div>
              <TrendingUp size={16} className="text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
            </div>
            <p className="text-3xl font-bold tracking-tight">
              {loading ? <span className="inline-block w-10 h-7 bg-secondary/50 rounded animate-pulse" /> : value}
            </p>
            <p className="text-sm text-muted-foreground font-medium mt-1">{label}</p>
          </NavLink>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NavLink
          to="/admin/new-post"
          className="flex items-center gap-4 bg-primary text-primary-foreground rounded-2xl p-5 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <PlusCircle size={22} />
          <div>
            <p className="font-bold">Create Custom Post</p>
            <p className="text-xs opacity-70">Manually add a knowledge entry</p>
          </div>
        </NavLink>
        <NavLink
          to="/admin/sources"
          className="flex items-center gap-4 bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all"
        >
          <Database size={22} className="text-primary" />
          <div>
            <p className="font-bold">Manage Sources</p>
            <p className="text-xs text-muted-foreground">Add or remove RSS feeds</p>
          </div>
        </NavLink>
      </div>

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            Recently Fetched
          </h2>
          <NavLink to="/admin/posts" className="text-xs text-primary font-bold hover:underline">
            View all →
          </NavLink>
        </div>
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-14 bg-secondary/30 rounded-xl animate-pulse" />)
          ) : recentPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
              No posts yet. Run the automation or create a custom post.
            </div>
          ) : (
            recentPosts.map(post => (
              <div key={post.id} className="flex items-center gap-4 bg-card border border-border/50 rounded-xl p-4 hover:border-primary/40 transition-all">
                <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider flex-shrink-0">
                  {post.category}
                </span>
                <p className="text-sm font-semibold flex-1 truncate">{post.title}</p>
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  title="Open original"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
