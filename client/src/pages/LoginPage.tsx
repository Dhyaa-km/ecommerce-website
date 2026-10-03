import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
        if (response?.status === 401) {
          setError('Invalid email or password.');
        } else if (response?.status === 403) {
          setError('Your account is deactivated. Please contact support or an admin.');
        } else if (response?.data?.message) {
          setError(response.data.message);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } else {
        setError('Network error. Failed to connect to server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-sky-50 text-sky-600 rounded-full mb-2">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-500">Sign in to your StoreCraft account</p>
        </div>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        <div className="text-center text-sm text-slate-600">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 transition">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
