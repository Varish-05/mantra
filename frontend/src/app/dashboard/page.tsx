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
  Trash2, 
  Download, 
  AlertTriangle,
  Layers,
  Clock,
  UserCheck
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
    
    // Fetch profile and dashboards
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
    if (!confirm('Are you sure you want to delete this document and all associated embeddings?')) {
      return;
    }
    try {
      await api.deleteDocument(docId);
      // Refresh state
      const dashboardStats = await api.getDashboardStats();
      setStats(dashboardStats);
      const recentLogs = await api.getAnalysisLogs();
      setLogs(recentLogs);
    } catch (err: any) {
      alert(err.message || 'Access Denied: Only Admins can delete documents.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070A13]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono text-xs">SYNCHRONIZING SECURE TUNNELS...</p>
        </div>
      </div>
    );
  }

  // Formatting chart data
  const threatTypeData = Object.keys(stats.threat_types).map(key => ({
    name: key.toUpperCase().replace("_", " "),
    count: stats.threat_types[key]
  }));

  const chartColors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

  // Mock Trend Volume chart over past hours
  const trendData = [
    { hour: '08:00', Anomalies: 2, Volume: 15 },
    { hour: '10:00', Anomalies: 4, Volume: 32 },
    { hour: '12:00', Anomalies: 8, Volume: 50 },
    { hour: '14:00', Anomalies: 12, Volume: 65 },
    { hour: '16:00', Anomalies: 6, Volume: 42 },
    { hour: '18:00', Anomalies: 3, Volume: 24 },
  ];

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
            <a href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-blue-600/10 text-blue-400 font-medium text-sm transition-all border border-blue-500/10">
              <Layers size={16} />
              Dashboard
            </a>
            <a href="/upload" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium text-sm transition-all">
              <Upload size={16} />
              Ingestion Desk
            </a>
            <a href="/search" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium text-sm transition-all">
              <Search size={16} />
              Semantic Chat (RAG)
            </a>
          </nav>
        </div>

        {/* User context & log out */}
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

      {/* Main dashboard content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header banner */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Shield className="text-blue-500 animate-pulse" size={24} />
              Security Operations Command
            </h1>
            <p className="text-xs text-slate-400 font-mono uppercase mt-1">
              Active Threat Monitoring & Incident Isolation Console
            </p>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">TOTAL SCANS</span>
            <span className="text-3xl font-extrabold text-white block">{stats.total_documents}</span>
            <span className="text-[10px] text-slate-500 block mt-2">Active security logs</span>
          </div>

          <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">MALICIOUS</span>
            <span className="text-3xl font-extrabold text-red-500 block">{stats.malicious_count}</span>
            <span className="text-[10px] text-red-900/80 block mt-2">Immediate response required</span>
          </div>

          <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">SUSPICIOUS</span>
            <span className="text-3xl font-extrabold text-amber-500 block">{stats.suspicious_count}</span>
            <span className="text-[10px] text-amber-900/80 block mt-2">Under operator review</span>
          </div>

          <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">CLEAN SAMPLES</span>
            <span className="text-3xl font-extrabold text-emerald-500 block">{stats.benign_count}</span>
            <span className="text-[10px] text-emerald-900/80 block mt-2">Normal operations</span>
          </div>

          <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">AVG RISK RATING</span>
            <span className="text-3xl font-extrabold text-indigo-400 block">{Math.round(stats.avg_risk_score)}%</span>
            <span className="text-[10px] text-slate-500 block mt-2">Overall node severity score</span>
          </div>
        </div>

        {/* Charts area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-white mb-6 font-mono uppercase tracking-wider">
              Network Threat Activity Volume (24h)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="hour" stroke="#94A3B8" fontSize={10} />
                  <YAxis stroke="#94A3B8" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B' }} />
                  <Area type="monotone" dataKey="Anomalies" stroke="#3B82F6" fillOpacity={1} fill="url(#colorAnomalies)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-white mb-6 font-mono uppercase tracking-wider">
              Distribution by Threat Category
            </h2>
            <div className="h-64">
              {threatTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={threatTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                    <YAxis stroke="#94A3B8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {threatTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                  NO SCANNED THREAT CLASSES TO PLOT
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security logs table */}
        <section className="bg-[#131B2E] border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              Incidents Timeline Logging
            </h2>
          </div>

          <div className="overflow-x-auto">
            {logs.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0B0F19]/40 text-slate-400 font-mono">
                    <th className="p-4 font-semibold">Incident/File Target</th>
                    <th className="p-4 font-semibold">Log Category</th>
                    <th className="p-4 font-semibold">Risk Score</th>
                    <th className="p-4 font-semibold">Classifier Assessment</th>
                    <th className="p-4 font-semibold">Timestamp (UTC)</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {logs.map((log) => {
                    let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    if (log.classification === 'malicious') {
                      badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
                    } else if (log.classification === 'suspicious') {
                      badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    }

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/10 transition-colors">
                        <td className="p-4 font-semibold text-slate-200">
                          {log.document_id ? "Doc Target" : "Manual Input"}
                        </td>
                        <td className="p-4 font-mono text-slate-400 uppercase">
                          {log.analysis_type.replace("_", " ")}
                        </td>
                        <td className="p-4 font-bold text-indigo-400">
                          {log.risk_score}%
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold uppercase ${badgeColor}`}>
                            {log.classification}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(log.analyzed_at).toLocaleString()}
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button 
                            disabled={actionLoading === log.id}
                            onClick={() => handleDownloadReport(log.id)}
                            className="p-1.5 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 transition-all flex items-center justify-center gap-1"
                            title="Download Report"
                          >
                            {actionLoading === log.id ? (
                              <span className="w-3.5 h-3.5 border border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <>
                                <Download size={12} />
                                <span className="text-[10px]">PDF</span>
                              </>
                            )}
                          </button>
                          
                          {user?.role === 'Admin' && log.document_id && (
                            <button 
                              onClick={() => handleDeleteDoc(log.document_id)}
                              className="p-1.5 rounded bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/30 transition-all flex items-center justify-center"
                              title="Delete Incident Source"
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
              <div className="p-8 text-center text-slate-500 font-mono">
                No active threats analyzed yet. Use the Upload desk to ingest cybersecurity target files.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
