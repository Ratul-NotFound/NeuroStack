import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { Feed } from './pages/Feed';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManagePosts } from './pages/ManagePosts';
import { ManageSources } from './pages/ManageSources';
import { ManageCategories } from './pages/ManageCategories';
import { NewPost } from './pages/NewPost';
import { PostDetails } from './pages/PostDetails';
import { NotFound } from './pages/NotFound';
import { Loader2 } from 'lucide-react';
import { PWAInstallModal } from './components/PWAInstallModal';

// Protected Route Component — only the designated admin UID can pass through
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        const adminUid = import.meta.env.VITE_ADMIN_UID;
        if (adminUid && u.uid !== adminUid) {
          // Sign out non-admin Firebase users attempting to access admin routes
          await signOut(auth);
          setUser(null);
        } else {
          setUser(u);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <PWAInstallModal />
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Feed />} />
          <Route path="/category/:categoryId" element={<Feed />} />
          <Route path="/post/:postId" element={<PostDetails />} />
        </Route>

        <Route path="/login" element={<Login />} />

        {/* Admin Protected Routes — dedicated AdminLayout, wrapped in ProtectedRoute */}
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/posts" element={<ManagePosts />} />
          <Route path="/admin/categories" element={<ManageCategories />} />
          <Route path="/admin/sources" element={<ManageSources />} />
          <Route path="/admin/new-post" element={<NewPost />} />
        </Route>

        {/* 404 — proper not-found page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
