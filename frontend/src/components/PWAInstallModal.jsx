import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Zap } from 'lucide-react';

export function PWAInstallModal() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // 1. Check if we've already asked recently
    const lastAsked = localStorage.getItem('pwa_prompt_last_asked');
    const now = Date.now();
    
    // Don't show if they dismissed it in the last 7 days
    if (lastAsked && (now - parseInt(lastAsked)) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_last_asked', Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card border border-border/50 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl shadow-primary/20 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-[24px] flex items-center justify-center text-primary mx-auto mb-6 relative">
            <Smartphone size={40} />
            <div className="absolute -right-1 -top-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Zap size={16} fill="currentColor" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-3 tracking-tight">Get NeuroStack App</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Install NeuroStack to your home screen for a faster, full-screen experience and offline reading.
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleInstall}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
            >
              <Download size={18} />
              Install Now
            </button>
            <button 
              onClick={handleDismiss}
              className="w-full py-4 bg-secondary text-secondary-foreground rounded-2xl font-bold text-sm hover:bg-secondary/80 transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
