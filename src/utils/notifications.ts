export interface DelegateNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'alert' | 'success' | 'ai';
  read: boolean;
  link?: string;
  roomCode?: string;
  createdAt: number;
}

const STORAGE_KEY = 'mun_delegate_notifications';

const defaultStaticNotifications: DelegateNotification[] = [
  {
    id: 'notif-rop-rules',
    title: 'THIMUN & HMUN RoP Protocol Synchronized',
    message: 'Parliamentary rules of procedure for Moderated and Unmoderated Caucuses are available on your console.',
    time: '1h ago',
    type: 'info',
    read: false,
    link: '/training',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'notif-ai-clarifier',
    title: 'AI Diplomatic Assistant Standing By',
    message: 'Use the AI Doubt Clarifier to formulate points of order, right of reply, and resolution clauses.',
    time: '2h ago',
    type: 'ai',
    read: true,
    link: '/ai-doubt-clarifier',
    createdAt: Date.now() - 7200000,
  },
];

export function getStoredNotifications(): DelegateNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStaticNotifications));
      return defaultStaticNotifications;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return defaultStaticNotifications;
  } catch {
    return defaultStaticNotifications;
  }
}

export function saveStoredNotifications(notifications: DelegateNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new Event('mun_notifications_updated'));
  } catch (err) {
    console.error('Failed to save notifications', err);
  }
}

export function addMeetingRoomNotification(room: {
  code: string;
  title: string;
  topic?: string;
}): DelegateNotification {
  const current = getStoredNotifications();
  const id = `notif_room_${room.code.toLowerCase().trim()}`;

  // Check if notification for this room code already exists
  const existingIndex = current.findIndex(
    (n) => n.id === id || n.roomCode?.toLowerCase() === room.code.toLowerCase()
  );

  const notification: DelegateNotification = {
    id,
    title: `Chamber Convened: ${room.title.trim()}`,
    message: `Secretariat has initialized room code: ${room.code}. Agenda: ${room.topic || 'General Committee Debate'}. Click to enter the chamber floor.`,
    time: 'Just now',
    type: 'alert',
    read: false,
    link: `/room/${room.code.toLowerCase().trim()}`,
    roomCode: room.code.toLowerCase().trim(),
    createdAt: Date.now(),
  };

  let updated: DelegateNotification[];
  if (existingIndex >= 0) {
    // Bring to top and mark unread with updated info
    updated = [notification, ...current.filter((_, i) => i !== existingIndex)];
  } else {
    updated = [notification, ...current];
  }

  saveStoredNotifications(updated);
  return notification;
}

export function syncActiveMeetingNotifications(
  rooms: Array<{ code?: string; id?: string; title: string; topic?: string; agenda?: string }>
): DelegateNotification[] {
  const current = getStoredNotifications();
  let modified = false;
  const list = [...current];

  rooms.forEach((room) => {
    const code = (room.code || room.id || '').toLowerCase().trim();
    if (!code) return;

    const notifId = `notif_room_${code}`;
    const exists = list.some((n) => n.id === notifId || n.roomCode?.toLowerCase() === code);

    if (!exists) {
      list.unshift({
        id: notifId,
        title: `Chamber Convened: ${room.title || 'Official Committee Session'}`,
        message: `Secretariat has initialized room code: ${code}. Agenda: ${room.topic || room.agenda || 'General Committee Debate'}. Click to enter floor.`,
        time: 'Active now',
        type: 'alert',
        read: false,
        link: `/room/${code}`,
        roomCode: code,
        createdAt: Date.now(),
      });
      modified = true;
    }
  });

  if (modified) {
    saveStoredNotifications(list);
  }
  return list;
}

export function markNotificationAsRead(id: string): void {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStoredNotifications(updated);
}

export function markAllNotificationsAsRead(): void {
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveStoredNotifications(updated);
}

export function deleteNotification(id: string): void {
  const current = getStoredNotifications();
  const updated = current.filter((n) => n.id !== id);
  saveStoredNotifications(updated);
}

export function clearAllNotifications(): void {
  saveStoredNotifications([]);
}

export function getUnreadNotificationCount(): number {
  const list = getStoredNotifications();
  return list.filter((n) => !n.read).length;
}
