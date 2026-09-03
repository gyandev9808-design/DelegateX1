import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Check,
  X,
  Info,
  Sparkles,
  Clock,
  CheckCheck,
  Trash2,
  Copy,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DelegateNotification,
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  syncActiveMeetingNotifications,
} from '../utils/notifications';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationsPopover({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationsPopoverProps) {
  const [notifications, setNotifications] = useState<DelegateNotification[]>(() =>
    getStoredNotifications()
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const refreshList = useCallback(() => {
    // 1. Sync from local active meetings
    try {
      const savedMeetingsRaw = localStorage.getItem('mun_active_meetings');
      if (savedMeetingsRaw) {
        const savedMeetings = JSON.parse(savedMeetingsRaw);
        if (Array.isArray(savedMeetings) && savedMeetings.length > 0) {
          syncActiveMeetingNotifications(savedMeetings);
        }
      }
    } catch {}

    // 2. Fetch active rooms from server API
    fetch('/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.rooms) && data.rooms.length > 0) {
          const updated = syncActiveMeetingNotifications(data.rooms);
          setNotifications([...updated]);
          onUnreadCountChange?.(updated.filter((n) => !n.read).length);
        } else {
          const stored = getStoredNotifications();
          setNotifications(stored);
          onUnreadCountChange?.(stored.filter((n) => !n.read).length);
        }
      })
      .catch(() => {
        const stored = getStoredNotifications();
        setNotifications(stored);
        onUnreadCountChange?.(stored.filter((n) => !n.read).length);
      });
  }, [onUnreadCountChange]);

  useEffect(() => {
    refreshList();

    const handleUpdate = () => {
      const stored = getStoredNotifications();
      setNotifications(stored);
      onUnreadCountChange?.(stored.filter((n) => !n.read).length);
    };

    window.addEventListener('mun_notifications_updated', handleUpdate);
    window.addEventListener('mun_meetings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('mun_notifications_updated', handleUpdate);
      window.removeEventListener('mun_meetings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshList, onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen, refreshList]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    const updated = getStoredNotifications();
    setNotifications(updated);
    onUnreadCountChange?.(0);
  };

  const handleMarkRead = (id: string) => {
    markNotificationAsRead(id);
    const updated = getStoredNotifications();
    setNotifications(updated);
    onUnreadCountChange?.(updated.filter((n) => !n.read).length);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
    const updated = getStoredNotifications();
    setNotifications(updated);
    onUnreadCountChange?.(updated.filter((n) => !n.read).length);
  };

  const handleClearAll = () => {
    clearAllNotifications();
    setNotifications([]);
    onUnreadCountChange?.(0);
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getTypeIcon = (type: DelegateNotification['type']) => {
    switch (type) {
      case 'alert':
        return <Radio className="h-4 w-4 text-rose-400 animate-pulse" />;
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
                <span>Delegate Notifications</span>
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
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-3 max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Bell className="mx-auto h-8 w-8 opacity-30 mb-2" />
              <p className="text-xs">No notifications right now.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkRead(notif.id)}
                className={`group relative rounded-xl border p-3 transition text-left cursor-pointer ${
                  notif.read
                    ? 'border-white/5 bg-white/[0.02] opacity-80 hover:opacity-100 hover:bg-white/5'
                    : 'border-cyan-400/30 bg-cyan-950/25 shadow-sm shadow-cyan-500/10 hover:bg-cyan-950/40'
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

                    {/* Room Code Badge & Direct Action Link */}
                    {notif.roomCode && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-900 border border-cyan-400/30 px-2 py-1 text-[11px] font-mono text-cyan-300">
                          <span className="text-[10px] text-slate-400 uppercase font-sans">Code:</span>
                          <span className="font-bold">{notif.roomCode}</span>
                          <button
                            onClick={(e) => handleCopyCode(notif.roomCode!, e)}
                            className="ml-1 text-slate-400 hover:text-white transition"
                            title="Copy Room Code"
                          >
                            {copiedCode === notif.roomCode ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>

                        <Link
                          to={notif.link || `/room/${notif.roomCode}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400/15 border border-cyan-400/30 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-400/25 transition"
                        >
                          <span>Join Floor</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    )}

                    {!notif.roomCode && notif.link && (
                      <Link
                        to={notif.link}
                        onClick={onClose}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        <span>Open module</span>
                        <span>&rarr;</span>
                      </Link>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDelete(notif.id, e)}
                    title="Dismiss"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition shrink-0 cursor-pointer"
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
              onClick={handleClearAll}
              className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
}
