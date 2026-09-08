import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogIn, LogOut } from 'lucide-react';
import NotificationsPopover from './NotificationsPopover';
import { getUnreadNotificationCount } from '../utils/notifications';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => getUnreadNotificationCount());
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleUpdate = () => {
      setUnreadCount(getUnreadNotificationCount());
    };
    window.addEventListener('mun_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('mun_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <header className="fixed left-1/2 top-4 z-50 flex h-14 w-auto max-w-[95vw] -translate-x-1/2 items-center justify-between gap-3 sm:gap-4 rounded-full border border-white/10 bg-slate-950/85 px-4 sm:px-6 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl transition-all">
      {/* Brand Logo & Name */}
      <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group shrink-0">
        <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition group-hover:scale-105 group-hover:border-cyan-400/70 shadow-md shadow-cyan-500/10 overflow-hidden">
          <img src="/delegatex_logo.jpg" alt="DelegateX" className="h-full w-full object-cover" />
        </div>
        <span className="text-base sm:text-lg font-bold tracking-tight text-white">
          Delegate<span className="text-cyan-400">X</span>
        </span>
      </Link>

      <div className="h-4 w-px bg-white/15" />

      {/* Notifications Bar Bell Button */}
      <div className="relative">
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          title="Delegate Notifications Bar"
          aria-label="Delegate Notifications"
          className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:bg-white/10 hover:text-white transition cursor-pointer"
        >
          <Bell className="h-4 w-4 text-cyan-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-black text-slate-950 ring-2 ring-slate-950 animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        <NotificationsPopover
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          onUnreadCountChange={setUnreadCount}
        />
      </div>

      {/* Sign In / Auth Button */}
      {isAuthenticated && user ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/auth"
            className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400/40 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition"
            title="View Account Profile"
          >
            <div className="h-5 w-5 rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-[10px] font-bold text-cyan-300">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline max-w-[90px] truncate">{user.name || 'Account'}</span>
          </Link>
          <button
            onClick={logout}
            title="Sign Out"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-white/10 hover:border-rose-400/30 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <Link
          to="/auth"
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 transition shadow-md shadow-cyan-500/20"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Sign In</span>
        </Link>
      )}
    </header>
  );
}

