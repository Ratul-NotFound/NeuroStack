import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err) {
      setError('Invalid credentials. Access denied.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground">Authorized access only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="email"
                required
                className="w-full bg-secondary/50 border rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary"
                placeholder="admin@hub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="password"
                required
                className="w-full bg-secondary/50 border rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
