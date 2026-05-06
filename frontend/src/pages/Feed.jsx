import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePostsWithCache } from '../hooks/usePostsWithCache';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { Search, SlidersHorizontal, RefreshCcw, User, ExternalLink, X } from 'lucide-react';

export function Feed() {
  const { categoryId } = useParams();
  const { posts, loading, error, refreshCache } = usePostsWithCache(categoryId || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedPost, setSelectedPost] = useState(null);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full overflow-hidden bg-background/50">
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${selectedPost ? 'mr-[500px]' : ''}`}>
        <header className="sticky top-0 z-10 bg-background/60 backdrop-blur-xl border-b border-border/50 px-8 py-8">
          <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">
                {categoryId ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1) : 'Library'}
              </h2>
              <p className="text-muted-foreground font-medium text-lg">
                {loading ? 'Synchronizing repository...' : `${filteredPosts.length} insights discovered`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group w-full md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search intelligence..."
                  className="w-full bg-card/50 border-border/50 border rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={refreshCache}
                className="p-3.5 bg-card border border-border/50 hover:bg-secondary rounded-2xl transition-all text-muted-foreground hover:text-primary shadow-sm hover:shadow-md"
              >
                <RefreshCcw size={20} className={loading ? "animate-spin text-primary" : ""} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {loading && posts.length === 0 ? (
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-32 bg-secondary/30 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-32 bg-card/30 border-2 border-dashed border-border/50 rounded-3xl">
                <Search size={48} className="mx-auto mb-4 opacity-10" />
                <h3 className="text-xl font-bold">No insights found</h3>
                <p className="text-muted-foreground">Adjust your search or category filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map(post => (
                  <div 
                    key={post.id} 
                    onClick={() => setSelectedPost(post)}
                    className={`cursor-pointer group relative overflow-hidden bg-card border transition-all duration-300 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 ${
                      selectedPost?.id === post.id ? 'border-primary ring-4 ring-primary/10' : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest border border-primary/20">
                          {post.category}
                        </span>
                        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                          {format(post.publishedAt?.seconds ? new Date(post.publishedAt.seconds * 1000) : new Date(), 'MMM d')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center border group-hover:text-primary transition-colors">
                          <SlidersHorizontal size={14} />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-muted-foreground line-clamp-1 font-medium">{post.summary.replace(/[#*`]/g, '')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Backdrop Overlay */}
      {selectedPost && (
        <div 
          className="fixed inset-0 bg-background/20 backdrop-blur-sm z-10 transition-opacity duration-500"
          onClick={() => setSelectedPost(null)}
        />
      )}

      {/* Side Reader Pane */}
      <div className={`fixed top-0 right-0 h-full bg-card border-l border-border/50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 z-20 overflow-y-auto ${
        selectedPost ? 'w-full md:w-[600px] translate-x-0' : 'w-full md:w-[600px] translate-x-full'
      }`}>
        {selectedPost && (
          <div className="relative">
            <div className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border/50 p-6 flex items-center justify-between z-10">
              <button 
                onClick={() => setSelectedPost(null)}
                className="p-3 bg-secondary/50 hover:bg-secondary rounded-2xl transition-all text-muted-foreground hover:text-foreground flex items-center gap-2 group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-xs font-bold uppercase tracking-widest">Close</span>
              </button>
              
              <a 
                href={selectedPost.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline font-bold text-sm"
              >
                Open Original
                <ExternalLink size={16} />
              </a>
            </div>

            <div className="p-8 md:p-12">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-[0.2em]">
                    {selectedPost.category}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                    {format(selectedPost.publishedAt?.seconds ? new Date(selectedPost.publishedAt.seconds * 1000) : new Date(), 'MMMM d, yyyy')}
                  </span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-8">
                  {selectedPost.title}
                </h2>
                
                <div className="flex items-center gap-4 py-6 border-y border-border/50">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary border shadow-sm">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Source Intel</p>
                    <p className="font-bold tracking-tight text-lg">{selectedPost.sourceName}</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-lg dark:prose-invert prose-primary max-w-none mb-12">
                <ReactMarkdown>{selectedPost.summary}</ReactMarkdown>
              </div>

              <div className="pt-10 border-t border-border/50">
                <a 
                  href={selectedPost.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-primary text-primary-foreground py-5 rounded-3xl font-bold hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 text-lg"
                >
                  Visit Full Intelligence Report
                  <ExternalLink size={20} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
