'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { UserResponse, CreateUserPayload } from '@/types/api';
import {
  Users,
  Plus,
  ShieldOff,
  ShieldCheck,
  Ban,
  UserCheck,
  X,
  Loader2,
} from 'lucide-react';

const ROLES = ['ADMIN', 'MANAGER', 'AGENT', 'CUSTOMER'] as const;

// ─── Helper ──────────────────────────────────────────────────────────────────

function statusBadge(user: UserResponse) {
  if (user.isBanned)
    return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Banned</span>;
  if (!user.isActive)
    return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">Suspended</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-medium">Active</span>;
}

function roleBadge(role: string) {
  const colours: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    AGENT: 'bg-amber-100 text-amber-700',
    CUSTOMER: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colours[role] ?? 'bg-slate-100 text-slate-600'}`}>
      {role}
    </span>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────

interface CreateModalProps {
  token: string;
  onClose: () => void;
  onCreated: () => void;
}

function CreateUserModal({ token, onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState<CreateUserPayload>({
    email: '',
    password: '',
    role: 'AGENT',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/users', form, { headers: { Authorization: `Bearer ${token}` } });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to create user.'));
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof CreateUserPayload, label: string, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required && ' *'}</label>
      <input
        type={type}
        required={required}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Create User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {field('email', 'Email', 'email', true)}
          {field('password', 'Password', 'password', true)}
          {field('firstName', 'First Name')}
          {field('lastName', 'Last Name')}
          {field('phone', 'Phone')}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as CreateUserPayload['role'] }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { accessToken, isLoading: authLoading, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${accessToken}` };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<{ data: UserResponse[]; total: number }>('/users', { headers });
      setUsers(data.data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (authLoading || !accessToken) return;
    void loadUsers();
  }, [loadUsers, authLoading, accessToken]);

  const action = async (userId: string, endpoint: string) => {
    setActionLoading(userId + endpoint);
    try {
      await api.patch(`/users/${userId}/${endpoint}`, {}, { headers });
      await loadUsers();
    } catch {
      alert(`Action failed: ${endpoint}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.firstName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.lastName ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const canCreate = hasPermission('users:create');
  const canUpdate = hasPermission('users:update');
  const canDelete = hasPermission('users:delete');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: '#fff1eb' }}>
            <Users style={{ color: '#ef6030' }} size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Users</h1>
            <p className="text-sm text-stone-400">{users.length} total users</p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: 'linear-gradient(to right,#f97316,#ef6030)', boxShadow: '0 4px 12px rgba(239,96,48,0.3)' }}
          >
            <Plus size={16} />
            New User
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />

      {/* Error */}
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" size={32} style={{ color: '#ef6030' }} /></div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #ede9e4', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide" style={{ background: '#faf9f7', borderBottom: '1px solid #ede9e4', color: '#6b7280' }}>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Permissions</th>
                <th className="px-4 py-3 text-left">Joined</th>
                {(canUpdate || canDelete) && <th className="px-4 py-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-stone-400">No users found.</td></tr>
              )}
              {filtered.map((u) => {
                const busy = (ep: string) => actionLoading === u.id + ep;
                return (
                  <tr key={u.id} className="transition-colors hover:bg-stone-50" style={{ borderBottom: '1px solid #f3f0ec' }}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-800">{u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email}</p>
                      {(u.firstName || u.lastName) && <p className="text-xs text-stone-400">{u.email}</p>}
                    </td>
                    <td className="px-4 py-3">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3">{statusBadge(u)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-violet-100 text-violet-700 font-medium">
                        {u.permissions.length} atoms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canUpdate && u.isActive && !u.isBanned && (
                            <button
                              title="Suspend"
                              disabled={busy('suspend')}
                              onClick={() => void action(u.id, 'suspend')}
                              className="p-1.5 rounded-lg hover:bg-yellow-100 text-yellow-600 disabled:opacity-40"
                            >
                              {busy('suspend') ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                            </button>
                          )}
                          {canUpdate && !u.isActive && !u.isBanned && (
                            <button
                              title="Reactivate"
                              disabled={busy('reactivate')}
                              onClick={() => void action(u.id, 'reactivate')}
                              className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 disabled:opacity-40"
                            >
                              {busy('reactivate') ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                            </button>
                          )}
                          {canDelete && !u.isBanned && (
                            <button
                              title="Ban"
                              disabled={busy('ban')}
                              onClick={() => void action(u.id, 'ban')}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 disabled:opacity-40"
                            >
                              {busy('ban') ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                            </button>
                          )}
                          {canDelete && u.isBanned && (
                            <button
                              title="Unban"
                              disabled={busy('unban')}
                              onClick={() => void action(u.id, 'unban')}
                              className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 disabled:opacity-40"
                            >
                              {busy('unban') ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && accessToken && (
        <CreateUserModal token={accessToken} onClose={() => setShowCreate(false)} onCreated={loadUsers} />
      )}
    </div>
  );
}
