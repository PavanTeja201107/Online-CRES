import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext({ push: ()=>{}, pushLastLogin: ()=>{} });

export function ToastProvider({children}){
  const [toasts, setToasts] = useState([]);
  
  const push = useCallback((message, kind='info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, kind }]);
    setTimeout(()=> setToasts(prev => prev.filter(t=>t.id!==id)), 3500);
  }, []);
  
  const pushLastLogin = useCallback((formattedDate) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { 
      id, 
      message: formattedDate, 
      kind: 'lastLogin',
      isLastLogin: true 
    }]);
    setTimeout(()=> setToasts(prev => prev.filter(t=>t.id!==id)), 5000); // Show for 5 seconds
  }, []);
  
  return (
    <ToastContext.Provider value={{ push, pushLastLogin }}>
      {children}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          t.isLastLogin ? (
            <div key={t.id} className="px-6 py-4 rounded-xl shadow-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white max-w-md animate-slide-in border-2 border-white/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base mb-1.5 flex items-center gap-2">
                    <span> Last Login</span>
                  </div>
                  <div className="text-sm opacity-95 font-medium leading-relaxed">{t.message}</div>
                  <div className="text-xs opacity-75 mt-2">Welcome back!</div>
                </div>
                <button 
                  onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
                  className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div key={t.id} className={`px-4 py-2 rounded shadow text-white text-sm ${t.kind==='success'?'bg-emerald-600': t.kind==='danger'?'bg-red-600': t.kind==='warning'?'bg-yellow-600':'bg-indigo-600'}`}>
              {t.message}
            </div>
          )
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(){
  return useContext(ToastContext);
}
