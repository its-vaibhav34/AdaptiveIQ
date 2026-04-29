import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService, { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (fullName?: string, avatar?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * Wraps app to provide authentication context
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First check localStorage
        const storedUser = AuthService.getStoredUser();
        const token = AuthService.getToken();

        if (token && storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);

          // Try to sync with server to ensure token is still valid
          try {
            const { user: freshUser } = await AuthService.getCurrentUser();
            setUser(freshUser);
          } catch (err) {
            console.warn('Token validation failed, clearing auth');
            AuthService.clearAuth();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: loginUser, token } = await AuthService.login(email, password);
      AuthService.setAuth(token, loginUser);
      setUser(loginUser);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string, fullName?: string) => {
    setIsLoading(true);
    try {
      const { user: signupUser, token } = await AuthService.signup(username, email, password, fullName);
      AuthService.setAuth(token, signupUser);
      setUser(signupUser);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (fullName?: string, avatar?: string) => {
    try {
      const { user: updatedUser } = await AuthService.updateProfile(fullName, avatar);
      AuthService.setAuth(AuthService.getToken()!, updatedUser);
      setUser(updatedUser);
    } catch (err) {
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const { user: freshUser } = await AuthService.getCurrentUser();
      setUser(freshUser);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
