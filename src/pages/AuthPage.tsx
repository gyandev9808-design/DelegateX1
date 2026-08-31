import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CloudflareCaptcha from '../components/CloudflareCaptcha';
import { useAuth } from '../context/AuthContext';
import {
  Globe2,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
  Send,
  Sparkles,
  LogOut,
  Flag,
  Clock,
  Inbox,
  RotateCcw,
} from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, login, register, oauthGoogle, forgotPassword, sendEmailCode, resetPassword, logout } = useAuth();

  // Determine initial mode
  const modeParam = searchParams.get('mode')?.toUpperCase();
  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'RESET'>(() => {
    if (modeParam === 'RESET' || tokenParam) return 'RESET';
    if (modeParam === 'FORGOT') return 'FORGOT';
    if (modeParam === 'REGISTER') return 'REGISTER';
    return 'LOGIN';
  });

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('United States');
  const [committee, setCommittee] = useState('UN Security Council (UNSC)');

  // Cloudflare Captcha States
  const [loginCaptchaVerified, setLoginCaptchaVerified] = useState(false);
  const [loginCaptchaToken, setLoginCaptchaToken] = useState<string | null>(null);
  const [regCaptchaVerified, setRegCaptchaVerified] = useState(false);
  const [regCaptchaToken, setRegCaptchaToken] = useState<string | null>(null);

  // Password Reset & Email Code State
  const [resetEmail, setResetEmail] = useState(emailParam || '');
  const [resetTokenInput, setResetTokenInput] = useState(tokenParam || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [emailCodeInfo, setEmailCodeInfo] = useState<{
    token: string;
    code: string;
    email: string;
    link: string;
    generatedAt: string;
    recipient: string;
  } | null>(null);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (tokenParam) {
      setMode('RESET');
      setResetTokenInput(tokenParam);
    }
    if (emailParam) {
      setEmail(emailParam);
      setResetEmail(emailParam);
    }
  }, [tokenParam, emailParam]);

  // Password strength calculation
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-cyan-400' };
    return { score: 4, label: 'Strong (Recommended)', color: 'bg-emerald-400' };
  };

  const currentStrength = calculatePasswordStrength(mode === 'RESET' ? newPassword : password);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!loginCaptchaVerified) {
      setFeedback({
        text: 'Please complete the Cloudflare security verification before signing in.',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success && res.user) {
      setFeedback({
        text: `Welcome back, ${res.user.name}! Authenticated with secure JWT session.`,
        type: 'success',
      });
      setTimeout(() => {
        if (res.user?.role === 'MASTER_ADMIN' || res.user?.role === 'ADMIN' || res.user?.role === 'CHAIR') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 700);
    } else {
      setFeedback({
        text: res.error || 'Invalid credentials. Please verify your email and password.',
        type: 'error',
      });
      setLoginCaptchaVerified(false);
    }
  };

  // Handle Register Submit (Delegates strictly)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!regCaptchaVerified) {
      setFeedback({
        text: 'Please complete the Cloudflare security verification before creating an account.',
        type: 'error',
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({ text: 'Passwords do not match. Please verify your confirmation password.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setFeedback({ text: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await register({
      name,
      email,
      password,
      role: 'DELEGATE',
      title: 'Distinguished Delegate',
      country,
      committee,
    });
    setLoading(false);

    if (res.success && res.user) {
      setFeedback({
        text: `Account created successfully for ${res.user.name}! Verified with secure Bcrypt password hash & JWT.`,
        type: 'success',
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } else {
      setFeedback({ text: res.error || 'Registration failed.', type: 'error' });
      setRegCaptchaVerified(false);
    }
  };

  // Handle Request/Regenerate Email Verification Code
  const handleRequestEmailCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFeedback(null);

    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail || !/^\S+@\S+\.\S+$/.test(targetEmail)) {
      setFeedback({ text: 'Please enter a valid email address to receive the verification code.', type: 'error' });
      return;
    }

    setIsRegeneratingCode(true);
    const res = await forgotPassword(targetEmail);
    setIsRegeneratingCode(false);

    if (res.success) {
      const timeStamp = res.generatedAt || new Date().toLocaleTimeString();

      setEmailCodeInfo({
        token: '',
        code: '',
        email: targetEmail,
        recipient: targetEmail,
        link: '',
        generatedAt: timeStamp,
      });
      setFeedback({
        text: `A fresh 6-digit verification code has been dispatched directly to ${targetEmail}. Please check your email inbox (and spam folder).`,
        type: 'info',
      });
    } else {
      setFeedback({ text: res.error || 'Failed to dispatch email verification code.', type: 'error' });
    }
  };

  // Handle Password Reset Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword !== confirmNewPassword) {
      setFeedback({ text: 'New passwords do not match. Please verify.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await resetPassword(resetTokenInput, newPassword, resetEmail || email);
    setLoading(false);

    if (res.success && res.user) {
      setFeedback({
        text: 'Password updated successfully! You are now logged in.',
        type: 'success',
      });
      setTimeout(() => {
        if (res.user?.role === 'MASTER_ADMIN' || res.user?.role === 'ADMIN' || res.user?.role === 'CHAIR') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 900);
    } else {
      setFeedback({ text: res.error || 'Password reset failed. Invalid or expired code.', type: 'error' });
    }
  };

  const handleGoogleOAuth = async () => {
    setLoading(true);
    const res = await oauthGoogle();
    setLoading(false);
    if (res.success && res.user) {
      setFeedback({
        text: `Authenticated via Google OAuth 2.0 as ${res.user.name} (${res.user.email}).`,
        type: 'success',
      });
      setTimeout(() => {
        if (res.user?.role === 'MASTER_ADMIN' || res.user?.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 700);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="delegate-page min-h-screen text-slate-100 pt-24 pb-16 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-4 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          {isAuthenticated && user && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Signed in as:</span>
              <span className="text-xs font-bold text-cyan-300 bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-0.5 rounded-full">
                {user.name}
              </span>
            </div>
          )}
        </div>

        {/* If user is logged in, show active session banner */}
        {isAuthenticated && user && (
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-black text-sm">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {user.name}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                      Active JWT Session
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{user.email} • {user.title || user.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-white/10">
              <button
                onClick={() => navigate(user.role === 'DELEGATE' ? '/dashboard' : '/admin')}
                className="flex-1 py-2 px-4 rounded-xl bg-emerald-400 text-slate-950 text-xs font-bold hover:bg-emerald-300 transition flex items-center justify-center gap-2"
              >
                <span>Continue to {user.role === 'DELEGATE' ? 'Delegate Dashboard' : 'Secretariat Console'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  logout();
                  setMode('LOGIN');
                }}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Switch Account
              </button>
            </div>
          </div>
        )}

        {/* Main Authentication Box */}
        <div className="delegate-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-500/20 overflow-hidden">
              <img src="/delegatex_logo.jpg" alt="DelegateX Logo" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {mode === 'LOGIN' && 'Sign In to DelegateX'}
              {mode === 'REGISTER' && 'Register Delegate Account'}
              {mode === 'FORGOT' && 'Email Verification & Reset'}
              {mode === 'RESET' && 'Set New Account Password'}
            </h1>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              {mode === 'LOGIN' && 'Sign in using your email, password, and Cloudflare security verification.'}
              {mode === 'REGISTER' && 'Create your diplomat delegate portfolio to participate in Model UN conferences.'}
              {mode === 'FORGOT' && 'Enter your email to receive a fresh verification code directly to your mailbox.'}
              {mode === 'RESET' && 'Enter your 6-digit verification code and choose a new password.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 rounded-xl bg-slate-950/80 p-1 border border-white/10 text-xs font-semibold">
            <button
              onClick={() => {
                setMode('LOGIN');
                setFeedback(null);
              }}
              className={`rounded-lg py-2 transition flex items-center justify-center gap-1.5 ${
                mode === 'LOGIN' ? 'bg-cyan-300 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => {
                setMode('REGISTER');
                setFeedback(null);
              }}
              className={`rounded-lg py-2 transition flex items-center justify-center gap-1.5 ${
                mode === 'REGISTER' ? 'bg-cyan-300 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Register</span>
            </button>
            <button
              onClick={() => {
                setMode('FORGOT');
                setFeedback(null);
              }}
              className={`rounded-lg py-2 transition flex items-center justify-center gap-1.5 ${
                mode === 'FORGOT' || mode === 'RESET' ? 'bg-cyan-300 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Email Code</span>
            </button>
          </div>

          {/* Feedback message banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : feedback.type === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
              {feedback.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              {feedback.type === 'info' && <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />}
              <span className="leading-relaxed">{feedback.text}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM WITH CLOUDFLARE CAPTCHA */}
          {mode === 'LOGIN' && (
            <div className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                      placeholder="e.g. delegate@example.com or gyan.dev9808@gmail.com"
                      className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Account Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('FORGOT');
                        setResetEmail(email);
                        setFeedback(null);
                      }}
                      className="text-[11px] text-cyan-300 hover:underline font-semibold"
                    >
                      Forgot password / Get Code?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Cloudflare Captcha in Sign In */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Shield className="h-3 w-3 text-cyan-400" />
                    Cloudflare Security Verification
                  </span>
                  <CloudflareCaptcha
                    isVerified={loginCaptchaVerified}
                    onVerify={(token) => {
                      setLoginCaptchaVerified(true);
                      setLoginCaptchaToken(token);
                    }}
                    onExpire={() => {
                      setLoginCaptchaVerified(false);
                      setLoginCaptchaToken(null);
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !loginCaptchaVerified}
                  className="w-full rounded-xl bg-cyan-300 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:bg-cyan-200 transition shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In with Verified Session</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OAuth 2.0 Single Sign-On */}
              <div className="pt-2">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-semibold uppercase">Or continue with</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleOAuth}
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl border border-white/15 bg-slate-900/80 hover:bg-slate-800/80 text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2.5 shadow"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google Single Sign-On</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER DELEGATE FORM WITH CLOUDFLARE CAPTCHA */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-400/20 text-xs text-slate-300 flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-cyan-300 shrink-0" />
                <span>Create your diplomatic delegate profile to enter live committee sessions and caucus rooms.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Full Diplomat Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>
                </div>

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
                      placeholder="e.g. delegate@example.com"
                      className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delegate Representation Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Country Representation
                  </label>
                  <div className="relative">
                    <Flag className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      required
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. France, Japan, Brazil"
                      className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Assigned Committee
                  </label>
                  <select
                    value={committee}
                    onChange={(e) => setCommittee(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2.5 text-xs sm:text-sm text-white focus:border-cyan-300 focus:outline-none"
                  >
                    <option value="UN Security Council (UNSC)">UN Security Council (UNSC)</option>
                    <option value="UN Human Rights Council (UNHRC)">UN Human Rights Council (UNHRC)</option>
                    <option value="General Assembly (DISEC)">General Assembly (DISEC)</option>
                    <option value="Crisis Simulation Committee">Crisis Simulation Committee</option>
                    <option value="UN Environment Programme (UNEP)">UN Environment Programme (UNEP)</option>
                  </select>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Password (Min 6 Chars)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Password Strength */}
              {password && (
                <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Security Strength:</span>
                    <span className={`font-bold ${currentStrength.score >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {currentStrength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    <div className={`rounded-full ${currentStrength.score >= 1 ? currentStrength.color : 'bg-slate-800'}`} />
                    <div className={`rounded-full ${currentStrength.score >= 2 ? currentStrength.color : 'bg-slate-800'}`} />
                    <div className={`rounded-full ${currentStrength.score >= 3 ? currentStrength.color : 'bg-slate-800'}`} />
                    <div className={`rounded-full ${currentStrength.score >= 4 ? currentStrength.color : 'bg-slate-800'}`} />
                  </div>
                </div>
              )}

              {/* Cloudflare Captcha in Register */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-cyan-400" />
                  Cloudflare Security Verification
                </span>
                <CloudflareCaptcha
                  isVerified={regCaptchaVerified}
                  onVerify={(token) => {
                    setRegCaptchaVerified(true);
                    setRegCaptchaToken(token);
                  }}
                  onExpire={() => {
                    setRegCaptchaVerified(false);
                    setRegCaptchaToken(null);
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !regCaptchaVerified}
                className="w-full rounded-xl bg-cyan-300 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:bg-cyan-200 transition shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Delegate Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: EMAIL VERIFICATION CODE (FRESH REGENERATION EVERY TIME) */}
          {mode === 'FORGOT' && (
            <div className="space-y-4">
              <form onSubmit={handleRequestEmailCode} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Your Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      required
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. delegate@example.com or gyan.dev9808@gmail.com"
                      className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    A fresh, single-use 6-digit security code will be generated and dispatched directly to this email address.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isRegeneratingCode}
                    className="flex-1 rounded-xl bg-cyan-300 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:bg-cyan-200 transition shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isRegeneratingCode ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Code to Email Directly</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Direct Email Delivery Notice */}
              {emailCodeInfo && (
                <div className="p-4 rounded-2xl border border-cyan-400/40 bg-slate-950/95 space-y-3 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Verification Code Sent</span>
                        <span className="text-[11px] text-emerald-400 font-mono">Dispatched to {emailCodeInfo.recipient}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                      {emailCodeInfo.generatedAt}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 space-y-3 text-xs">
                    <p className="text-slate-300 leading-relaxed">
                      We have sent a single-use 6-digit security code directly to your email address. Please open your email inbox, copy the code, and enter it below.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setMode('RESET')}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-slate-950 text-xs font-bold transition text-center shadow"
                      >
                        Enter 6-Digit Code & Set Password →
                      </button>

                      {/* Regenerate Fresh Code Button */}
                      <button
                        type="button"
                        onClick={() => handleRequestEmailCode()}
                        disabled={isRegeneratingCode}
                        className="py-2 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <RotateCcw className={`h-3.5 w-3.5 text-cyan-300 ${isRegeneratingCode ? 'animate-spin' : ''}`} />
                        <span>Resend Code</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('RESET')}
                  className="text-xs text-slate-400 hover:text-cyan-300 underline font-medium"
                >
                  Already have a 6-digit verification code? Enter new password here →
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: RESET PASSWORD (SET NEW PASSWORD) */}
          {mode === 'RESET' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  6-Digit Verification Code / Reset Token
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    required
                    type="text"
                    value={resetTokenInput}
                    onChange={(e) => setResetTokenInput(e.target.value)}
                    placeholder="Enter 6-digit code sent to your email"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  New Password (Min 6 Chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    required
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    required
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Security Strength:</span>
                    <span className={`font-bold ${currentStrength.score >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {currentStrength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    <div className={`rounded-full ${currentStrength.score >= 1 ? currentStrength.color : 'bg-slate-800'}`} />
                    <div className={`rounded-full ${currentStrength.score >= 2 ? currentStrength.color : 'bg-slate-800'}`} />
                    <div className={`rounded-full ${currentStrength.score >= 3 ? currentStrength.color : 'bg-slate-800'}`} />
                    <div className={`rounded-full ${currentStrength.score >= 4 ? currentStrength.color : 'bg-slate-800'}`} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('FORGOT')}
                  className="text-xs text-cyan-300 hover:underline font-semibold"
                >
                  ← Request a New Code
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-400 px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="border-t border-white/10 pt-4 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              {mode === 'LOGIN' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('REGISTER');
                      setFeedback(null);
                    }}
                    className="text-cyan-300 hover:underline font-semibold"
                  >
                    Register Delegate
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    onClick={() => {
                      setMode('LOGIN');
                      setFeedback(null);
                    }}
                    className="text-cyan-300 hover:underline font-semibold"
                  >
                    Sign in here
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setMode('FORGOT');
                setFeedback(null);
              }}
              className="text-cyan-300 hover:underline font-semibold"
            >
              Email Security Code
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
