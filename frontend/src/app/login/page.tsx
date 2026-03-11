'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

/* ── Obliq brand logo ── */
function ObliqLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const textSize = size === 'sm' ? 'text-base' : 'text-xl';
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={clsx('flex items-center justify-center rounded-xl', iconSize)}
        style={{ background: 'linear-gradient(135deg,#f97316 0%,#ef6030 60%,#dc4820 100%)' }}
      >
        <div className="relative flex items-center justify-center">
          <div className="h-4 w-4 rounded-full bg-white/30" />
          <div className="absolute h-2 w-2 rounded-full bg-white" />
        </div>
      </div>
      <span className={clsx('font-bold tracking-tight text-stone-900', textSize)}>Obliq</span>
    </div>
  );
}

/* ── Wavy SVG background ── */
function WaveBackground() {
  return (
    <svg viewBox="0 0 800 820" xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="wbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#fde68a" />
          <stop offset="40%"  stopColor="#fb923c" />
          <stop offset="80%"  stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <rect width="800" height="820" fill="url(#wbg)" />
      <path d="M0 250 Q200 180 400 280 Q600 380 800 260 L800 0 L0 0 Z"         fill="rgba(255,200,100,0.35)" />
      <path d="M0 400 Q150 320 350 420 Q550 520 800 380 L800 200 Q600 340 400 240 Q200 140 0 260 Z" fill="rgba(255,160,60,0.30)" />
      <path d="M0 560 Q200 460 450 580 Q650 680 800 520 L800 360 Q600 500 380 400 Q200 320 0 420 Z" fill="rgba(240,100,30,0.25)" />
      <path d="M0 740 Q200 640 400 720 Q600 800 800 680 L800 540 Q650 680 430 600 Q220 520 0 600 Z" fill="rgba(200,50,30,0.20)" />
    </svg>
  );
}

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login }    = useAuth();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [rememberMe,   setRememberMe]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const redirectTo = searchParams.get('from') ?? '/dashboard';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ email, password });
      router.push(redirectTo);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Invalid credentials. Please try again.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#f8f6f3' }}>
      {/* ── Left panel ── */}
      <div className="flex flex-1 flex-col px-8 py-8 lg:px-16">
        {/* Logo */}
        <ObliqLogo />

        {/* Card — vertically centred */}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px] rounded-2xl bg-white px-8 py-10"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

            {/* Heading */}
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-bold text-stone-900">Login</h1>
              <p className="mt-1.5 text-sm text-stone-400">Enter your details to continue</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-700">
                  Email
                </label>
                <input
                  id="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 placeholder-stone-300 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password" type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 pr-11 text-sm text-stone-800 placeholder-stone-300 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-400 hover:text-stone-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input type="checkbox" checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-stone-300 accent-orange-500" />
                  <span className="text-sm text-stone-500">Remember me</span>
                </label>
                <button type="button" className="text-sm font-medium" style={{ color: '#ef6030' }}>
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={isLoading}
                className={clsx(
                  'flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-all active:scale-[0.98]',
                  isLoading ? 'cursor-not-allowed opacity-75' : 'hover:opacity-90',
                )}
                style={{
                  background: 'linear-gradient(to right,#f97316,#ef6030,#e05525)',
                  boxShadow: '0 6px 20px rgba(239,96,48,0.35)',
                }}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? 'Logging in…' : 'Log in'}
              </button>
            </form>

            {/* Sign up row */}
            <p className="mt-6 text-center text-sm text-stone-400">
              Don&apos;t have an account?{' '}
              <button type="button" className="font-semibold text-stone-800 hover:underline">
                Sign up
              </button>
            </p>

            {/* Demo hint */}
            <p className="mt-4 text-center text-xs text-stone-300">
              Demo: admin@rbac.dev · Admin@1234
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel – decorative ── */}
      <div className="relative hidden lg:block lg:flex-1 overflow-hidden">
        <WaveBackground />

        {/* Floating mock dashboard */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-[480px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(2px)' }}>
            <div className="flex" style={{ minHeight: '360px' }}>
              {/* Sidebar strip */}
              <div className="w-44 flex-shrink-0 p-4 space-y-1"
                style={{ background: 'rgba(253,252,251,0.97)' }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="h-5 w-5 rounded bg-indigo-500 flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-sm bg-white/80" />
                  </div>
                  <span className="text-xs font-bold text-stone-700">Overlay</span>
                </div>
                <div className="flex items-center gap-1.5 mb-3 rounded px-1.5 py-1">
                  <div className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ background: '#ef6030' }}>W</div>
                  <div>
                    <p className="text-[9px] font-semibold text-stone-700 leading-none">John&apos;s workspace</p>
                    <p className="text-[7px] text-stone-400">#W0124468</p>
                  </div>
                </div>
                {['Dashboard', 'Leads', 'Opportunities'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 rounded px-1.5 py-1">
                    <div className="h-2 w-2 rounded-sm bg-stone-300" />
                    <span className="text-[9px] text-stone-500">{item}</span>
                  </div>
                ))}
                <div className="rounded px-1.5 py-1 bg-stone-100/70">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-stone-400" />
                    <span className="text-[9px] font-semibold text-stone-600">Tasks</span>
                  </div>
                  {['Assignments', 'Calendar', 'Reminders'].map((sub) => (
                    <div key={sub} className="ml-3.5 mt-0.5">
                      <span className="text-[8px] text-stone-400">{sub}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 rounded px-1.5 py-1">
                  <div className="h-2 w-2 rounded-sm bg-stone-300" />
                  <span className="text-[9px] text-stone-500">Reports</span>
                </div>
                <div className="mt-3 border-t border-stone-100 pt-2">
                  <p className="text-[7px] uppercase tracking-wide text-stone-400 mb-1 px-1">Users</p>
                  {['Contacts', 'Messages'].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded px-1.5 py-0.5">
                      <span className="text-[9px] text-stone-500">{item}</span>
                      {item === 'Messages' && (
                        <span className="text-[7px] rounded-full bg-stone-200 px-1 text-stone-600">6</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-1 border-t border-stone-100 pt-2">
                  <p className="text-[7px] uppercase tracking-wide text-stone-400 mb-1 px-1">Other</p>
                  {['Configuration', 'Invoice'].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 rounded px-1.5 py-0.5">
                      <span className="text-[9px] text-stone-500">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-6">
                  <div className="flex items-center gap-1.5 rounded px-1.5 py-0.5">
                    <span className="text-[9px] text-stone-400">Help center</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded px-1.5 py-0.5">
                    <span className="text-[9px] text-stone-400">Settings</span>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1" style={{ background: 'rgba(255,255,255,0.98)' }}>
                <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                  <span className="text-xs font-bold text-stone-800">Tasks</span>
                  <span className="text-[10px] text-stone-400">⌕ Search…</span>
                </div>
                <div className="flex gap-3 border-b border-stone-100 px-4 py-2">
                  {['List', 'Kanban', 'Calendar'].map((t, i) => (
                    <span key={t} className={clsx('text-[9px] rounded-full px-2 py-0.5',
                      i === 0 ? 'bg-stone-800 text-white font-semibold' : 'text-stone-400')}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 px-4 py-2">
                  <div className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                  <span className="text-[9px] font-bold text-stone-700">Group 1</span>
                </div>
                {[
                  { title: 'Call about proposal',  client: 'Bluestone',   badge: 'Urgent', color: '#ef4444' },
                  { title: 'Send onboarding docs', client: 'Tech Ltd.',   badge: 'High',   color: '#f97316' },
                  { title: 'Follow up with Mira',  client: 'Omar Rahman', badge: 'Low',    color: '#22c55e' },
                  { title: 'Prepare pitch deck',   client: 'Jabed Ali',   badge: 'Medium', color: '#f59e0b' },
                ].map((task) => (
                  <div key={task.title}
                    className="flex items-center gap-2 border-b border-stone-50 px-4 py-1.5">
                    <input type="checkbox" className="h-2 w-2 accent-orange-500" readOnly />
                    <span className="flex-1 text-[9px] text-stone-600 truncate">{task.title}</span>
                    <span className="mr-2 hidden text-[8px] text-stone-400 xl:block">{task.client}</span>
                    <span className="rounded-full px-1.5 py-0.5 text-[7px] font-bold text-white"
                      style={{ background: task.color }}>
                      {task.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
