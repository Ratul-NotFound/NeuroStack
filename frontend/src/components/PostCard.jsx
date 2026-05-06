import React from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ExternalLink, Calendar, Tag, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PostCard({ post }) {
  const publishedDate = post.publishedAt?.seconds 
    ? new Date(post.publishedAt.seconds * 1000) 
    : new Date();

  return (
    <div className="group bg-card text-card-foreground border border-border/50 rounded-2xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-widest">
            {post.category}
          </span>
          <div className="w-1 h-1 rounded-full bg-border" />
          <span className="text-muted-foreground text-xs flex items-center gap-1.5 font-medium">
            <Calendar size={14} className="opacity-70" />
            {format(publishedDate, 'MMM d, yyyy')}
          </span>
        </div>

        <h2 className="text-2xl font-semibold mb-4 leading-tight tracking-tight group-hover:text-primary transition-colors">
          <Link to={`/post/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>

        <div className="prose prose-sm dark:prose-invert line-clamp-4 mb-8 text-foreground/70 leading-relaxed">
          <ReactMarkdown>{post.summary}</ReactMarkdown>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-border/50 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary border shadow-sm">
              <User size={14} />
            </div>
            <span className="text-sm font-semibold tracking-tight">{post.sourceName}</span>
          </div>
          
          {post.isCustom && (
            <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-amber-500/20">
              Original
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
