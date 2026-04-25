// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserRole = 'patient' | 'caregiver';

type AuthContextType = {
  isBootstrapping: boolean;
  isLoggedIn: boolean;
  role: UserRole | null;
  login: (role: UserRole, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
};

const STORAGE_KEY = 'nh_auth_session_v1';

const PIN_BY_ROLE: Record<UserRole, string> = {
  patient: '1111',
  caregiver: '2222',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Fallback to in-memory auth state only.
  }
}

async function safeRemoveItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Fallback to in-memory auth state only.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await safeGetItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { role?: UserRole };
        if (parsed.role === 'patient' || parsed.role === 'caregiver') {
          setRole(parsed.role);
        }
      } catch {
        // Ignore corrupted storage or unavailable native module.
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const login = async (nextRole: UserRole, pin: string) => {
    if (PIN_BY_ROLE[nextRole] !== pin.trim()) return false;
    setRole(nextRole);
    await safeSetItem(STORAGE_KEY, JSON.stringify({ role: nextRole }));
    return true;
  };

  const logout = async () => {
    setRole(null);
    await safeRemoveItem(STORAGE_KEY);
  };

  const switchRole = (nextRole: UserRole) => {
    setRole(nextRole);
    safeSetItem(STORAGE_KEY, JSON.stringify({ role: nextRole }));
  };

  const value = useMemo<AuthContextType>(
    () => ({
      isBootstrapping,
      isLoggedIn: role !== null,
      role,
      login,
      logout,
      switchRole,
    }),
    [isBootstrapping, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}