'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Shield, Fingerprint, Mail, Lock, Server } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
        await api.register(email, password, role);
        await api.login(email, password);
      } else {
        await api.login(email, password);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Access Denied: Authentication credentials invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#03060E] px-4 overflow-hidden relative font-sans">
      {/* Dynamic Back-Glow Nodes */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.02),transparent_70%)] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-[#0A0F1E]/80 backdrop-blur-2xl border border-blue-500/10 p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10 glow-blue">
        {/* Glow Line Indicator */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold text-xl mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)] cyber-pulse-node">
            <Shield size={28} className="text-blue-500" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white font-mono uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            MANTRA
          </h1>
          <p className="text-[10px] text-blue-400/80 font-mono uppercase tracking-[0.2em] mt-1.5 text-center">
            Threat Identification & Response Terminal
          </p>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-xs p-3.5 rounded-xl mb-6 flex items-start gap-2.5">
            <span className="font-mono font-bold text-red-500">SYS_ALERT //</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-slate-400 text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Mail size={12} className="text-slate-500" />
              OPERATOR IDENTITY (EMAIL)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#060914] border border-slate-800 focus:border-blue-500/50 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-xs placeholder-slate-700"
              placeholder="e.g. administrator@mantra.security"
            />
          </div>

          <div className="relative">
            <label className="block text-slate-400 text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Lock size={12} className="text-slate-500" />
              CYPHER KEY (PASSWORD)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#060914] border border-slate-800 focus:border-blue-500/50 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-xs placeholder-slate-700"
              placeholder="••••••••••••"
            />
          </div>

          {isRegister && (
            <div className="relative animate-fadeIn">
              <label className="block text-slate-400 text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Server size={12} className="text-slate-500" />
                SECURITY ROLE CLEARANCE
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#060914] border border-slate-800 focus:border-blue-500/50 rounded-xl py-3 px-4 text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-xs cursor-pointer"
              >
                <option value="Viewer">LEVEL_0: Viewer (Passive Audit logs)</option>
                <option value="Security Analyst">LEVEL_1: Security Analyst (Run classification scans)</option>
                <option value="Admin">LEVEL_2: Administrator (Full node write access)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-800/40 disabled:to-indigo-800/40 text-white font-mono uppercase text-xs tracking-wider py-3.5 px-4 rounded-xl focus:outline-none shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 border border-blue-400/20 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Fingerprint size={16} />
                <span>{isRegister ? 'PROVISION ACCOUNT PROFILE' : 'ESTABLISH LINK SESSION'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-900 pt-6">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-400/70 hover:text-blue-400 text-[10px] font-mono tracking-widest uppercase transition-colors"
          >
            {isRegister ? '// RETRIEVE LOG IN SECURE SESSION' : '// INIT NEW OPERATOR PROFILE'}
          </button>
        </div>
      </div>
    </div>
  );
}
