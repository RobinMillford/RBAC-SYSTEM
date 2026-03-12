'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { UserResponse } from '@/types/api';
import { ShieldCheck, ChevronRight, Loader2, Save, Lock } from 'lucide-react';

// All 14 permission atoms grouped for clarity
const ATOM_GROUPS: { label: string; atoms: string[] }[] = [
  { label: 'Users', atoms: ['users:read', 'users:create', 'users:update', 'users:delete'] },
  { label: 'Permissions', atoms: ['permissions:read', 'permissions:grant'] },
  { label: 'Leads', atoms: ['leads:view', 'leads:create', 'leads:edit', 'leads:delete'] },
  { label: 'Reports', atoms: ['reports:view', 'reports:export'] },
  { label: 'Audit', atoms: ['audit:read'] },
  { label: 'Settings', atoms: ['settings:manage'] },
];

export default function PermissionsPage() {
  const { accessToken, isLoading: authLoading, user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [selectedAtoms, setSelectedAtoms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

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

  const selectUser = (u: UserResponse) => {
    setSelectedUser(u);
    setSelectedAtoms(new Set(u.permissions));
    setSaved(false);
    setError('');
  };

  const toggleAtom = (atom: string) => {
    // Grant Ceiling: can only toggle atoms you hold yourself
    if (!currentUser?.permissions.includes(atom)) return;
    setSelectedAtoms((prev) => {
      const next = new Set(prev);
      if (next.has(atom)) { next.delete(atom); } else { next.add(atom); }
      return next;
    });
    setSaved(false);
  };

  const save = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.patch(
        `/users/${selectedUser.id}/permissions`,
        { atoms: Array.from(selectedAtoms) },
        { headers },
      );
      setSaved(true);
      await loadUsers();
      // Refresh the displayed user with latest permissions
      const fresh = users.find((u) => u.id === selectedUser.id);
      if (fresh) selectUser({ ...fresh, permissions: Array.from(selectedAtoms) });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to save permissions.'));
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('permissions:read')) {
    return (
      <div className="text-stone-500">You don&apos;t have permission to view this page.</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl" style={{ background: '#f3f0ff' }}>
          <ShieldCheck style={{ color: '#6366f1' }} size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-900">Permission Editor</h1>
          <p className="text-sm text-stone-400">Grant or revoke permission atoms per user</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User List */}
        <div className="md:col-span-1 rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #ede9e4', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #ede9e4', background: '#faf9f7' }}>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Select User</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={24} style={{ color: '#ef6030' }} /></div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              {users.map((u) => (
                <li key={u.id} style={{ borderBottom: '1px solid #f3f0ec' }}>
                  <button
                    onClick={() => selectUser(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50"
                    style={selectedUser?.id === u.id ? { background: '#fff1eb' } : {}}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">
                        {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email}
                      </p>
                      <p className="text-xs text-stone-400 truncate">{u.role} · {u.permissions.length} atoms</p>
                    </div>
                    <ChevronRight size={16} className="text-stone-300" style={selectedUser?.id === u.id ? { color: '#ef6030' } : {}} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Permission Toggles */}
        <div className="md:col-span-2">
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: 'white', border: '1px solid #ede9e4', color: '#a8a29e' }}>
              <ShieldCheck size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Select a user to edit their permissions</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #ede9e4', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #ede9e4' }}>
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    {selectedUser.firstName && selectedUser.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser.email}
                  </p>
                  <p className="text-xs text-stone-400">{selectedUser.email} · {selectedUser.role}</p>
                </div>
                {hasPermission('permissions:grant') && (
                  <button
                    onClick={() => void save()}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-xl transition-all disabled:opacity-50 hover:opacity-90"
                    style={{ background: 'linear-gradient(to right,#f97316,#ef6030)', boxShadow: '0 4px 12px rgba(239,96,48,0.3)' }}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                )}
              </div>

              {error && <p className="mx-6 mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              {saved && <p className="mx-6 mt-4 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">Permissions saved successfully.</p>}

              <div className="p-6 space-y-6">
                {ATOM_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">{group.label}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.atoms.map((atom) => {
                        const checked = selectedAtoms.has(atom);
                        const grantable = currentUser?.permissions.includes(atom);
                        return (
                          <label
                            key={atom}
                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                            style={{
                              border: checked ? '1px solid #fed7aa' : '1px solid #ede9e4',
                              background: checked ? '#fff7ed' : 'white',
                              opacity: !grantable ? 0.5 : 1,
                              cursor: !grantable ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!grantable || !hasPermission('permissions:grant')}
                              onChange={() => toggleAtom(atom)}
                              className="w-4 h-4 accent-orange-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-stone-700">{atom}</p>
                              {!grantable && (
                                <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                                  <Lock size={10} /> You don&apos;t hold this atom
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
