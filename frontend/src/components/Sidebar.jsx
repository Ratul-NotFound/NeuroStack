import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Hash, Settings, PlusCircle, Database, Globe, Layers, RefreshCcw, User } from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar({ categories, className }) {
  return (
    <aside className={cn("w-72 border-r border-border/50 bg-card flex flex-col h-full shadow-[1px_0_0_0_rgba(0,0,0,0.05)]", className)}>
      <div className="p-8">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Database size={22} />
          </div>
          NeuroStack
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8">
        <div>
          <h3 className="px-4 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
            Intelligence
          </h3>
          <div className="space-y-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-primary"
              )}
            >
              <LayoutGrid size={18} />
              All Content
            </NavLink>
            
            {categories.map((cat) => (
              <NavLink
                key={cat.id}
                to={`/category/${cat.id}`}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-primary"
                )}
              >
                <Hash size={18} />
                {cat.name}
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <h3 className="px-4 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
            System
          </h3>
          <div className="space-y-1">
            <NavLink
              to="/admin/new-post"
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-muted-foreground hover:bg-secondary/80 hover:text-primary transition-all duration-200"
            >
              <PlusCircle size={18} />
              New Post
            </NavLink>
            <NavLink
              to="/admin/categories"
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-primary"
              )}
            >
              <Layers size={18} />
              Sectors
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-primary"
              )}
            >
              <Settings size={18} />
              Sources
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="p-6 border-t border-border/50">
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 absolute -right-0.5 -top-0.5 border-2 border-background animate-pulse"></div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <RefreshCcw size={14} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Live System</p>
              <p className="text-[11px] text-muted-foreground font-medium">Auto-fetch Active</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
