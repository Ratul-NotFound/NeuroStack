import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ArrowLeft, ExternalLink, Calendar, User, Share2, Tag, Twitter, Linkedin, Link2, Check } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function PostDetails() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const docSnap = await getDoc(doc(db, 'posts', postId));
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Post not found</h2>
        <button onClick={() => navigate('/')} className="text-primary hover:underline">
          Return to dashboard
        </button>
      </div>
    );
  }

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(post.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnX = () => {
    const text = encodeURIComponent(`Check out this AI insight on NeuroStack: ${post.title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(post.link)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(post.link)}`, '_blank');
  };

  const publishedDate = post.publishedAt?.seconds 
    ? new Date(post.publishedAt.seconds * 1000) 
    : new Date();

  return (
    <div className="min-h-screen bg-background/50 flex flex-col">
      <div className="max-w-4xl mx-auto px-6 py-12 pb-32 flex-1 w-full">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-12 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold text-sm tracking-tight">Back to Library</span>
        </button>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-[0.2em]">
              {post.category}
            </span>
            <div className="w-1 h-1 rounded-full bg-border" />
            <span className="text-muted-foreground text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar size={14} className="opacity-70" />
              {format(publishedDate, 'MMMM d, yyyy')}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-[1.1]">
            {post.title}
          </h1>

          {post.thumbnail && (
            <div className="mb-12 rounded-3xl overflow-hidden border border-border/50 shadow-2xl">
              <img 
                src={post.thumbnail} 
                alt={post.title}
                className="w-full aspect-[21/9] object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary border border-border/50 shadow-sm">
                <User size={20} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Source</p>
                <p className="font-bold tracking-tight">{post.sourceName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={shareOnX}
                title="Share on X"
                className="p-3 bg-card border border-border/50 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-[#1DA1F2]"
              >
                <Twitter size={20} fill="currentColor" className="stroke-none" />
              </button>
              <button 
                onClick={shareOnLinkedIn}
                title="Share on LinkedIn"
                className="p-3 bg-card border border-border/50 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-[#0A66C2]"
              >
                <Linkedin size={20} fill="currentColor" className="stroke-none" />
              </button>
              <button 
                onClick={handleCopy}
                title="Copy Link"
                className="p-3 bg-card border border-border/50 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-primary relative"
              >
                {copied ? <Check size={20} className="text-green-500" /> : <Link2 size={20} />}
                {copied && <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] px-2 py-1 rounded-md animate-in fade-in slide-in-from-bottom-2">Copied!</span>}
              </button>
              <a 
                href={post.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                View Original
                <ExternalLink size={18} />
              </a>
            </div>
          </div>
        </header>

        <article className="prose prose-lg dark:prose-invert prose-primary max-w-none bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-sm prose-headings:tracking-tight prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-primary">
          <ReactMarkdown>{post.summary}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
