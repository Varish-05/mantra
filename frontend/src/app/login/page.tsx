'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user is already authenticated, skip login
    const token = localStorage.getItem('mantra_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        await api.register(email, password, role);
        // Automatically login after successful registration
        await api.login(email, password);
      } else {
        // Login flow
        await api.login(email, password);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#070A13] px-4 overflow-hidden relative">
      {/* Decorative cyber grid or glowing nodes in background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#131B2E]/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-mono font-bold text-xl mb-3 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse">
            M
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            MANTRA
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-mono uppercase tracking-wider text-center">
            Modern Analysis & Network Threat Response Assistant
          </p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg mb-6 flex items-start gap-2">
            <span className="font-bold">ALERT:</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-mono uppercase tracking-wider mb-2">
              Operator Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0C101F] border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans text-sm"
              placeholder="operator@mantra.io"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-mono uppercase tracking-wider mb-2">
              Access Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0C101F] border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans text-sm"
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-slate-300 text-xs font-mono uppercase tracking-wider mb-2">
                Operational Role (For Testing)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#0C101F] border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans text-sm"
              >
                <option value="Viewer">Viewer (Read-only logs)</option>
                <option value="Security Analyst">Security Analyst (Run scans, read reports)</option>
                <option value="Admin">Admin (Full privileges & deletion)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-medium py-2.5 px-4 rounded-lg focus:outline-none shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transition-all text-sm font-sans flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isRegister ? (
              'PROVISION ACCOUNT'
            ) : (
              'INITIALIZE OPERATION'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-400 hover:text-blue-300 text-xs font-mono tracking-wide underline transition-colors"
          >
            {isRegister ? 'EXECUTE LOGIN SESSION' : 'PROVISION NEW OPERATOR ID'}
          </button>
        </div>
      </div>
    </div>
  );
}
