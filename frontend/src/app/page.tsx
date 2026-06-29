'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('mantra_token');
    if (!token) {
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0B0F19]">
      <div className="flex flex-col items-center gap-4">
        {/* Loading spinner */}
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-mono text-sm">LOADING MANTRA ENGINE...</p>
      </div>
    </div>
  );
}
