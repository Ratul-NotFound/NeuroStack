import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  LayoutDashboard, Database, Layers, FileText, PlusCircle, 
  LogOut, ChevronRight, Menu, X, Moon, Sun, Brain
} from 'lucide-react';
import { cn } from '../lib/utils';

const adminNavItems = [
  { to: '/admin', end: true,   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/posts',        icon: FileText,         label: 'Manage Posts' },
  { to: '/admin/sources',      icon: Database,         label: 'Sources' },
  { to: '/admin/categories',   icon: Layers,           label: 'Categories' },
  { to: '/admin/new-post',     icon: PlusCircle,       label: 'New Post' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <aside className={cn(
      'flex flex-col bg-card border-r border-border/50 shadow-sm',
      mobile ? 'w-72 fixed inset-y-0 left-0 z-50' : 'w-72 hidden md:flex flex-shrink-0'
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Brain size={22} />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">NeuroStack</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-3">Management</p>
        {adminNavItems.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 group',
              isActive
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-secondary/80 hover:text-primary'
            )}
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-border/50 space-y-2">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl text-muted-foreground hover:bg-secondary/80 hover:text-primary transition-all"
        >
          ← Back to Site
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar mobile />
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/60 backdrop-blur-md flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="hidden md:block">
            <span className="text-sm text-muted-foreground font-medium">Admin Control Panel</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border border-border/50"
              title="Toggle theme"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
