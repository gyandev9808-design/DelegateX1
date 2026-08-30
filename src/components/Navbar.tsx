import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe2, BookOpen, LogIn, LayoutDashboard, Shield, Bot, Radio, Menu, X } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { to: '/training', label: 'Training', icon: BookOpen },
    { to: '/committee', label: 'Live Floor', icon: Radio },
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

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Link
          to="/auth"
          className="flex items-center gap-1.5 rounded-full bg-cyan-300 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:bg-cyan-200 active:scale-95"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Sign In</span>
        </Link>

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
