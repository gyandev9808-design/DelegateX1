export interface DelegateNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'alert' | 'success' | 'ai';
  read: boolean;
  link?: string;
  roomCode?: string;
  meetingUrl?: string;
  createdAt: number;
}

const STORAGE_KEY = 'mun_delegate_notifications';

export function formatMeetingUrl(roomCode: string): string {
  const clean = roomCode.toLowerCase().trim();
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/meet/${clean}`;
  }
  return `/meet/${clean}`;
}

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
  meetingUrl?: string;
}): DelegateNotification {
  const current = getStoredNotifications();
  const cleanCode = room.code.toLowerCase().trim();
  const id = `notif_room_${cleanCode}`;
  const meetingUrl = room.meetingUrl || formatMeetingUrl(cleanCode);

  // Check if notification for this room code already exists
  const existingIndex = current.findIndex(
    (n) => n.id === id || n.roomCode?.toLowerCase() === cleanCode
  );

  const notification: DelegateNotification = {
    id,
    title: `Chamber Convened: ${room.title.trim()}`,
    message: `Secretariat has initialized room code: ${cleanCode}. Agenda: ${room.topic || 'General Committee Debate'}. Meeting link is ready to join or copy.`,
    time: 'Just now',
    type: 'alert',
    read: false,
    link: `/meet/${cleanCode}`,
    roomCode: cleanCode,
    meetingUrl,
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
  rooms: Array<{ code?: string; id?: string; title: string; topic?: string; agenda?: string; meetingUrl?: string }>
): DelegateNotification[] {
  const current = getStoredNotifications();
  let modified = false;
  const list = [...current];

  rooms.forEach((room) => {
    const code = (room.code || room.id || '').toLowerCase().trim();
    if (!code) return;

    const notifId = `notif_room_${code}`;
    const directUrl = room.meetingUrl || formatMeetingUrl(code);
    const existingIndex = list.findIndex((n) => n.id === notifId || n.roomCode?.toLowerCase() === code);

    if (existingIndex === -1) {
      list.unshift({
        id: notifId,
        title: `Chamber Convened: ${room.title || 'Official Committee Session'}`,
        message: `Secretariat has initialized room code: ${code}. Agenda: ${room.topic || room.agenda || 'General Committee Debate'}. Direct link is live below.`,
        time: 'Active now',
        type: 'alert',
        read: false,
        link: `/meet/${code}`,
        roomCode: code,
        meetingUrl: directUrl,
        createdAt: Date.now(),
      });
      modified = true;
    } else {
      // Ensure meetingUrl and canonical link are up to date
      const item = list[existingIndex];
      if (!item.meetingUrl || item.meetingUrl !== directUrl) {
        list[existingIndex] = {
          ...item,
          link: `/meet/${code}`,
          roomCode: code,
          meetingUrl: directUrl,
        };
        modified = true;
      }
    }
  });

  if (modified) {
    saveStoredNotifications(list);
  }
  return list;
}

export async function fetchServerNotifications(): Promise<DelegateNotification[]> {
  try {
    const res = await fetch('/api/notifications');
    if (!res.ok) return getStoredNotifications();
    const data = await res.json();
    if (Array.isArray(data.notifications)) {
      const local = getStoredNotifications();
      const localReadMap = new Map(local.map((n) => [n.id, n.read]));

      const merged: DelegateNotification[] = data.notifications.map((serverN: any) => ({
        ...serverN,
        read: localReadMap.has(serverN.id) ? localReadMap.get(serverN.id)! : Boolean(serverN.read),
      }));

      // Also keep local notifications that are not on server
      for (const loc of local) {
        if (!merged.some((m) => m.id === loc.id)) {
          merged.push(loc);
        }
      }

      merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      saveStoredNotifications(merged);
      return merged;
    }
  } catch (e) {
    // Ignore error and return local
  }
  return getStoredNotifications();
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
