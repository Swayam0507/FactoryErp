'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Building2, Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
      router.push('/');
      router.refresh();
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email address first'); return; }
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) toast.error(error.message);
    else toast.success('Password reset email sent! Check your inbox.');
    setLoading(false);
    setResetMode(false);
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo Card */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">VivekBhai Industries</h1>
        <p className="text-slate-400 text-sm mt-1">Factory Management System</p>
      </div>

      {/* Login Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-1">
          {resetMode ? 'Reset Password' : 'Sign In'}
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          {resetMode
            ? 'Enter your email to receive a reset link.'
            : 'Enter your credentials to access the dashboard.'}
        </p>

        <form onSubmit={resetMode ? handleReset : handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                placeholder="admin@factory.com"
              />
            </div>
          </div>

          {/* Password */}
          {!resetMode && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {resetMode ? 'Send Reset Email' : 'Sign In'}
          </button>
        </form>

        {/* Toggle reset mode */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setResetMode((v) => !v)}
            className="text-sm text-blue-400 hover:text-blue-300 transition"
          >
            {resetMode ? '← Back to Sign In' : 'Forgot password?'}
          </button>
        </div>
      </div>

      <p className="text-center text-slate-600 text-xs mt-6">
        © {new Date().getFullYear()} VivekBhai Industries. All rights reserved.
      </p>
    </div>
  );
}
