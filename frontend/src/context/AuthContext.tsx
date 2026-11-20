import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { UserProfile, ApiResponse } from '../types/api';

export type SystemRole = 'OWNER' | 'ADMIN' | 'SALESMAN' | 'PRODUCTION_SUPERVISOR' | 'ACCOUNTANT' | 'AUDITOR';

export interface AuthContextType {
  user: UserProfile | null;
  roles: SystemRole[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ redirectUrl: string }>;
  switchRole: (email: string) => Promise<{ redirectUrl: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: SystemRole | SystemRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Rehydrate session from localStorage
    try {
      const storedToken = localStorage.getItem('erp_token');
      const storedUser = localStorage.getItem('erp_user');
      const storedRoles = localStorage.getItem('erp_roles');
      const storedPerms = localStorage.getItem('erp_permissions');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
        setRoles(storedRoles ? JSON.parse(storedRoles) : []);
        setPermissions(storedPerms ? JSON.parse(storedPerms) : []);
      }
    } catch (e) {
      console.error('Failed to restore session from storage:', e);
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post<
      ApiResponse<{
        user: UserProfile;
        accessToken: string;
        refreshToken: string;
        redirectUrl: string;
      }>
    >('/auth/login', { email, password });

    const { user: userData, accessToken, refreshToken, redirectUrl } = response.data.data;

    // Persist session tokens & user metadata
    localStorage.setItem('erp_token', accessToken);
    localStorage.setItem('erp_refresh_token', refreshToken);
    localStorage.setItem('erp_user', JSON.stringify(userData));
    localStorage.setItem('erp_roles', JSON.stringify((userData as any).roles || []));
    localStorage.setItem('erp_permissions', JSON.stringify((userData as any).permissions || []));

    setUser(userData);
    setRoles(((userData as any).roles as SystemRole[]) || []);
    setPermissions(((userData as any).permissions as string[]) || []);

    return { redirectUrl: redirectUrl || '/' };
  };

  const switchRole = async (email: string) => {
    return login(email, 'DemoPass@2026');
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('erp_refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.warn('Logout API call returned error, clearing local tokens:', err);
    } finally {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_refresh_token');
      localStorage.removeItem('erp_user');
      localStorage.removeItem('erp_roles');
      localStorage.removeItem('erp_permissions');
      setUser(null);
      setRoles([]);
      setPermissions([]);
      window.location.href = '/login';
    }
  };

  const hasRole = (targetRoles: SystemRole | SystemRole[]): boolean => {
    if (roles.includes('OWNER')) return true; // Owner inherits all roles
    const checkList = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
    return roles.some((r) => checkList.includes(r));
  };

  const hasPermission = (permission: string): boolean => {
    if (roles.includes('OWNER')) return true; // Owner inherits all permissions
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        login,
        switchRole,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
