// client/src/pages/Audit.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest, useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { Terminal, Download, Search, ShieldCheck } from 'lucide-react';

export default function Audit() {
  const { activeOrg, role } = useAuthStore();
  const { addToast } = useToastStore();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/audit-logs');
      setLogs(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [activeOrg]);

  const handleExportCSV = () => {
    if (logs.length === 0) return addToast('No compliance logs available to export.', 'warning');
    
    // Construct CSV content
    const headers = ['Log ID', 'Action', 'Details,IP Address', 'Date/Time', 'Performed By', 'User Email'];
    const rows = logs.map(l => [
      l.id,
      l.action,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ipAddress || 'N/A',
      new Date(l.createdAt).toLocaleString(),
      l.userName || 'System',
      l.userEmail || 'system@billora.com'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `billora_audit_logs_${activeOrg?.slug || 'export'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Compliance ledger exported successfully!', 'success');
  };

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-xl" />
        <div className="h-48 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-brand-slate-400" />
          <input
            type="text"
            placeholder="Search by action or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white/50 dark:bg-brand-navy-950/40 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
          />
        </div>

        {/* Actions */}
        <button
          onClick={handleExportCSV}
          className="px-3.5 h-10 bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 font-bold text-xs rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-opacity self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Ledger</span>
        </button>

      </div>

      {/* Audit Table */}
      <div className="glass-card border border-brand-slate-200/50 dark:border-brand-slate-900 overflow-hidden shadow-md">
        <div className="p-4 border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand-teal-500" />
          <h2 className="text-sm font-bold font-outfit">Audit trail</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 bg-brand-slate-100/30 dark:bg-brand-navy-950/10">
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Action</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Details</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Performed By</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">IP Address</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Date/Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 hover:bg-brand-slate-200/10 dark:hover:bg-brand-slate-900/10 transition-colors last:border-none">
                  <td className="p-4 font-bold font-mono text-[11px] text-brand-teal-555 dark:text-brand-teal-400">{log.action}</td>
                  <td className="p-4 text-brand-slate-700 dark:text-brand-slate-300 font-medium">{log.details}</td>
                  <td className="p-4 text-brand-slate-600 dark:text-brand-slate-400">
                    <span className="font-semibold">{log.userName}</span>
                    <span className="text-[10px] text-brand-slate-400 block mt-0.5">{log.userEmail}</span>
                  </td>
                  <td className="p-4 font-mono text-brand-slate-500 text-[10px]">{log.ipAddress || '127.0.0.1'}</td>
                  <td className="p-4 text-brand-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-brand-slate-400">No matching audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
