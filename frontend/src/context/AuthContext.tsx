'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthUser, LoginCredentials, LoginResponse } from '@/types/auth';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Returns true if the user has the given permission atom */
  hasPermission: (atom: string) => boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_USER_KEY = 'auth_user';
const STORAGE_TOKEN_KEY = 'auth_token';
// Short-lived cookie used by Edge middleware for permission-aware routing.
const ACCESS_COOKIE = 'access-token';
// Long-lived session marker cookie (mirrors refresh-token lifetime: 7 days).
// Used by Edge middleware to defer to client-side refresh when the access
// token has already expired — without incorrectly redirecting to /login.
const SESSION_COOKIE = 'auth_session';
const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
const ACCESS_COOKIE_MAX_AGE = 900; // 15 minutes in seconds

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodeJwtUser(token: string): AuthUser {
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString(),
  ) as { sub: string; email: string; role: string; permissions: string[] };
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    permissions: payload.permissions,
  };
}

function persistSession(user: AuthUser, token: string): void {
  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
  } catch {
    // Private/incognito mode may throw — silently ignore
  }
  document.cookie = `${ACCESS_COOKIE}=${token}; path=/; max-age=${ACCESS_COOKIE_MAX_AGE}; samesite=strict`;
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; samesite=strict`;
}

function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  } catch {
    // ignore
  }
  document.cookie = `${ACCESS_COOKIE}=; path=/; max-age=0; samesite=strict`;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=strict`;
}

function loadStoredSession(): { user: AuthUser; token: string } | null {
  try {
    const rawUser = localStorage.getItem(STORAGE_USER_KEY);
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!rawUser || !token) return null;
    return { user: JSON.parse(rawUser) as AuthUser, token };
  } catch {
    return null;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshToken = useCallback(async () => {
    // The httpOnly refresh-token cookie is sent automatically by the browser
    const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
    const decoded = decodeJwtUser(data.accessToken);
    setAccessToken(data.accessToken);
    setUser(decoded);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    persistSession(decoded, data.accessToken);
  }, []);

  // On mount: restore from localStorage first (instant, no flash), then verify
  // via the refresh endpoint so the token is always fresh.
  useEffect(() => {
    const stored = loadStoredSession();
    if (stored) {
      setUser(stored.user);
      setAccessToken(stored.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    }

    void (async () => {
      try {
        await refreshToken();
      } catch {
        // Refresh failed — clear any stale stored data and treat as logged out
        clearSession();
        setUser(null);
        setAccessToken(null);
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    setAccessToken(data.accessToken);
    setUser(data.user);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    persistSession(data.user, data.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Server-side token revocation is best-effort.
      // Always clean up client state regardless of network/server errors.
    } finally {
      setAccessToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      clearSession();
    }
  }, []);

  const hasPermission = useCallback(
    (atom: string): boolean => {
      if (!user) return false;
      return user.permissions.includes(atom);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: !!user,
      hasPermission,
      login,
      logout,
      refreshToken,
    }),
    [user, accessToken, isLoading, hasPermission, login, logout, refreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

