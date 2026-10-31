import React, { useState } from 'react';
import { X, Mail, Lock, User, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiResetPassword } from '../../services/api';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your name');
        await register(email, password, name);
      } else if (mode === 'forgot') {
        const res = await apiResetPassword(email, password);
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (type: 'admin' | 'viewer') => {
    if (type === 'admin') {
      setEmail('brightotoms@gmail.com');
      setPassword('admin1234');
      setMode('login');
    } else {
      setEmail('cinema.fan@cinepulse.io');
      setPassword('cinefan123');
      setName('Alex Rivera');
      setMode('login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#151C2B] border border-[#273144] rounded-2xl p-6 sm:p-8 shadow-2xl text-[#F5F5F7]">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#A3AAB8] hover:text-white hover:bg-[#1C2535] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#99001C] via-[#E50932] to-[#FF3358] mb-3 shadow-lg shadow-[#E50932]/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-white">
            {mode === 'login' && 'Welcome to CinePulse'}
            {mode === 'register' && 'Join CinePulse Cinema'}
            {mode === 'forgot' && 'Reset CinePulse Password'}
          </h2>
          <p className="text-xs text-[#A3AAB8] mt-1">
            {mode === 'login' && 'Sign in to access synchronized lists, continue watching & 4K streams.'}
            {mode === 'register' && 'Create your personal streaming account in seconds.'}
            {mode === 'forgot' && 'Enter your registered email to assign a new secure password.'}
          </p>
        </div>

        {/* Quick Demo Pre-fill Shortcuts */}
        <div className="mb-4 p-3 rounded-xl bg-[#1C2535]/80 border border-[#273144] flex items-center justify-between gap-2 text-xs">
          <span className="text-[#A3AAB8] font-medium">Quick sign in:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="px-2.5 py-1 rounded-lg bg-[#E50932]/20 border border-[#E50932]/40 text-[#E50932] hover:bg-[#E50932] hover:text-white transition font-semibold"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('viewer')}
              className="px-2.5 py-1 rounded-lg bg-[#273144] text-white hover:bg-[#37435B] transition font-medium"
            >
              Viewer
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#A3AAB8] mb-1">Your Name</label>
              <div className="flex items-center bg-[#101522] border border-[#273144] rounded-xl px-3.5 py-2.5 focus-within:border-[#E50932] transition">
                <User className="w-4 h-4 text-[#687386] shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-transparent px-2.5 text-xs text-white placeholder-[#687386] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#A3AAB8] mb-1">Email Address</label>
            <div className="flex items-center bg-[#101522] border border-[#273144] rounded-xl px-3.5 py-2.5 focus-within:border-[#E50932] transition">
              <Mail className="w-4 h-4 text-[#687386] shrink-0" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-transparent px-2.5 text-xs text-white placeholder-[#687386] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-[#A3AAB8]">
                {mode === 'forgot' ? 'New Password' : 'Password'}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-[#D6A85F] hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="flex items-center bg-[#101522] border border-[#273144] rounded-xl px-3.5 py-2.5 focus-within:border-[#E50932] transition">
              <Lock className="w-4 h-4 text-[#687386] shrink-0" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-transparent px-2.5 text-xs text-white placeholder-[#687386] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#E50932] hover:bg-[#cc082c] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#E50932]/25 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Processing...
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : mode === 'register' ? (
              'Create Account'
            ) : (
              'Set New Password'
            )}
          </button>
        </form>

        {/* Switch Mode Footer */}
        <div className="mt-6 text-center text-xs text-[#A3AAB8]">
          {mode === 'login' ? (
            <p>
              New to CinePulse?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-[#E50932] font-semibold hover:underline"
              >
                Sign up now
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-[#E50932] font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
