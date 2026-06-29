'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { 
  Shield, 
  Upload, 
  Search, 
  LogOut, 
  Send, 
  FileText, 
  ExternalLink,
  Layers,
  UserCheck
} from 'lucide-react';

export default function SemanticSearchPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    const currentQuery = query;
    setQuery('');
    setLoading(true);

    try {
      const response = await api.chatRAG(currentQuery);
      const assistantMsg = { 
        role: 'assistant', 
        content: response.response,
        citations: response.citations 
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg = { 
        role: 'system', 
        content: 'Error: Could not retrieve response. ' + err.message 
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
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
            <a href="/upload" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium text-sm transition-all">
              <Upload size={16} />
              Ingestion Desk
            </a>
            <a href="/search" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-blue-600/10 text-blue-400 font-medium text-sm transition-all border border-blue-500/10">
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

      {/* RAG search panels */}
      <main className="flex-1 flex flex-col justify-between h-screen max-w-6xl mx-auto w-full p-8 overflow-hidden">
        <div>
          <header className="pb-4 border-b border-slate-800/80 mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Search className="text-blue-500 animate-pulse" size={24} />
              Semantic Intelligence Desk (RAG)
            </h1>
            <p className="text-xs text-slate-400 font-mono uppercase mt-1">
              Ask queries about ingested corporate security corpus and view source references
            </p>
          </header>
        </div>

        {/* Chat message loops */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 animate-bounce">
                <Search size={24} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">MANTRA Security Copilot</h3>
              <p className="text-xs text-slate-500 font-mono max-w-sm leading-relaxed">
                Query threat profiles, phishing targets, or network anomaly indicators. All answers are cited.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex flex-col max-w-3xl ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className={`text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5`}>
                  {msg.role === 'user' ? 'OPERATOR' : 'MANTRA CORE'}
                </div>
                <div 
                  className={`p-4 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-600/10' 
                      : 'bg-[#131B2E] border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
                
                {/* References Block for assistant response */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 w-full bg-[#0A0D18]/50 border border-slate-800/60 rounded-lg p-3 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold block mb-1">CITED SOURCES</span>
                    {msg.citations.map((cite: any, cidx: number) => (
                      <div key={cite.chunk_id} className="text-xs border-l-2 border-blue-600/40 pl-3 py-1 bg-[#131B2E]/40 rounded-r">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-white font-mono uppercase">
                          <FileText size={10} className="text-slate-400" />
                          [{cidx + 1}] {cite.document_name}
                        </div>
                        <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">
                          &quot;{cite.content.length > 200 ? `${cite.content.slice(0, 200)}...` : cite.content}&quot;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              RETRIEVING VECTOR MATCHES & RE-SYNTHESIZING...
            </div>
          )}
        </div>

        {/* Input prompt query */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3 bg-[#131B2E] border border-slate-800 p-3 rounded-xl shadow-xl shrink-0">
          <input
            type="text"
            required
            disabled={loading}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-slate-200 px-3 placeholder-slate-500 text-sm"
            placeholder="Query incident details (e.g. 'explain malware section entropy rules')..."
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-all flex items-center justify-center shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </main>
    </div>
  );
}
