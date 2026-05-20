'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { User } from '../types';
import { ShieldCheck, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface LoginProps {
  onAuthSuccess: (user: User, token: string, remember: boolean) => void;
}

const inputClass =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

export default function Login({ onAuthSuccess }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    reset: resetSignupForm,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmitLogin = async (data: LoginFormValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const response = await api.post('/api/auth/login', { email: data.email, password: data.password });
      onAuthSuccess(response.data.user, response.data.token, data.rememberMe);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setServerError(err.response?.data?.error || 'Invalid credentials or connection failure.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSignup = async (data: RegisterFormValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const response = await api.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      onAuthSuccess(response.data.user, response.data.token, false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setServerError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setServerError(null);
    resetLoginForm();
    resetSignupForm();
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Background Verification</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLogin ? 'Sign in to your account' : 'Create an account'}
        </p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      )}

      {isLogin ? (
        <form onSubmit={handleLoginSubmit(onSubmitLogin)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="login-email"
                {...registerLogin('email')}
                type="email"
                autoComplete="email"
                className={`${inputClass} pl-10`}
                aria-invalid={!!loginErrors.email}
                aria-describedby={loginErrors.email ? 'login-email-error' : undefined}
              />
            </div>
            {loginErrors.email && (
              <p id="login-email-error" className="mt-1 text-xs text-red-600" role="alert">
                {loginErrors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="login-password"
                {...registerLogin('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${inputClass} pl-10 pr-10`}
                aria-invalid={!!loginErrors.password}
                aria-describedby={loginErrors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {loginErrors.password && (
              <p id="login-password-error" className="mt-1 text-xs text-red-600" role="alert">
                {loginErrors.password.message}
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              {...registerLogin('rememberMe')}
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignupSubmit(onSubmitSignup)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="signup-name" className="mb-1 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="signup-name" {...registerSignup('name')} type="text" className={`${inputClass} pl-10`} aria-invalid={!!signupErrors.name} />
            </div>
            {signupErrors.name && <p className="mt-1 text-xs text-red-600" role="alert">{signupErrors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="signup-email" {...registerSignup('email')} type="email" autoComplete="email" className={`${inputClass} pl-10`} aria-invalid={!!signupErrors.email} />
            </div>
            {signupErrors.email && <p className="mt-1 text-xs text-red-600" role="alert">{signupErrors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input id="signup-password" {...registerSignup('password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={inputClass} aria-invalid={!!signupErrors.password} />
            {signupErrors.password && <p className="mt-1 text-xs text-red-600" role="alert">{signupErrors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="signup-confirm" className="mb-1 block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input id="signup-confirm" {...registerSignup('confirmPassword')} type="password" autoComplete="new-password" className={inputClass} aria-invalid={!!signupErrors.confirmPassword} />
            {signupErrors.confirmPassword && <p className="mt-1 text-xs text-red-600" role="alert">{signupErrors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        <button type="button" onClick={toggleMode} className="font-medium text-slate-900 hover:underline">
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </p>
    </div>
  );
}
