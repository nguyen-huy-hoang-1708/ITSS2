import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { login as loginRequest, logout as logoutRequest, refreshSession as refreshSessionRequest, register as registerRequest } from '@/services/auth';
import type { AuthSession, LoginPayload, RegisterPayload, User } from '@/types/auth';
import { clearSession, getStoredToken, getStoredUser, saveSession } from '@/utils/storage';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
  syncSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const applySession = useCallback((session: AuthSession) => {
    setUser(session.user);
    setToken(session.token);
    saveSession(session);
  }, []);

  const syncSession = useCallback(async () => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();

    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
      return;
    }

    try {
      const session = await refreshSessionRequest();
      applySession(session);
    } catch {
      clearSession();
      setUser(null);
      setToken(null);
    }
  }, [applySession]);

  useEffect(() => {
    (async () => {
      await syncSession();
      setIsBootstrapping(false);
    })();
  }, [syncSession]);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const session = await loginRequest(payload);
    applySession(session);
  }, [applySession]);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    await registerRequest(payload);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
      setUser(null);
      setToken(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isBootstrapping,
    signIn,
    signUp,
    signOut,
    syncSession,
  }), [isBootstrapping, signIn, signOut, signUp, syncSession, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}