import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuthStore } from '../store/authStore';

/**
 * useAuth
 * Encapsulates login, register, and logout flows.
 * Handles loading state, error display, and navigation after success.
 */
export function useAuth() {
  const { setAuth, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [success, setSuccess]   = useState('');

  const clearError = () => {
    setTimeout(() => setError(''), 1800);
  };

  const login = async (username: string, password: string) => {
    if (!username || !password) {
      setError('Fill in both fields');
      clearError();
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/users/login', { username, password });
      setAuth(res.data.token, {
        id:       res.data.id,
        uid:      res.data.uid,
        username: res.data.username,
      });
      // Brief delay so the user sees the "Signing in…" feedback
      setTimeout(() => navigate('/'), 900);
    } catch (err: unknown) {
      setLoading(false);
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Login failed';
      setError(msg);
      clearError();
    }
  };

  const register = async (username: string, password: string) => {
    if (!username || !password) {
      setError('Fill in both fields');
      clearError();
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/register', { username, password });
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      setLoading(false);
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Registration failed';
      setError(msg);
      clearError();
    }
  };

  const logout = () => {
    storeLogout();
    navigate('/login');
  };

  return { login, register, logout, loading, error, success };
}
