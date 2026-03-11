import { ShieldBan } from 'lucide-react';
import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center" style={{ background: '#f8f6f3' }}>
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: '#fff1eb', border: '1px solid #fcd9c6' }}>
        <ShieldBan className="h-10 w-10" style={{ color: '#ef6030' }} />
      </div>

      <h1 className="text-8xl font-black" style={{ color: '#ef6030' }}>403</h1>
      <h2 className="mt-2 text-2xl font-semibold text-stone-800">Access Denied</h2>
      <p className="mt-3 max-w-md text-base text-stone-400">
        You don&apos;t have the required permission to access this page. Contact
        your administrator to request access.
      </p>

      <Link
        href="/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.97]"
        style={{ background: 'linear-gradient(to right,#f97316,#ef6030)', boxShadow: '0 4px 14px rgba(239,96,48,0.3)' }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
