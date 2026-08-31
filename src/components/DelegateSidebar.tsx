import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Video,
  Radio,
  BookOpen,
  Bot,
  Sparkles,
  LogOut,
  X,
  Compass,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

interface DelegateSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DelegateSidebar({ isOpen, onClose }: DelegateSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const rawName = user?.name || localStorage.getItem('mun_user_name') || '';
  let userName = rawName.trim();
  if (!userName || /^\d+$/.test(userName) || userName.toLowerCase() === 'distinguished delegate') {
    if (user?.email) {
      const prefix = user.email.split('@')[0].replace(/[._\d]+/g, ' ').trim();
      if (prefix) {
        userName = prefix
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      } else {
        userName = 'Delegate';
      }
    } else {
      userName = 'Delegate';
    }
  }
  const userEmail = user?.email || localStorage.getItem('mun_user_email') || '';

  const delegateApps = [
    {
      to: '/dashboard',
      label: 'Overview & Hub',
      description: 'Progress, focus tasks & stats',
      icon: LayoutDashboard,
      badge: 'Active',
      color: 'text-cyan-300',
    },
    {
      to: '/meet',
      label: 'Live Video Meet',
      description: 'HD virtual committee chamber',
      icon: Video,
      badge: 'Live',
      color: 'text-blue-400',
    },
    {
      to: '/committee',
      label: 'Live Floor Timer',
      description: 'RoP speakers list & caucus timer',
      icon: Radio,
      badge: 'Floor',
      color: 'text-emerald-400',
    },
    {
      to: '/training',
      label: 'Training Academy',
      description: 'Rules of Procedure & syllabus',
      icon: BookOpen,
      badge: 'Guides',
      color: 'text-amber-400',
    },
    {
      to: '/ai-doubt-clarifier',
      label: 'AI Doubt Clarifier',
      description: 'Diplomatic AI rule clarifier',
      icon: Bot,
      badge: 'AI Help',
      color: 'text-purple-400',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-950/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Brand Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center space-x-3 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition group-hover:scale-105 shadow-md shadow-cyan-500/10 overflow-hidden">
              <img src="/delegatex_logo.jpg" alt="DelegateX" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-white">
                Delegate<span className="text-cyan-400">X</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Delegate Portal
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation / Apps Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                Delegate Apps
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300 font-mono">
                {delegateApps.length} Apps
              </span>
            </div>

            <nav className="space-y-1.5">
              {delegateApps.map((app) => {
                const Icon = app.icon;
                const active = isActive(app.to);
                return (
                  <Link
                    key={app.to}
                    to={app.to}
                    onClick={onClose}
                    className={`group flex items-center justify-between rounded-xl px-3.5 py-3 transition ${
                      active
                        ? 'bg-cyan-400/15 border border-cyan-400/30 text-white shadow-lg shadow-cyan-500/10'
                        : 'border border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                          active
                            ? 'border-cyan-400/40 bg-cyan-400/20 text-cyan-300'
                            : 'border-white/10 bg-white/5 text-slate-400 group-hover:border-white/20 group-hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className={`text-xs font-bold leading-none ${active ? 'text-cyan-300' : 'text-white'}`}>
                          {app.label}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-1">
                          {app.description}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        active
                          ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                          : 'bg-white/5 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {app.badge}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Meet Launcher Card */}
          <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-cyan-950/30 to-slate-950/60 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Direct Chamber Room</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Launch or join a live conference chamber room instantly.
            </p>
            <Link
              to="/meet"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-cyan-300 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition shadow-md shadow-cyan-500/20"
            >
              <span>Launch Live Meet</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* User Account & Sign Out Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-xs font-black text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate">{userEmail || 'Delegate'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
