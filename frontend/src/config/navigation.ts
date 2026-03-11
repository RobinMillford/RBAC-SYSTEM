import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  BarChart2,
  ScrollText,
  Settings,
  TrendingUp,
  CheckSquare,
  Calendar,
  Bell,
  ClipboardList,
} from 'lucide-react';
import { NavigationConfig } from '@/types/auth';

export const navigationConfig: NavigationConfig = {
  items: [
    // ── Main (no section header) ──
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Leads',
      href: '/dashboard/leads',
      icon: TrendingUp,
      requiredPermission: 'leads:view',
    },
    {
      label: 'Reports',
      href: '/dashboard/reports',
      icon: BarChart2,
      requiredPermission: 'reports:view',
    },
    {
      label: 'Tasks',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      children: [
        { label: 'Assignments', href: '/dashboard/tasks', icon: ClipboardList },
        { label: 'Calendar',    href: '/dashboard/tasks', icon: Calendar },
        { label: 'Reminders',  href: '/dashboard/tasks', icon: Bell },
      ],
    },
    // ── Users section ──
    {
      label: 'Users',
      href: '/dashboard/users',
      icon: Users,
      requiredPermission: 'users:read',
      section: 'Users',
      showAdd: true,
    },
    {
      label: 'Permissions',
      href: '/dashboard/permissions',
      icon: ShieldCheck,
      requiredPermission: 'permissions:read',
      section: 'Users',
    },
    // ── Other section ──
    {
      label: 'Audit Log',
      href: '/dashboard/audit',
      icon: ScrollText,
      requiredPermission: 'audit:read',
      section: 'Other',
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      requiredPermission: 'settings:manage',
      section: 'Other',
    },
  ],
};
