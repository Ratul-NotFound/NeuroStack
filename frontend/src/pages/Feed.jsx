import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePostsWithCache } from '../hooks/usePostsWithCache';
import { PostCard } from '../components/PostCard';
import { Search, RefreshCcw, AlertCircle, BookOpen } from 'lucide-react';

export function Feed() {
  const { categoryId } = useParams();
  const { posts, loading, error, refreshCache } = usePostsWithCache(categoryId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' or 'oldest'
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'today', 'week'

  // 1. Filter by Search & Time
  const filteredPosts = posts.filter(post => {
    // Search filter
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Time filter
    if (timeFilter === 'all') return true;
    
    const postDate = post.publishedAt?.seconds 
      ? new Date(post.publishedAt.seconds * 1000) 
      : new Date();
    const now = new Date();
    
    if (timeFilter === 'today') {
      return postDate.toDateString() === now.toDateString();
    }
    
    if (timeFilter === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return postDate >= oneWeekAgo;
    }

    return true;
  });

  // 2. Apply Sorting
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const timeA = a.publishedAt?.seconds || 0;
    const timeB = b.publishedAt?.seconds || 0;
    return sortOrder === 'latest' ? timeB - timeA : timeA - timeB;
  });

  const pageTitle = categoryId
    ? categoryId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'All Content';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/70 backdrop-blur-xl border-b border-border/50 px-6 py-5 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{pageTitle}</h2>
              <p className="text-muted-foreground text-sm font-medium mt-0.5">
                {loading ? 'Synchronizing Intelligence...' : `${sortedPosts.length} insight${sortedPosts.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-52 sm:w-72 bg-card border border-border/50 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Refresh — dev only */}
              {import.meta.env.DEV && (
                <button
                  onClick={refreshCache}
                  title="Clear cache"
                  className="p-2.5 bg-card border border-border/50 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-primary"
                >
                  <RefreshCcw size={18} className={loading ? 'animate-spin text-primary' : ''} />
                </button>
              )}
            </div>
          </div>

          {/* New Temporal Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/30">
            <div className="flex items-center p-1 bg-secondary/50 rounded-xl border border-border/50 backdrop-blur-sm">
              <button 
                onClick={() => setTimeFilter('all')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeFilter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                All Time
              </button>
              <button 
                onClick={() => setTimeFilter('week')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeFilter === 'week' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                This Week
              </button>
              <button 
                onClick={() => setTimeFilter('today')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeFilter === 'today' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Today
              </button>
            </div>

            <button 
              onClick={() => setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest')}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border/50 rounded-xl text-xs font-bold hover:bg-secondary transition-all"
            >
              <RefreshCcw size={14} className={sortOrder === 'latest' ? '' : 'rotate-180'} />
              {sortOrder === 'latest' ? 'Showing Latest' : 'Showing Oldest'}
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p><strong>Connection error:</strong> {error}. Showing cached data if available.</p>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {loading && posts.length === 0 ? (
            /* Skeleton loaders */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 bg-secondary/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="text-center py-24 bg-card/30 border-2 border-dashed border-border/50 rounded-3xl">
              <BookOpen size={48} className="mx-auto mb-4 opacity-10" />
              <h3 className="text-xl font-bold mb-2">
                {searchQuery ? 'No results found' : 'No content yet'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {searchQuery
                  ? 'Try a different search term or browse all categories.'
                  : 'Add RSS sources in the Admin panel, then trigger the GitHub Action to fetch and summarize content.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
