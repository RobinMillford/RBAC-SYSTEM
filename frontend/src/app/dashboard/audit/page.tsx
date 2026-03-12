'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { AuditLogEntry, PaginatedAuditLogs } from '@/types/api';
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

const ACTION_COLOURS: Record<string, string> = {
  PERMISSION_GRANT: 'bg-violet-100 text-violet-700',
  PERMISSION_CHANGE: 'bg-blue-100 text-blue-700',
  USER_CREATE: 'bg-emerald-100 text-emerald-700',
  USER_UPDATE: 'bg-amber-100 text-amber-700',
  USER_SUSPEND: 'bg-yellow-100 text-yellow-700',
  USER_REACTIVATE: 'bg-green-100 text-green-700',
  USER_BAN: 'bg-red-100 text-red-700',
  USER_UNBAN: 'bg-teal-100 text-teal-700',
};

function actionBadge(action: string) {
  const cls = ACTION_COLOURS[action] ?? 'bg-slate-100 text-slate-600';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{action.replace(/_/g, ' ')}</span>;
}

function PayloadCell({ payload }: { payload: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const short = JSON.stringify(payload).slice(0, 60);
  return (
    <div className="text-xs text-stone-500 font-mono">
      {expanded ? (
        <>
          <pre className="whitespace-pre-wrap break-all rounded p-2" style={{ background: '#faf9f7' }}>{JSON.stringify(payload, null, 2)}</pre>
          <button onClick={() => setExpanded(false)} className="mt-1 hover:underline" style={{ color: '#ef6030' }}>Collapse</button>
        </>
      ) : (
        <>
          <span>{short}{short.length >= 60 ? '…' : ''}</span>
          {short.length >= 60 && (
            <button onClick={() => setExpanded(true)} className="ml-1 hover:underline" style={{ color: '#ef6030' }}>Expand</button>
          )}
        </>
      )}
    </div>
  );
}

export default function AuditPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const LIMIT = 20;

  const headers = { Authorization: `Bearer ${accessToken}` };

  const loadLogs = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<PaginatedAuditLogs>(`/audit?page=${p}&limit=${LIMIT}`, { headers });
      setLogs(data.data);
      setTotal(data.total);
    } catch {
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (authLoading || !accessToken) return;
    void loadLogs(page);
  }, [loadLogs, page, authLoading, accessToken]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: '#f3f0ff' }}>
            <ClipboardList style={{ color: '#6366f1' }} size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Audit Log</h1>
            <p className="text-sm text-stone-400">{total} total entries</p>
          </div>
        </div>
        <button
          onClick={() => void loadLogs(page)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 rounded-xl transition-colors disabled:opacity-50 hover:bg-stone-100"
          style={{ border: '1px solid #ede9e4' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" size={32} style={{ color: '#ef6030' }} /></div>
      ) : (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #ede9e4', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide" style={{ background: '#faf9f7', borderBottom: '1px solid #ede9e4', color: '#6b7280' }}>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Actor</th>
                  <th className="px-4 py-3 text-left">Target ID</th>
                  <th className="px-4 py-3 text-left">Payload</th>
                  <th className="px-4 py-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">No audit logs found.</td></tr>
                )}
                {logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-stone-50" style={{ borderBottom: '1px solid #f3f0ec' }}>
                    <td className="px-4 py-3">{actionBadge(log.action)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-700 text-xs">{log.actor.email}</p>
                      <p className="text-xs text-stone-400">{log.actor.role}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-400 font-mono">{log.targetId ? log.targetId.slice(0, 8) + '…' : '—'}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <PayloadCell payload={log.payload} />
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm">
            <p className="text-stone-400">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-stone-100"
                style={{ border: '1px solid #ede9e4' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 rounded-lg text-stone-600 text-xs" style={{ background: '#f5f3f0' }}>
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-stone-100"
                style={{ border: '1px solid #ede9e4' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
