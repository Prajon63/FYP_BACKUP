import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { LoginCredentials, RegisterCredentials } from '../types';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.success && response.user) {
        // Store user data if needed
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success('Welcome back! Redirecting...');
        setTimeout(() => {
          navigate('/home');
        }, 1000);
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
        toast.success('Account created! Redirecting...');
        setTimeout(() => {
          navigate('/preferences');
        }, 1000);
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
    authService.logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return {
    login,
    register,
    logout,
    isLoading,
  };
};


