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
  Layers,
  UserCheck,
  Terminal,
  Activity
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
        content: 'SYS_ERROR // Inability to execute retrieval loop. ' + err.message 
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
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
            <a href="/upload" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 font-mono text-xs uppercase tracking-wider transition-all">
              <Upload size={14} />
              Ingestion Desk
            </a>
            <a href="/search" className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-blue-600/10 text-blue-400 font-mono font-bold text-xs uppercase tracking-wider transition-all border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
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

      {/* Chat pane */}
      <main className="flex-1 flex flex-col justify-between h-screen max-w-6xl mx-auto w-full p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none"></div>

        <div>
          <header className="pb-6 border-b border-slate-900 mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-wider text-white font-mono uppercase flex items-center gap-2">
                <Search className="text-blue-500" size={26} />
                Semantic RAG Desk
              </h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                Conversational security assistant querying cited indices inside pgvector
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono tracking-wider">
              <Terminal size={12} />
              AGENT_ENGINE: READY
            </div>
          </header>
        </div>

        {/* Message timeline panel */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6 scrollbar-thin scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Terminal size={26} className="text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest mb-1.5">MANTRA CO-OP PILOT</h3>
              <p className="text-[11px] text-slate-500 font-mono max-w-sm leading-relaxed uppercase tracking-wide">
                Query threat details, malware classifications, or mitigations. Cited references are tracked.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex flex-col max-w-3xl ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'} animate-fadeIn`}
              >
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                  {msg.role === 'user' ? (
                    <>
                      <span>// OPERATOR_QUERY</span>
                    </>
                  ) : (
                    <>
                      <Activity size={10} className="text-blue-500 animate-pulse" />
                      <span className="text-blue-400 font-bold">MANTRA_RESPONSE_NODE</span>
                    </>
                  )}
                </div>
                <div 
                  className={`p-5 rounded-2xl text-xs leading-relaxed font-mono ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none shadow-lg shadow-blue-500/10 border border-blue-400/20' 
                      : 'bg-[#0D1324]/85 border border-slate-900 text-slate-300 rounded-bl-none backdrop-blur-md shadow-xl'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
                
                {/* Citations references */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 w-full bg-[#05080E]/60 border border-slate-900 rounded-xl p-4 space-y-3 shadow-inner">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-blue-400 font-bold block border-b border-slate-900 pb-2">
                      Cited Document Indices ({msg.citations.length})
                    </span>
                    {msg.citations.map((cite: any, cidx: number) => (
                      <div key={cite.chunk_id} className="text-[11px] border-l-2 border-blue-600/40 pl-4 py-1.5 bg-[#0D1324]/20 rounded-r">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300 font-mono uppercase tracking-wider">
                          <FileText size={10} className="text-slate-500" />
                          [{cidx + 1}] {cite.document_name}
                        </div>
                        <p className="text-slate-500 mt-2 leading-relaxed font-mono text-[10px]">
                          &quot;{cite.content.length > 250 ? `${cite.content.slice(0, 250)}...` : cite.content}&quot;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              <span className="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              Executing semantic query retrieval loop...
            </div>
          )}
        </div>

        {/* Input prompt query */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3 bg-[#0D1324] border border-slate-900 p-3.5 rounded-xl shadow-2xl shrink-0 relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
          <input
            type="text"
            required
            disabled={loading}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-slate-200 px-3 placeholder-slate-600 text-xs font-mono"
            placeholder="Input operational inquiry (e.g. 'explain mitigation logs T1046')..."
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-900 disabled:text-slate-600 text-white rounded-lg transition-all flex items-center justify-center shrink-0 border border-blue-400/10 cursor-pointer shadow-md shadow-blue-500/5"
          >
            <Send size={14} />
          </button>
        </form>
      </main>
    </div>
  );
}
