'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NavigationConfig, NavigationItem } from '@/types/auth';
import { LogOut, HelpCircle, Settings, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  navigationConfig: NavigationConfig;
}

/* ── Single nav row ── */
function NavRow({
  item,
  depth = 0,
}: {
  item: NavigationItem;
  depth?: number;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href ||
    (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
  const hasChildren = item.children && item.children.length > 0;
  const [open, setOpen] = useState(isActive);
  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={clsx(
            'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
            depth > 0 ? 'pl-7' : '',
            isActive ? 'bg-stone-100 text-stone-800 font-medium' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700',
          )}
        >
          {Icon && (
            <Icon className={clsx('h-4 w-4 shrink-0', isActive ? 'text-stone-600' : 'text-stone-400 group-hover:text-stone-500')} />
          )}
          <span className="flex-1 text-left">{item.label}</span>
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          )}
        </button>
        {open && (
          <div className="mt-0.5 ml-3 space-y-0.5 border-l border-stone-200 pl-2">
            {item.children!.map((child) => (
              <NavRow key={child.href + child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={clsx(
        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
        depth > 0 ? 'pl-4 py-1.5' : '',
        isActive
          ? 'bg-stone-100 text-stone-800 font-medium'
          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700',
      )}
    >
      {Icon && (
        <Icon
          className={clsx(
            'h-4 w-4 shrink-0 transition-colors',
            isActive ? 'text-stone-600' : 'text-stone-400 group-hover:text-stone-500',
          )}
        />
      )}
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge !== undefined && (
        <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
          {item.badge}
        </span>
      )}
      {item.showAdd && (
        <Plus className="h-3.5 w-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </Link>
  );
}

export default function Sidebar({ navigationConfig }: SidebarProps) {
  const { user, hasPermission, logout } = useAuth();
  const router = useRouter();

  /* Partition items into: main (no section), and grouped sections */
  const mainItems = navigationConfig.items.filter(
    (item) =>
      !item.section &&
      (!item.requiredPermission || hasPermission(item.requiredPermission)),
  );

  /* Build section map preserving insertion order */
  const sectionMap = new Map<string, NavigationItem[]>();
  for (const item of navigationConfig.items) {
    if (item.section && (!item.requiredPermission || hasPermission(item.requiredPermission))) {
      if (!sectionMap.has(item.section)) sectionMap.set(item.section, []);
      sectionMap.get(item.section)!.push(item);
    }
  }

  /* Initial of user name or email */
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  const displayName = user?.email ?? '';

  return (
    <aside
      className="flex h-screen w-60 flex-shrink-0 flex-col overflow-hidden"
      style={{
        background: '#fdfcfb',
        borderRight: '1px solid #ede9e4',
      }}
    >
      {/* ── Brand header ── */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          {/* Purple/indigo app icon */}
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500">
            <div className="h-3 w-3 rounded-sm bg-white/80" />
          </div>
          <span className="text-sm font-bold text-stone-800">Obliq</span>
        </div>
        {/* Collapse button hint */}
        <button className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="1" y="6.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="1" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* ── Workspace selector ── */}
      <div
        className="mx-3 mb-3 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-stone-100"
      >
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: '#ef6030' }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-stone-700">{displayName}</p>
          <p className="text-[10px] text-stone-400 capitalize">{user?.role?.toLowerCase()}</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {/* Main items (no section) */}
        {mainItems.map((item) => (
          <NavRow key={item.href + item.label} item={item} />
        ))}

        {/* Sectioned items */}
        {Array.from(sectionMap.entries()).map(([section, items]) => (
          <div key={section} className="mt-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              {section}
            </p>
            {items.map((item) => (
              <NavRow key={item.href + item.label} item={item} />
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 py-3 space-y-0.5" style={{ borderTop: '1px solid #ede9e4' }}>
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
        >
          <HelpCircle className="h-4 w-4 text-stone-400" />
          <span>Help center</span>
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
        >
          <Settings className="h-4 w-4 text-stone-400" />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => {
            void logout().then(() => router.replace('/login'));
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
        >
          <LogOut className="h-4 w-4 text-stone-400" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
