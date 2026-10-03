import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types/user';
import { LoginDto, RegisterDto } from '../types/auth';
import { authApi } from '../api/auth';
import {
  setAccessToken,
  setOnAuthFailure,
  refreshAccessToken,
  apiClient,
} from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logoutLocal = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await authApi.refresh();
      setAccessToken(data.accessToken);
      setUser(data.user);
    } catch {
      logoutLocal();
    }
  }, [logoutLocal]);

  useEffect(() => {
    setOnAuthFailure(() => {
      logoutLocal();
    });
  }, [logoutLocal]);

  // Silent authentication check on app initial load
  useEffect(() => {
    const initAuth = async () => {
      try {
        await refreshAccessToken();

        const { data } = await apiClient.get<{ user: User }>('/auth/me');
        setUser(data.user);
      } catch {
        logoutLocal();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [logoutLocal]);

  const login = async (credentials: LoginDto) => {
    const data = await authApi.login(credentials);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (data: RegisterDto) => {
    await authApi.register(data);
    // Auto-login after successful registration
    await login({ email: data.email, password: data.password });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      logoutLocal();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isLoading,
        login,
        register,
        logout,
        setUser,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
