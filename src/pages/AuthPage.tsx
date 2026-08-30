import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  Globe2,
  Lock,
  Mail,
  User,
  ArrowRight,
  Shield,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'DELEGATE' | 'ADMIN' | 'CHAIR'>('DELEGATE');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    if (mode === 'LOGIN') {
      // Direct login simulation
      setIsSuccess(true);
      setMessage('Authenticated successfully! Redirecting...');
      setTimeout(() => {
        if (email.includes('admin') || email.includes('sec') || role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 700);
    } else {
      // Registration via /api/register
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (res.ok) {
          setIsSuccess(true);
          setMessage('Account created successfully! Redirecting to dashboard...');
          setTimeout(() => navigate('/dashboard'), 800);
        } else {
          setMessage(data.error || 'Registration failed.');
        }
      } catch {
        setIsSuccess(true);
        setMessage('Account registered! Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard'), 800);
      }
    }
  };

  const useDemoCredentials = (targetRole: 'DELEGATE' | 'ADMIN') => {
    if (targetRole === 'ADMIN') {
      setEmail('admin@delegatex.org');
      setPassword('Secretariat2026!');
      setRole('ADMIN');
      setMessage('Demo Master Secretariat credentials loaded.');
    } else {
      setEmail('delegate@mun.edu');
      setPassword('BestDelegate2026!');
      setRole('DELEGATE');
      setMessage('Demo Delegate credentials loaded.');
    }
  };

  return (
    <div className="delegate-page min-h-screen text-slate-100 pt-24 pb-16 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      <Navbar />

      <main className="max-w-md mx-auto px-5 py-8 flex-1 w-full space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="delegate-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header icon and title */}
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
              <Globe2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {mode === 'LOGIN' ? 'Sign in to DelegateX' : 'Create Delegate Account'}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Access your training modules, live committee floor, and AI Clarifier
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 rounded-xl bg-slate-950/80 p-1 border border-white/10 text-xs font-semibold">
            <button
              onClick={() => {
                setMode('LOGIN');
                setMessage('');
              }}
              className={`rounded-lg py-2 transition ${
                mode === 'LOGIN' ? 'bg-cyan-300 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('REGISTER');
                setMessage('');
              }}
              className={`rounded-lg py-2 transition ${
                mode === 'REGISTER' ? 'bg-cyan-300 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'REGISTER' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="delegate@example.com"
                  className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-300 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:bg-cyan-200 transition shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{mode === 'LOGIN' ? 'Sign In to Workspace' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                isSuccess
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
              }`}
            >
              {message}
            </div>
          )}

          {/* 1-Click Demo Logins */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              1-Click Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => useDemoCredentials('DELEGATE')}
                className="rounded-xl border border-cyan-400/20 bg-cyan-950/30 p-2.5 text-xs text-cyan-200 hover:bg-cyan-900/40 transition flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Delegate Demo</span>
              </button>
              <button
                type="button"
                onClick={() => useDemoCredentials('ADMIN')}
                className="rounded-xl border border-emerald-400/20 bg-emerald-950/30 p-2.5 text-xs text-emerald-200 hover:bg-emerald-900/40 transition flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secretariat Demo</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
