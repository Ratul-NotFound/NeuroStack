import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 p-4 bg-card border border-border shadow-2xl rounded-2xl max-w-sm w-[calc(100%-2rem)] sm:mx-auto animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold flex items-center gap-2">
            <RefreshCw size={18} className="text-primary" />
            Update Available
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            A new version of NeuroStack has been installed in the background. Update now to see the latest changes!
          </p>
        </div>
        <button onClick={close} className="text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          Update App Now
        </button>
        <button
          onClick={close}
          className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-xl font-semibold hover:bg-secondary/80 transition-all"
        >
          Later
        </button>
      </div>
    </div>
  );
}
