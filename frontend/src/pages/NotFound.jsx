import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/20">
          <Brain size={48} className="text-primary opacity-60" />
        </div>

        {/* 404 */}
        <p className="text-[120px] font-black tracking-tighter leading-none text-primary/10 select-none mb-2">
          404
        </p>

        <h1 className="text-3xl font-bold tracking-tight mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          This page doesn't exist in the knowledge base. It may have been moved, deleted, or you may have mistyped the URL.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-border/50 rounded-xl font-semibold hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Home size={18} />
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
