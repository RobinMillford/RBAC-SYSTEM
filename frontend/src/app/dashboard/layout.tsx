'use client';

import Sidebar from '@/components/Sidebar';
import { navigationConfig } from '@/config/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f8f6f3' }}>
      <Sidebar navigationConfig={navigationConfig} />

      <main className="flex-1 overflow-y-auto">
        {/* Top header bar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
          style={{ background: '#f8f6f3', borderBottom: '1px solid #ede9e4' }}
        >
          <div />
          {/* Right-side header icons (placeholder) */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-stone-200" />
          </div>
        </div>

        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
