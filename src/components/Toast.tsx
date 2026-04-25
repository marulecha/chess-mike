import { useEffect, useState } from 'react';

let externalShow: ((msg: string) => void) | null = null;
export function showToast(msg: string) { externalShow?.(msg); }

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    externalShow = (m: string) => {
      setMsg(m);
      setTimeout(() => setMsg(null), 4000);
    };
    return () => { externalShow = null; };
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-imperial-navy border border-imperial-gold/80 text-imperial-cream px-4 py-2 rounded-sm shadow-imperial z-50">
      {msg}
    </div>
  );
}
