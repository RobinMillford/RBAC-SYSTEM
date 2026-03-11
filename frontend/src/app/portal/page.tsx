'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Globe, ShieldCheck, FileText, PhoneCall, LayoutDashboard } from 'lucide-react';

const portalCards = [
  {
    icon: ShieldCheck,
    title: 'My Account',
    description: 'View and manage your account details, security settings, and preferences.',
    colour: 'bg-violet-100 text-violet-600',
  },
  {
    icon: FileText,
    title: 'My Requests',
    description: 'Track the status of your open support tickets and service requests.',
    colour: 'bg-blue-100 text-blue-600',
  },
  {
    icon: PhoneCall,
    title: 'Contact Support',
    description: 'Reach out to our support team for help with any issues or questions.',
    colour: 'bg-emerald-100 text-emerald-600',
  },
];

export default function CustomerPortalPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?from=/portal');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-violet-600 font-bold">
          <Globe size={20} />
          <span>Customer Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{user?.email}</span>
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'AGENT') && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-medium"
            >
              <LayoutDashboard size={14} />
              Staff Dashboard
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white px-6 py-14 text-center">
        <h1 className="text-3xl font-bold mb-3">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h1>
        <p className="text-violet-200 max-w-md mx-auto">
          Manage your account, track your requests, and get support — all in one place.
        </p>
      </div>

      {/* Cards */}
      <main className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {portalCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.colour}`}>
                <Icon size={22} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">{card.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{card.description}</p>
              </div>
              <button className="mt-auto text-sm text-violet-600 font-medium hover:underline text-left">
                Go →
              </button>
            </div>
          );
        })}
      </main>

      {/* Notice */}
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-700">
          <strong>Coming soon:</strong> Full customer portal features including ticket management, document uploads, and live chat support are under development.
        </div>
      </div>
    </div>
  );
}
