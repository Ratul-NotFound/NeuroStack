import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { MainLayout } from './layouts/MainLayout';
import { Feed } from './pages/Feed';
import { Login } from './pages/Login';
import { ManageSources } from './pages/ManageSources';
import { ManageCategories } from './pages/ManageCategories';
import { NewPost } from './pages/NewPost';
import { PostDetails } from './pages/PostDetails';
import { Loader2 } from 'lucide-react';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  
  // Verify if admin UID matches (optional but recommended)
  // const adminUid = import.meta.env.VITE_ADMIN_UID;
  // if (adminUid && user.uid !== adminUid) return <Navigate to="/" replace />;

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Feed />} />
          <Route path="/category/:categoryId" element={<Feed />} />
          <Route path="/post/:postId" element={<PostDetails />} />
        </Route>

        <Route path="/login" element={<Login />} />

        {/* Admin Protected Routes */}
        <Route element={<MainLayout />}>
          <Route path="/admin/categories" element={<ProtectedRoute><ManageCategories /></ProtectedRoute>} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <ManageSources />
            </ProtectedRoute>
          } />
          <Route path="/admin/new-post" element={
            <ProtectedRoute>
              <NewPost />
            </ProtectedRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
