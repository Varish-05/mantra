'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { 
  Shield, 
  Upload, 
  Search, 
  LogOut, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  UserCheck
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
      setError('AUTHORIZATION ALERT: Viewer role does not have write access to upload files.');
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
      setError(err.message || 'File ingestion process failed. Confirm format structure.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070A13] text-slate-200">
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-slate-800 bg-[#0B0F19]/50 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold text-sm">
              M
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-wider block">MANTRA</span>
              <span className="text-[10px] text-slate-500 font-mono uppercase">Command Node</span>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            <a href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium text-sm transition-all">
              <Layers size={16} />
              Dashboard
            </a>
            <a href="/upload" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-blue-600/10 text-blue-400 font-medium text-sm transition-all border border-blue-500/10">
              <Upload size={16} />
              Ingestion Desk
            </a>
            <a href="/search" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium text-sm transition-all">
              <Search size={16} />
              Semantic Chat (RAG)
            </a>
          </nav>
        </div>

        {/* User context */}
        <div className="p-4 border-t border-slate-800 bg-[#0A0D18]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
              <UserCheck size={16} className="text-blue-400" />
            </div>
            <div className="overflow-hidden">
              <span className="font-semibold text-xs text-white block truncate">{user?.email}</span>
              <span className="text-[9px] text-slate-500 font-mono block uppercase">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/30 text-xs font-semibold transition-all"
          >
            <LogOut size={12} />
            DISCONNECT
          </button>
        </div>
      </aside>

      {/* Upload layout panel */}
      <main className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full">
        <header className="mb-8 pb-4 border-b border-slate-800/80">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Upload className="text-blue-500" size={24} />
            Ingestion Desk
          </h1>
          <p className="text-xs text-slate-400 font-mono uppercase mt-1">
            Ingest threat files for vector chunking and immediate machine learning classification
          </p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-4 rounded-xl mb-6 flex items-start gap-2.5">
            <AlertTriangle className="text-red-500 shrink-0" size={18} />
            <div>
              <span className="font-semibold block mb-0.5">INGESTION DENIED</span>
              <span className="text-xs text-slate-300">{error}</span>
            </div>
          </div>
        )}

        {successResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm p-5 rounded-xl mb-8 flex items-start gap-3.5 shadow-lg shadow-emerald-500/5">
            <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <span className="font-bold text-sm block mb-1">DOCUMENT INGESTED SECURELY</span>
              <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-300 mt-2 font-mono">
                <div>Document UUID:</div>
                <div className="text-white">{successResult.id}</div>
                <div>File Target:</div>
                <div className="text-white">{successResult.filename}</div>
                <div>Status:</div>
                <div className="text-emerald-400 uppercase font-bold">{successResult.status}</div>
              </div>
              <button 
                onClick={() => router.push('/dashboard')}
                className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-700/20"
              >
                Go to Command center
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Upload form area */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-8 shadow-xl">
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/40 bg-[#0C101F] rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative">
              <input 
                type="file" 
                id="file-upload" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.txt,.csv,.json,.eml,.log"
              />
              <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <FileText size={24} />
              </div>
              <span className="text-sm font-semibold text-white mb-1">
                {file ? file.name : 'Select threat logs or target file'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {file ? `${(file.size / 1024).toFixed(2)} KB` : 'Supported formats: PDF, DOCX, TXT, CSV, JSON, EML, LOG'}
              </span>
            </div>

            {user?.role === 'Viewer' && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs p-3 rounded-lg flex items-center gap-2 font-mono">
                <AlertTriangle size={14} className="text-amber-500" />
                VIEWER ACCESS ONLY: Scans cannot be executed by your security clearance.
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading || user?.role === 'Viewer'}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/30 text-white font-medium py-3 px-4 rounded-xl focus:outline-none shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transition-all text-sm font-sans flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>EXECUTING VECTOR EMBEDDINGS & THREAT INFRENCE...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>COMMENCE THREAT INGESTION</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
