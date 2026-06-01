import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { connectSocket } from '../services/socketService';
import type { LoginCredentials, RegisterCredentials, User } from '../types';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.success && response.user) {
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        localStorage.setItem('userId', response.user._id);
        if (response.token) {
          localStorage.setItem('token', response.token);
          // Connect socket only after new token is persisted
          connectSocket();
        }
        toast.success('Welcome back!', { duration: 2000 });
        navigate('/home');
        return { success: true };
      } else {
        toast.error(response.error || 'Login failed');
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.register(credentials);
      if (response.success && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        localStorage.setItem('userId', response.user._id);
        if (response.token) {
          localStorage.setItem('token', response.token);
          // Connect socket only after new token is persisted
          connectSocket();
        }
        toast.success('Account created!', { duration: 2000 });
        navigate('/preferences/setup');
        return { success: true };
      } else {
        toast.error(response.error || 'Registration failed');
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    toast.dismiss();
    authService.logout();
    localStorage.removeItem('userId');
    setUser(null);
    navigate('/');
    toast.success('Logged out', { duration: 2000 });
  };

  return {
    login,
    register,
    logout,
    isLoading,
    user,
  };
};



