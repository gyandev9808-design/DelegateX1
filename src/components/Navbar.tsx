import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe2,
  BookOpen,
  LogIn,
  LayoutDashboard,
  Shield,
  Bot,
  Radio,
  Video,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Crown,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { to: '/meet', label: 'Live Meet', icon: Video },
    { to: '/training', label: 'Training', icon: BookOpen },
    { to: '/committee', label: 'Floor Timer', icon: Radio },
    { to: '/ai-doubt-clarifier', label: 'AI Clarifier', icon: Bot },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin', label: 'Secretariat', icon: Shield },
  ];

  return (
    <header className="fixed left-1/2 top-4 z-50 flex h-14 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 items-center justify-between rounded-full border border-white/10 bg-slate-950/80 px-4 sm:px-6 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl transition-all">
      <Link to="/" className="flex items-center space-x-2.5 group">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition group-hover:scale-105 group-hover:border-cyan-400/70 shadow-md shadow-cyan-500/10">
          <Globe2 className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          Delegate<span className="text-emerald-400">X</span>
        </span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-300">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition text-xs font-semibold ${
                active
                  ? 'bg-white/10 text-cyan-300 border border-cyan-400/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? 'text-cyan-300' : 'text-slate-400'}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Action Buttons & User Profile */}
      <div className="flex items-center gap-2">
        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400/40 py-1 pl-1.5 pr-2.5 text-xs font-medium text-white transition hover:bg-white/10"
            >
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-black text-white bg-gradient-to-tr ${
                  user.role === 'MASTER_ADMIN'
                    ? 'from-cyan-500 to-blue-600'
                    : user.role === 'ADMIN'
                    ? 'from-amber-500 to-orange-600'
                    : user.role === 'CHAIR'
                    ? 'from-emerald-500 to-teal-600'
                    : 'from-indigo-500 to-cyan-600'
                }`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline-block font-semibold text-slate-200 truncate max-w-[100px]">
                {user.name.split(' ')[0]}
              </span>
              <span
                className={`hidden md:inline-block text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                  user.role === 'MASTER_ADMIN'
                    ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                    : user.role === 'ADMIN'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : user.role === 'CHAIR'
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-indigo-400/20 text-indigo-300 border border-indigo-400/30'
                }`}
              >
                {user.role === 'MASTER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Sec Admin' : user.role === 'CHAIR' ? 'Chair' : 'Delegate'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 top-10 mt-1 w-64 rounded-2xl border border-white/15 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl z-50 space-y-2">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{user.name}</span>
                    {user.role === 'MASTER_ADMIN' ? (
                      <Crown className="h-3.5 w-3.5 text-cyan-400" />
                    ) : user.role === 'ADMIN' ? (
                      <Shield className="h-3.5 w-3.5 text-amber-400" />
                    ) : user.role === 'CHAIR' ? (
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Globe2 className="h-3.5 w-3.5 text-indigo-400" />
                    )}
                  </p>
                  <p className="text-[11px] font-mono text-cyan-300 truncate">{user.email}</p>
                  <p className="text-[10px] text-slate-400">{user.title || user.role}</p>
                </div>

                <div className="space-y-1 text-xs">
                  {user.role === 'DELEGATE' ? (
                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition"
                    >
                      <LayoutDashboard className="h-4 w-4 text-cyan-400" />
                      <span>Delegate Dashboard</span>
                    </Link>
                  ) : (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition"
                    >
                      <Shield className="h-4 w-4 text-amber-400" />
                      <span>Secretariat Console</span>
                    </Link>
                  )}

                  <Link
                    to="/auth"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Account & Security Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                      navigate('/auth');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-500/10 transition text-left"
                  >
                    <LogOut className="h-4 w-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Link
              to="/auth"
              className="flex items-center gap-1.5 rounded-full bg-cyan-300 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:bg-cyan-200 active:scale-95"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          className="lg:hidden flex items-center justify-center h-8 w-8 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-2xl lg:hidden space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 text-cyan-400" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
