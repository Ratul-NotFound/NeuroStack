import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePostsWithCache } from '../hooks/usePostsWithCache';
import { PostCard } from '../components/PostCard';
import { Search, RefreshCcw, AlertCircle, BookOpen, ChevronDown, Loader2, Zap } from 'lucide-react';

export function Feed() {
  const { categoryId } = useParams();
  const {
    posts, counts, hasMore, loadMore,
    loading, syncing, error, refreshCache
  } = usePostsWithCache(categoryId || 'all');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder,   setSortOrder]   = useState('latest');
  const [timeFilter,  setTimeFilter]  = useState('all');

  const pageTitle = categoryId
    ? categoryId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'All Content';

  // Apply search + time filter + sort to the already-paginated slice from the hook
  const displayedPosts = useMemo(() => {
    const now  = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let result = posts.filter(post => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = post.title?.toLowerCase().includes(q) ||
                        post.summary?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (timeFilter !== 'all') {
        const d = post.publishedAt?.seconds
          ? new Date(post.publishedAt.seconds * 1000) : null;
        if (!d) return false;
        if (timeFilter === 'today' && d < todayStart) return false;
        if (timeFilter === 'week'  && d < weekStart)  return false;
      }
      return true;
    });

    result.sort((a, b) => {
      const ta = a.publishedAt?.seconds || 0;
      const tb = b.publishedAt?.seconds || 0;
      return sortOrder === 'latest' ? tb - ta : ta - tb;
    });

    return result;
  }, [posts, searchQuery, timeFilter, sortOrder]);

  // Exact count for the current time filter (from cache, not Firebase)
  const activeCount = timeFilter === 'today' ? counts.today
    : timeFilter === 'week'  ? counts.week
    : timeFilter === 'month' ? counts.month
    : counts.all;

  const filterBtnClass = (active) =>
    `px-3 py-1 text-[10px] font-bold rounded-md whitespace-nowrap transition-all ${
      active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 sm:px-6 sm:py-5 flex-shrink-0">
        {/* Subtle Decorative Glows */}
        <div className="absolute top-0 left-1/4 w-1/2 h-full bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[60px] pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:gap-5 relative z-10">

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight">{pageTitle}</h2>
                {syncing && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Loader2 size={10} className="animate-spin" /> Syncing
                  </span>
                )}
              </div>
              {/* Exact count badge */}
              {!loading && (
                <p className="text-muted-foreground text-[10px] sm:text-sm font-medium mt-0.5">
                  <span className="font-bold text-foreground">{activeCount.toLocaleString()}</span>
                  {' '}insight{activeCount !== 1 ? 's' : ''}
                  {timeFilter !== 'all' && (
                    <span className="text-muted-foreground/60">
                      {timeFilter === 'today' ? ' today' : timeFilter === 'week' ? ' this week' : ' this month'}
                    </span>
                  )}
                  <span className="text-muted-foreground/40 ml-1">
                    · {counts.all.toLocaleString()} total cached
                  </span>
                </p>
              )}
              {loading && (
                <p className="text-muted-foreground text-[10px] sm:text-sm font-medium">
                  Loading intelligence...
                </p>
              )}
            </div>

            {/* Search + refresh */}
            <div className="flex items-center gap-2">
              <div className="relative group flex-1 sm:flex-none">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full sm:w-64 bg-card border border-border/50 rounded-xl py-2 sm:py-2.5 pl-9 pr-4 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={refreshCache} 
                title="Force refresh content and clear local cache"
                className="p-2 sm:p-2.5 bg-card border border-border/50 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-primary active:scale-95"
              >
                <RefreshCcw size={16} className={loading || syncing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Filter + Sort row */}
          <div className="flex items-center justify-between gap-2 border-t border-border/20 pt-2 sm:pt-3">
            {/* Time filter pills with counts */}
            <div className="flex items-center p-0.5 bg-secondary/30 rounded-lg border border-border/30">
              <button onClick={() => setTimeFilter('all')} className={filterBtnClass(timeFilter === 'all')}>
                All
                {!loading && <span className="ml-1 opacity-60">({counts.all.toLocaleString()})</span>}
              </button>
              <button onClick={() => setTimeFilter('week')} className={filterBtnClass(timeFilter === 'week')}>
                Week
                {!loading && <span className="ml-1 opacity-60">({counts.week.toLocaleString()})</span>}
              </button>
              <button onClick={() => setTimeFilter('today')} className={filterBtnClass(timeFilter === 'today')}>
                Today
                {!loading && <span className="ml-1 opacity-60">({counts.today.toLocaleString()})</span>}
              </button>
            </div>

            {/* Sort toggle */}
            <button
              onClick={() => setSortOrder(p => p === 'latest' ? 'oldest' : 'latest')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border/50 rounded-lg text-[10px] font-bold hover:bg-secondary transition-all"
            >
              <RefreshCcw size={12} className={sortOrder === 'latest' ? '' : 'rotate-180'} />
              {sortOrder === 'latest' ? 'Latest' : 'Oldest'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Error Banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-xs sm:text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p><strong>Sync error:</strong> {error}. Showing cached data.</p>
        </div>
      )}

      {/* ── Content Feed ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Skeleton */}
          {loading && posts.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 bg-secondary/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && displayedPosts.length === 0 && (
            <div className="text-center py-24 bg-card/30 border-2 border-dashed border-border/50 rounded-3xl">
              <BookOpen size={48} className="mx-auto mb-4 opacity-10" />
              <h3 className="text-xl font-bold mb-2">
                {searchQuery ? 'No results found' : 'No content yet'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {searchQuery
                  ? 'Try a different search term or change the time filter.'
                  : 'The automation engine fetches new content daily at 12:00 PM.'}
              </p>
            </div>
          )}

          {/* Post grid */}
          {displayedPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Load More — reads 0 Firebase, purely local */}
          {hasMore && !searchQuery && timeFilter === 'all' && (
            <div className="flex flex-col items-center gap-3 pt-4 pb-8">
              <button
                onClick={loadMore}
                className="flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group"
              >
                <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
                Load More
              </button>
              <p className="text-[10px] text-muted-foreground/50">
                Showing {posts.length.toLocaleString()} of {counts.all.toLocaleString()} · loaded from local cache
              </p>
            </div>
          )}

          {/* All loaded indicator */}
          {!hasMore && displayedPosts.length > 0 && !searchQuery && timeFilter === 'all' && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground/40">
              <Zap size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                All {counts.all.toLocaleString()} insights loaded
              </span>
              <Zap size={14} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
