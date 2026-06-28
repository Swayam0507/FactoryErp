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
    <div className="w-full max-w-md relative z-10">
      {/* Logo Card */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/30 mb-4 ring-1 ring-white/10">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">VivekBhai Industries</h1>
        <p className="text-zinc-400 text-sm mt-1.5 font-medium tracking-wide uppercase">Factory Management System</p>
      </div>

      {/* Login Card */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
          {resetMode ? 'Reset Password' : 'Sign In'}
        </h2>
        <p className="text-zinc-400 text-sm mb-8 font-medium">
          {resetMode
            ? 'Enter your email to receive a reset link.'
            : 'Enter your credentials to access the dashboard.'}
        </p>

        <form onSubmit={resetMode ? handleReset : handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-zinc-300 mb-2">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm shadow-inner"
                placeholder="admin@factory.com"
              />
            </div>
          </div>

          {/* Password */}
          {!resetMode && (
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-zinc-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm shadow-inner"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
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
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed mt-4 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {resetMode ? 'Send Reset Email' : 'Sign In'}
          </button>
        </form>

        {/* Toggle reset mode */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setResetMode((v) => !v)}
            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {resetMode ? '← Back to Sign In' : 'Forgot password?'}
          </button>
        </div>
      </div>

      <p className="text-center text-zinc-500 text-xs mt-8 font-medium tracking-wide">
        © {new Date().getFullYear()} VivekBhai Industries. All rights reserved.
      </p>
    </div>
  );
}
