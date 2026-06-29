'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { 
  Shield, 
  Upload, 
  Search, 
  LogOut, 
  FileCode, 
  CheckCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  UserCheck,
  Binary
} from 'lucide-react';

export default function IngestionPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('mantra_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    api.getUserMe().then(setUser).catch(() => {
      api.logout();
      router.push('/login');
    });
  }, [router]);

  const handleLogout = () => {
    api.logout();
    router.push('/login');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccessResult(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (user?.role === 'Viewer') {
      setError('ACCESS INSUFFICIENT: Passive Viewer profiles lack clearance to ingest files.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccessResult(null);

    try {
      const response = await api.uploadFile(file);
      setSuccessResult(response);
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Threat scan failed. File contents might be corrupted.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#03060E] text-slate-200 font-sans">
      {/* Sidebar navigation */}
      <aside className="w-68 border-r border-slate-900 bg-[#060A13]/80 backdrop-blur-xl flex flex-col justify-between shrink-0 relative">
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/10 via-transparent to-transparent"></div>
        <div>
          <div className="p-6 border-b border-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Shield size={18} className="text-blue-500" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-white tracking-[0.15em] block uppercase font-mono">MANTRA</span>
              <span className="text-[9px] text-blue-400 font-mono uppercase tracking-wider block">OP NODE // ACTIVE</span>
            </div>
          </div>
          
          <nav className="p-4 space-y-1.5">
            <a href="/dashboard" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 font-mono text-xs uppercase tracking-wider transition-all">
              <Layers size={14} />
              Security Console
            </a>
            <a href="/upload" className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-blue-600/10 text-blue-400 font-mono font-bold text-xs uppercase tracking-wider transition-all border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
              <Upload size={14} />
              Ingestion Desk
            </a>
            <a href="/search" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 font-mono text-xs uppercase tracking-wider transition-all">
              <Search size={14} />
              Semantic Chat
            </a>
          </nav>
        </div>

        {/* User context */}
        <div className="p-4 border-t border-slate-900 bg-[#04070D]">
          <div className="flex items-center gap-3 mb-4 bg-slate-950/40 border border-slate-900 p-3 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-blue-950/30 border border-blue-500/20 flex items-center justify-center text-slate-300">
              <UserCheck size={14} className="text-blue-400" />
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-[10px] text-slate-200 block truncate font-mono">{user?.email}</span>
              <span className="text-[8px] text-blue-400 font-mono block uppercase tracking-wider mt-0.5">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/20 text-[10px] font-mono tracking-widest uppercase transition-all cursor-pointer"
          >
            <LogOut size={12} />
            DISCONNECT NODE
          </button>
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full">
        <header className="mb-10 pb-6 border-b border-slate-900">
          <h1 className="text-3xl font-extrabold tracking-wider text-white font-mono uppercase flex items-center gap-2">
            <Upload className="text-blue-500" size={26} />
            Ingestion Desk
          </h1>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
            Submit network flow packets, logs, and executable files to run pgvector chunk indexing
          </p>
        </header>

        {error && (
          <div className="bg-red-950/20 border border-red-500/20 text-red-200 text-xs p-5 rounded-xl mb-6 flex items-start gap-3 shadow-lg shadow-red-500/5 animate-fadeIn">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div>
              <span className="font-mono font-bold block mb-1">INGESTION_ERROR //</span>
              <span className="text-slate-300 font-mono text-[11px] leading-relaxed">{error}</span>
            </div>
          </div>
        )}

        {successResult && (
          <div className="cyber-card p-6 rounded-xl mb-8 flex items-start gap-4 shadow-lg border-emerald-500/30 bg-emerald-950/10 glow-emerald animate-fadeIn">
            <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={22} />
            <div className="flex-1">
              <span className="font-mono font-bold text-sm block tracking-wider text-emerald-400">INGESTION COMPLETED SECURELY</span>
              <div className="grid grid-cols-2 gap-y-1.5 text-[10px] text-slate-400 mt-4 font-mono border-t border-slate-900 pt-4">
                <div>Document Node ID:</div>
                <div className="text-white">{successResult.id}</div>
                <div>File Target:</div>
                <div className="text-white">{successResult.filename}</div>
                <div>Index Pipeline Status:</div>
                <div className="text-emerald-400 uppercase font-bold tracking-widest">{successResult.status}</div>
              </div>
              <button 
                onClick={() => router.push('/dashboard')}
                className="mt-6 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-mono tracking-widest uppercase transition-all shadow-md cursor-pointer border border-emerald-500/20"
              >
                Inspect Threat dashboard
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Upload form container */}
        <div className="cyber-card p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
          
          <form onSubmit={handleUploadSubmit} className="space-y-8">
            <div className="border border-dashed border-slate-800 hover:border-blue-500/30 bg-[#060914] rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group shadow-inner">
              <input 
                type="file" 
                id="file-upload" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.txt,.csv,.json,.eml,.log"
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-600/5 border border-blue-500/10 group-hover:border-blue-500/30 flex items-center justify-center text-blue-400 mb-5 transition-all shadow-inner group-hover:scale-105">
                <FileCode size={26} className="text-blue-500" />
              </div>
              <span className="text-xs font-bold text-slate-300 font-mono tracking-wide mb-1 uppercase group-hover:text-white transition-colors">
                {file ? file.name : 'Ingest cybersecurity payload file'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                {file ? `${(file.size / 1024).toFixed(2)} KB` : 'Formats supported: PDF, DOCX, TXT, CSV, JSON, EML, LOG'}
              </span>
            </div>

            {user?.role === 'Viewer' && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] p-3.5 rounded-xl flex items-center gap-2.5 font-mono">
                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                SECURITY ALERT: Viewer clearance levels cannot trigger active ingestion scans.
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading || user?.role === 'Viewer'}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-600 disabled:border-slate-800/80 text-white font-mono uppercase text-xs tracking-wider py-4 px-4 rounded-xl focus:outline-none shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 border border-blue-400/20 cursor-pointer"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>EXECUTING VECTOR EMBEDDINGS & MODEL SCANS...</span>
                </>
              ) : (
                <>
                  <Binary size={16} />
                  <span>COMMENCE THREAT INDEXING</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
