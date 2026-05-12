import React from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ExternalLink, Calendar, Tag, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const categoryColors = {
  'ai': 'from-blue-500 to-indigo-600',
  'machine-learning': 'from-purple-500 to-pink-600',
  'web-development': 'from-emerald-500 to-teal-600',
  'programming': 'from-amber-500 to-orange-600',
  'cybersecurity': 'from-red-500 to-rose-600',
  'data-science': 'from-cyan-500 to-blue-600',
  'design-ui': 'from-fuchsia-500 to-purple-600',
  'devops-cloud': 'from-slate-500 to-zinc-600',
  'general': 'from-indigo-500 to-violet-600',
};

const getCategoryGradient = (cat) => categoryColors[cat] || categoryColors['general'];

export function PostCard({ post }) {
  const publishedDate = post.publishedAt?.seconds 
    ? new Date(post.publishedAt.seconds * 1000) 
    : new Date();

  return (
    <Link 
      to={`/post/${post.id}`}
      className="group relative block bg-card text-card-foreground border border-border/50 rounded-2xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_30px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01] active:scale-[0.98] border-b-4 hover:border-primary/50"
    >
      {/* Dynamic Category Accent Stripe */}
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${getCategoryGradient(post.category)} opacity-70`} />
      {post.thumbnail && (
        <div className="relative aspect-video w-full overflow-hidden">
          <img 
            src={post.thumbnail} 
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 bg-gradient-to-r ${getCategoryGradient(post.category)} text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg shadow-primary/10`}>
            {post.category}
          </span>
          <div className="w-1 h-1 rounded-full bg-border" />
          <span className="text-muted-foreground text-[10px] flex items-center gap-1.5 font-medium">
            <Calendar size={12} className="opacity-70" />
            {format(publishedDate, 'MMM d, yyyy')}
          </span>
        </div>

        <h2 className="text-xl font-semibold mb-3 leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h2>

        <div className="prose prose-sm dark:prose-invert line-clamp-3 mb-6 text-foreground/70 leading-relaxed group-hover:text-foreground transition-colors text-xs">
          <ReactMarkdown
            components={{
              a: ({node, ...props}) => <span className="text-primary font-medium" {...props} />
            }}
          >
            {post.summary}
          </ReactMarkdown>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-primary border shadow-sm group-hover:border-primary/30 transition-all">
              <User size={12} />
            </div>
            <span className="text-xs font-semibold tracking-tight">{post.sourceName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {post.isCustom && (
              <span className="text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-amber-500/20">
                Original
              </span>
            )}
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <ExternalLink size={14} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
