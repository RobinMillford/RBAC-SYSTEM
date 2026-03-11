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

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session via the refresh cookie
  useEffect(() => {
    void (async () => {
      try {
        await refreshToken();
      } catch {
        // No active session – that's fine
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
    // Store token for the API interceptor
    api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    // Write a readable (non-httpOnly) cookie so Next.js Edge Middleware can decode claims
    document.cookie = `access-token=${data.accessToken}; path=/; max-age=900; samesite=strict`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      // Clear middleware cookie
      document.cookie = 'access-token=; path=/; max-age=0; samesite=strict';
    }
  }, []);

  const refreshToken = useCallback(async () => {
    // The httpOnly cookie is sent automatically by the browser
    const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
    setAccessToken(data.accessToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    // Refresh the middleware cookie
    document.cookie = `access-token=${data.accessToken}; path=/; max-age=900; samesite=strict`;

    // Decode payload to get user info (no sensitive data in payload, just sub/email/role/permissions)
    const payload = JSON.parse(
      Buffer.from(data.accessToken.split('.')[1], 'base64').toString(),
    ) as { sub: string; email: string; role: string; permissions: string[] };

    setUser({
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    });
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
