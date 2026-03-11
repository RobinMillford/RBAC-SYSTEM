import { Users, ShieldCheck, ScrollText, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Total Users',       icon: Users,       value: '—', color: '#6366f1' },
  { label: 'Permission Atoms',  icon: ShieldCheck,  value: '14', color: '#ef6030' },
  { label: 'Audit Events',      icon: ScrollText,   value: '—', color: '#22c55e' },
  { label: 'Active Leads',      icon: TrendingUp,   value: '—', color: '#f59e0b' },
];

export default function DashboardPage() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-400">
          Welcome back. Here&apos;s an overview of your RBAC system.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, icon: Icon, value, color }) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-5"
            style={{ border: '1px solid #ede9e4', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${color}18` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-sm text-stone-400">{label}</p>
                <p className="text-xl font-bold text-stone-800">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System status card */}
      <div
        className="mt-6 rounded-2xl bg-white p-6"
        style={{ border: '1px solid #ede9e4', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
      >
        <h2 className="mb-1 text-sm font-semibold text-stone-700">System Status</h2>
        <p className="text-sm text-stone-400">
          All services operational. JWT auth, rate limiting, and audit logging active.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm text-stone-500">API · Backend running</span>
        </div>
      </div>
    </div>
  );
}
