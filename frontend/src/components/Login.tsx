'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { User } from '../types';
import { ShieldCheck, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

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
  'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition-all';

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
    <div className="flex min-h-screen w-full">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">VerifyBGC</span>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Secure Background<br />Verification Platform
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Streamline your candidate verification process with our comprehensive Aadhaar and PAN validation system.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Instant Verification</h3>
              <p className="text-zinc-400 text-sm">Real-time Aadhaar and PAN card validation</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Secure & Encrypted</h3>
              <p className="text-zinc-400 text-sm">Bank-grade encryption for sensitive data</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Detailed Reports</h3>
              <p className="text-zinc-400 text-sm">Comprehensive verification reports in PDF</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-950">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-black">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">VerifyBGC</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-zinc-400">
              {isLogin ? 'Enter your credentials to access your account' : 'Get started with your free account'}
            </p>
          </div>

          {serverError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {serverError}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLoginSubmit(onSubmitLogin)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-zinc-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="login-email"
                    {...registerLogin('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={`${inputClass} pl-11`}
                    aria-invalid={!!loginErrors.email}
                  />
                </div>
                {loginErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {loginErrors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="login-password"
                    {...registerLogin('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`${inputClass} pl-11 pr-11`}
                    aria-invalid={!!loginErrors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {loginErrors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    {...registerLogin('rememberMe')}
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-white focus:ring-2 focus:ring-zinc-500/20"
                  />
                  <span className="text-sm text-zinc-400">Remember me</span>
                </label>
                <button type="button" className="text-sm font-medium text-white hover:text-zinc-300">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-black border border-zinc-800 py-3 text-sm font-semibold text-white hover:bg-zinc-900 hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit(onSubmitSignup)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="signup-name" className="mb-2 block text-sm font-medium text-zinc-300">
                  Full name
                </label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input 
                    id="signup-name" 
                    {...registerSignup('name')} 
                    type="text" 
                    placeholder="John Doe"
                    className={`${inputClass} pl-11`} 
                    aria-invalid={!!signupErrors.name} 
                  />
                </div>
                {signupErrors.name && <p className="mt-1.5 text-xs text-red-600" role="alert">{signupErrors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-zinc-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input 
                    id="signup-email" 
                    {...registerSignup('email')} 
                    type="email" 
                    autoComplete="email" 
                    placeholder="you@example.com"
                    className={`${inputClass} pl-11`} 
                    aria-invalid={!!signupErrors.email} 
                  />
                </div>
                {signupErrors.email && <p className="mt-1.5 text-xs text-red-600" role="alert">{signupErrors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input 
                    id="signup-password" 
                    {...registerSignup('password')} 
                    type={showPassword ? 'text' : 'password'} 
                    autoComplete="new-password" 
                    placeholder="Create a strong password"
                    className={`${inputClass} pl-11 pr-11`} 
                    aria-invalid={!!signupErrors.password} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {signupErrors.password && <p className="mt-1.5 text-xs text-red-600" role="alert">{signupErrors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="signup-confirm" className="mb-2 block text-sm font-medium text-zinc-300">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input 
                    id="signup-confirm" 
                    {...registerSignup('confirmPassword')} 
                    type="password" 
                    autoComplete="new-password" 
                    placeholder="Confirm your password"
                    className={`${inputClass} pl-11`} 
                    aria-invalid={!!signupErrors.confirmPassword} 
                  />
                </div>
                {signupErrors.confirmPassword && <p className="mt-1.5 text-xs text-red-600" role="alert">{signupErrors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-black border border-zinc-800 py-3 text-sm font-semibold text-white hover:bg-zinc-900 hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create account'}
              </button>
            </form>
          )}

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button 
                type="button" 
                onClick={toggleMode} 
                className="font-semibold text-white hover:text-zinc-300 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-zinc-500">
            By continuing, you agree to our{' '}
            <button type="button" className="underline hover:text-zinc-400">Terms of Service</button>
            {' '}and{' '}
            <button type="button" className="underline hover:text-zinc-400">Privacy Policy</button>
          </p>
        </div>
      </div>
    </div>
  );
}
