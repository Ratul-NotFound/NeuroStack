import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Sidebar } from '../components/Sidebar';
import { Menu, X, Moon, Sun } from 'lucide-react';

export function MainLayout() {
  const [categories, setCategories] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    async function fetchCategories() {
      const q = query(collection(db, 'categories'), orderBy('name'));
      const snapshot = await getDocs(q);
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchCategories();
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        categories={categories} 
        className={isSidebarOpen ? "fixed inset-y-0 left-0 z-50 translate-x-0" : "hidden md:flex"} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Navbar for Mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2">
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg">NeuroStack</span>
          <button onClick={toggleTheme} className="p-2 -mr-2">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Desktop Theme Toggle */}
        <div className="hidden md:block absolute top-6 right-6 z-20">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
