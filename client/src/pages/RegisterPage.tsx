import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, UserPlus, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      await register({ name: name.trim(), email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
        if (response?.status === 409) {
          setError('Email is already registered. Please sign in or use a different email.');
        } else if (response?.data?.message) {
          setError(response.data.message);
        } else {
          setError('Failed to create account. Please try again.');
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create an Account</h2>
          <p className="text-sm text-slate-500">Join StoreCraft today and start shopping</p>
        </div>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            leftIcon={<UserIcon className="w-4 h-4" />}
          />

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
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </form>

        <div className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700 transition">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
