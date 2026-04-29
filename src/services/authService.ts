/**
 * Authentication Service
 * Handles all auth-related API calls and token management
 */

const API_URL = 'http://localhost:5001/api/auth';

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: 'player' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

class AuthService {
  /**
   * Sign up a new user
   */
  static async signup(
    username: string,
    email: string,
    password: string,
    fullName?: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username,
        email,
        password,
        fullName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return response.json();
  }

  /**
   * Log in user
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(): Promise<{ user: User }> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch current user');
    }

    return response.json();
  }

  /**
   * Log out user
   */
  static async logout(): Promise<void> {
    const token = localStorage.getItem('authToken');

    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }

    // Clear local storage regardless of API response
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  /**
   * Update user profile
   */
  static async updateProfile(fullName?: string, avatar?: string): Promise<{ user: User }> {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ fullName, avatar }),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return response.json();
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }
  }

  /**
   * Get stored token
   */
  static getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  /**
   * Get stored user info
   */
  static getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Set token and user in localStorage
   */
  static setAuth(token: string, user: User): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Clear auth data
   */
  static clearAuth(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}

export default AuthService;
