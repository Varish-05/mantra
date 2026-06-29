'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { 
  Shield, 
  Upload, 
  Search, 
  LogOut, 
  Trash2, 
  Download, 
  AlertTriangle,
  Clock,
  UserCheck,
  Activity,
  Layers,
  FileCode,
  Binary
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({
    total_documents: 0,
    malicious_count: 0,
    suspicious_count: 0,
    benign_count: 0,
    avg_risk_score: 0.0,
    threat_types: {}
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('mantra_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    const initDashboard = async () => {
      try {
        const userProfile = await api.getUserMe();
        setUser(userProfile);
        
        const dashboardStats = await api.getDashboardStats();
        setStats(dashboardStats);
        
        const recentLogs = await api.getAnalysisLogs();
        setLogs(recentLogs);
      } catch (err: any) {
        if (err.message?.includes('401') || err.message?.includes('validate credentials')) {
          api.logout();
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    initDashboard();
  }, [router]);

  const handleLogout = () => {
    api.logout();
    router.push('/login');
  };

  const handleDownloadReport = async (analysisId: string) => {
    setActionLoading(analysisId);
    try {
      await api.downloadReport(analysisId);
    } catch (err) {
      alert('Error downloading report: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Execute command: PURGE document and all associated vector embeddings?')) {
      return;
    }
    try {
      await api.deleteDocument(docId);
      const dashboardStats = await api.getDashboardStats();
      setStats(dashboardStats);
      const recentLogs = await api.getAnalysisLogs();
      setLogs(recentLogs);
    } catch (err: any) {
      alert(err.message || 'Access Denied: Level_2 Admin privileges required.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#03060E]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono text-[10px] tracking-widest uppercase">TUNELING CORE API CONNECTION...</p>
        </div>
      </div>
    );
  }

  const threatTypeData = Object.keys(stats.threat_types).map(key => ({
    name: key.toUpperCase().replace("_", " "),
    count: stats.threat_types[key]
  }));

  const chartColors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

  const trendData = [
    { hour: '00:00', ThreatRatio: 12, Scans: 15 },
    { hour: '04:00', ThreatRatio: 18, Scans: 28 },
    { hour: '08:00', ThreatRatio: 26, Scans: 44 },
    { hour: '12:00', ThreatRatio: 45, Scans: 68 },
    { hour: '16:00', ThreatRatio: 32, Scans: 55 },
    { hour: '20:00', ThreatRatio: 19, Scans: 30 },
  ];

  return (
    <div className="flex min-h-screen bg-[#03060E] text-slate-200 font-sans">
      {/* Premium Sidebar with Gloss and glowing divider */}
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
            <a href="/dashboard" className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-blue-600/10 text-blue-400 font-mono font-bold text-xs uppercase tracking-wider transition-all border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
              <Layers size={14} />
              Security Console
            </a>
            <a href="/upload" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 font-mono text-xs uppercase tracking-wider transition-all">
              <Upload size={14} />
              Ingestion Desk
            </a>
            <a href="/search" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 font-mono text-xs uppercase tracking-wider transition-all">
              <Search size={14} />
              Semantic Chat
            </a>
          </nav>
        </div>

        {/* User Context card */}
        <div className="p-4 border-t border-slate-900 bg-[#04070D]">
          <div className="flex items-center gap-3 mb-4 bg-slate-950/40 border border-slate-900 p-3 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-blue-950/30 border border-blue-500/20 flex items-center justify-center text-slate-300">
              <UserCheck size={14} className="text-blue-400 animate-pulse" />
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

      {/* Main dashboard content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full relative">
        {/* Top header status */}
        <header className="flex items-center justify-between mb-10 pb-6 border-b border-slate-900 relative">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wider text-white font-mono uppercase flex items-center gap-2">
              <Shield className="text-blue-500" size={26} />
              COMMAND CENTER
            </h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
              Active Network Analysis & Threat Response Interface
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            SYS STATUS: ONLINE
          </div>
        </header>

        {/* Metrics Section with Cyber cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          <div className="cyber-card p-5 relative overflow-hidden glow-blue">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl"></div>
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block mb-1">TOTAL SCANS</span>
            <span className="text-4xl font-black text-white block tracking-tight font-mono">{stats.total_documents}</span>
            <span className="text-[9px] text-slate-600 font-mono block mt-2">Log audits indexed</span>
          </div>

          <div className="cyber-card p-5 relative overflow-hidden glow-red">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-2xl"></div>
            <span className="text-[9px] text-red-400 font-mono uppercase tracking-widest block mb-1">MALICIOUS</span>
            <span className="text-4xl font-black text-red-500 block tracking-tight font-mono">{stats.malicious_count}</span>
            <span className="text-[9px] text-red-900/60 font-mono block mt-2">SYS SEVERITY RED</span>
          </div>

          <div className="cyber-card p-5 relative overflow-hidden glow-amber">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl"></div>
            <span className="text-[9px] text-amber-400 font-mono uppercase tracking-widest block mb-1">SUSPICIOUS</span>
            <span className="text-4xl font-black text-amber-500 block tracking-tight font-mono">{stats.suspicious_count}</span>
            <span className="text-[9px] text-amber-900/60 font-mono block mt-2">Operator verification</span>
          </div>

          <div className="cyber-card p-5 relative overflow-hidden glow-emerald">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <span className="text-[9px] text-emerald-400 font-mono uppercase tracking-widest block mb-1">BENIGN SAMPLES</span>
            <span className="text-4xl font-black text-emerald-500 block tracking-tight font-mono">{stats.benign_count}</span>
            <span className="text-[9px] text-emerald-900/60 font-mono block mt-2">Assets cleared</span>
          </div>

          <div className="cyber-card p-5 relative overflow-hidden glow-blue">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl"></div>
            <span className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest block mb-1">SYSTEM RISK</span>
            <span className="text-4xl font-black text-indigo-400 block tracking-tight font-mono">{Math.round(stats.avg_risk_score)}%</span>
            <span className="text-[9px] text-indigo-900/60 font-mono block mt-2">Overall Node Health</span>
          </div>
        </div>

        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="cyber-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity size={16} className="text-blue-500" />
              <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Threat Occurrence Trend Analysis
              </h2>
            </div>
            <div className="h-68">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0F172A" />
                  <XAxis dataKey="hour" stroke="#475569" fontSize={9} fontFamily="monospace" />
                  <YAxis stroke="#475569" fontSize={9} fontFamily="monospace" />
                  <Tooltip contentStyle={{ backgroundColor: '#090D1A', borderColor: '#1E293B', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="ThreatRatio" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorThreat)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="cyber-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Binary size={16} className="text-indigo-500" />
              <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Threat Classification Metrics
              </h2>
            </div>
            <div className="h-68">
              {threatTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={threatTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0F172A" />
                    <XAxis dataKey="name" stroke="#475569" fontSize={9} fontFamily="monospace" />
                    <YAxis stroke="#475569" fontSize={9} fontFamily="monospace" />
                    <Tooltip contentStyle={{ backgroundColor: '#090D1A', borderColor: '#1E293B', borderRadius: '12px' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {threatTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs font-mono tracking-widest uppercase">
                  NO ACTIVE INTRUSIONS TO PLOT
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Incident Timeline Grid */}
        <section className="cyber-card overflow-hidden">
          <div className="p-6 border-b border-slate-900 flex items-center gap-2.5">
            <Clock size={16} className="text-blue-500" />
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              REAL-TIME SECURITY INCIDENT LOGGING
            </h2>
          </div>

          <div className="overflow-x-auto">
            {logs.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-900 bg-[#090E1A]/60 text-slate-500">
                    <th className="p-4 font-bold tracking-widest">INCIDENT ID</th>
                    <th className="p-4 font-bold tracking-widest">THREAT CATEGORY</th>
                    <th className="p-4 font-bold tracking-widest">SEVERITY RATING</th>
                    <th className="p-4 font-bold tracking-widest">CLASSIFICATION</th>
                    <th className="p-4 font-bold tracking-widest">TIMESTAMP</th>
                    <th className="p-4 font-bold tracking-widest text-right">ACTION COMMANDS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {logs.map((log) => {
                    let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    let scoreColor = "text-emerald-400";
                    if (log.classification === 'malicious') {
                      badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
                      scoreColor = "text-red-500";
                    } else if (log.classification === 'suspicious') {
                      badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                      scoreColor = "text-amber-500";
                    }

                    return (
                      <tr key={log.id} className="hover:bg-blue-500/[0.02] transition-colors border-b border-slate-900/60">
                        <td className="p-4 text-slate-300 font-semibold font-mono">
                          {log.document_id ? `DOC_${log.id.slice(0, 8).toUpperCase()}` : `MANUAL_INPUT`}
                        </td>
                        <td className="p-4 text-slate-400 uppercase font-mono">
                          {log.analysis_type.replace("_", " ")}
                        </td>
                        <td className={`p-4 font-bold ${scoreColor}`}>
                          {log.risk_score}%
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold tracking-wider uppercase ${badgeColor}`}>
                            {log.classification}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(log.analyzed_at).toLocaleString()}
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2.5">
                          <button 
                            disabled={actionLoading === log.id}
                            onClick={() => handleDownloadReport(log.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[10px] font-bold"
                            title="Generate PDF Report"
                          >
                            {actionLoading === log.id ? (
                              <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <>
                                <Download size={10} />
                                <span>PDF_REPORT</span>
                              </>
                            )}
                          </button>
                          
                          {user?.role === 'Admin' && log.document_id && (
                            <button 
                              onClick={() => handleDeleteDoc(log.document_id)}
                              className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/30 text-red-500 border border-red-900/30 transition-all flex items-center justify-center cursor-pointer"
                              title="Purge Incident"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center text-slate-500 font-mono tracking-widest uppercase text-xs">
                No active threats analyzed yet. Ingest target logs to populate index nodes.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
