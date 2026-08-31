import React, { useState } from 'react';
import { Bell, Check, X, Info, AlertCircle, Sparkles, Clock, CheckCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface DelegateNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'alert' | 'success' | 'ai';
  read: boolean;
  link?: string;
}

const initialNotifications: DelegateNotification[] = [
  {
    id: 'notif-1',
    title: 'Secretariat Notice',
    message: 'Draft Resolution working papers for UNSC and DISEC are now accepting sponsor signatures.',
    time: '5m ago',
    type: 'info',
    read: false,
    link: '/training',
  },
  {
    id: 'notif-2',
    title: 'Live Floor Timer Active',
    message: 'GSL Speakers List is active on the Floor Timer with 90s individual speech limits.',
    time: '25m ago',
    type: 'alert',
    read: false,
    link: '/committee',
  },
  {
    id: 'notif-3',
    title: 'AI Doubt Clarifier Ready',
    message: 'Ask any questions regarding Points of Order, Parliamentary Inquiries, or Operative Clauses.',
    time: '1h ago',
    type: 'ai',
    read: false,
    link: '/ai-doubt-clarifier',
  },
  {
    id: 'notif-4',
    title: 'Profile Synchronized',
    message: 'Your delegate credentials have been verified and linked to your conference workspace.',
    time: '2h ago',
    type: 'success',
    read: true,
  },
];

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPopover({ isOpen, onClose }: NotificationsPopoverProps) {
  const [notifications, setNotifications] = useState<DelegateNotification[]>(initialNotifications);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getTypeIcon = (type: DelegateNotification['type']) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
      case 'ai':
        return <Sparkles className="h-4 w-4 text-cyan-400" />;
      case 'success':
        return <Check className="h-4 w-4 text-emerald-400" />;
      default:
        return <Info className="h-4 w-4 text-cyan-300" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:bg-transparent"
        onClick={onClose}
      />

      {/* Popover Panel */}
      <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl shadow-cyan-950/50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-400/30">
                    {unreadCount} new
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                title="Mark all as read"
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Bell className="mx-auto h-8 w-8 opacity-30 mb-2" />
              <p className="text-xs">No notifications right now.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`group relative rounded-xl border p-3 transition text-left cursor-pointer ${
                  notif.read
                    ? 'border-white/5 bg-white/[0.02] opacity-75 hover:opacity-100 hover:bg-white/5'
                    : 'border-cyan-400/30 bg-cyan-950/20 shadow-sm shadow-cyan-500/5 hover:bg-cyan-950/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{getTypeIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{notif.time}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

                    {notif.link && (
                      <Link
                        to={notif.link}
                        onClick={onClose}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        <span>Open app</span>
                        <span>&rarr;</span>
                      </Link>
                    )}
                  </div>

                  <button
                    onClick={(e) => deleteNotification(notif.id, e)}
                    title="Dismiss"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Committee updates synced</span>
            <button
              onClick={clearAll}
              className="text-slate-400 hover:text-rose-400 transition"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
}
