import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'MASTER_ADMIN' | 'ADMIN' | 'CHAIR' | 'DELEGATE';
  title?: string;
  country?: string;
  committee?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isChair: boolean;
  isMasterAdmin: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; user?: User }>;
  oauthGoogle: (email?: string, name?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  sendEmailCode: (email: string, purpose?: string) => Promise<{
    success: boolean;
    error?: string;
    code?: string;
    token?: string;
    generatedAt?: string;
    previewInfo?: {
      subject: string;
      recipient: string;
      verificationCode: string;
      timestamp: string;
    };
  }>;
  forgotPassword: (email: string) => Promise<{
    success: boolean;
    error?: string;
    resetToken?: string;
    resetCode?: string;
    generatedAt?: string;
    previewInfo?: {
      subject: string;
      resetLink: string;
      verificationCode: string;
      recipient: string;
      timestamp: string;
    };
  }>;
  verifyResetToken: (tokenOrCode: string, email?: string) => Promise<{ success: boolean; error?: string; email?: string; token?: string }>;
  resetPassword: (
    tokenOrCode: string,
    newPassword: string,
    email?: string
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mun_jwt_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify session on load - DO NOT auto-login as Secretariat or any user without valid verified token
  useEffect(() => {
    const storedToken = localStorage.getItem('mun_jwt_token');

    if (storedToken) {
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Invalid token');
        })
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('mun_user_role', data.user.role);
            localStorage.setItem('mun_user_email', data.user.email);
            localStorage.setItem('mun_user_name', data.user.name);
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('mun_jwt_token');
          }
        })
        .catch(() => {
          // Token expired or invalid - clear session completely
          localStorage.removeItem('mun_jwt_token');
          localStorage.removeItem('mun_user_role');
          localStorage.removeItem('mun_user_email');
          localStorage.removeItem('mun_user_name');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Unauthenticated state by default
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  }, []);

  const saveAuthSession = (authToken: string, authUser: User) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem('mun_jwt_token', authToken);
    localStorage.setItem('mun_user_name', authUser.name);
    localStorage.setItem('mun_user_email', authUser.email);
    localStorage.setItem('mun_user_role', authUser.role);
  };

  const login = async (email: string, password = 'Secretariat2026!') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed.' };
      }

      saveAuthSession(data.token, data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error. Please try again.' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Registration failed.' };
      }

      saveAuthSession(resData.token, resData.user);
      return { success: true, user: resData.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration connection failed.' };
    }
  };

  const oauthGoogle = async (email?: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/oauth-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || 'gyan.dev9808@gmail.com',
          name: name || 'Gyan Dev',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'OAuth authentication failed.' };
      }

      saveAuthSession(data.token, data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'OAuth error.' };
    }
  };

  const sendEmailCode = async (email: string, purpose = 'Verification') => {
    try {
      const res = await fetch('/api/auth/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to dispatch email verification code.' };
      }
      return {
        success: true,
        code: data.code,
        token: data.token,
        generatedAt: data.generatedAt,
        previewInfo: data.previewInfo,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error sending email code.' };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to generate password reset request.' };
      }
      return {
        success: true,
        resetToken: data.resetToken,
        resetCode: data.resetCode,
        generatedAt: data.generatedAt,
        previewInfo: data.previewInfo,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset request failed.' };
    }
  };

  const verifyResetToken = async (tokenOrCode: string, email?: string) => {
    try {
      const res = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenOrCode.length > 10 ? tokenOrCode : undefined,
          code: tokenOrCode.length <= 10 ? tokenOrCode : undefined,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid or expired reset token.' };
      }
      return { success: true, email: data.email, token: data.token };
    } catch (err: any) {
      return { success: false, error: err.message || 'Token verification failed.' };
    }
  };

  const resetPassword = async (tokenOrCode: string, newPassword: string, email?: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenOrCode.length > 10 ? tokenOrCode : undefined,
          code: tokenOrCode.length <= 10 ? tokenOrCode : undefined,
          newPassword,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update password.' };
      }

      if (data.token && data.user) {
        saveAuthSession(data.token, data.user);
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset error.' };
    }
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('mun_jwt_token');
    localStorage.removeItem('mun_user_name');
    localStorage.removeItem('mun_user_email');
    localStorage.removeItem('mun_user_role');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isMasterAdmin = user?.role === 'MASTER_ADMIN' || user?.email === 'gyan.dev9808@gmail.com';
  const isAdmin = isMasterAdmin || user?.role === 'ADMIN' || (user?.email?.includes('admin') ?? false);
  const isChair = isAdmin || user?.role === 'CHAIR';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        isChair,
        isMasterAdmin,
        login,
        register,
        oauthGoogle,
        sendEmailCode,
        forgotPassword,
        verifyResetToken,
        resetPassword,
        logout,
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
