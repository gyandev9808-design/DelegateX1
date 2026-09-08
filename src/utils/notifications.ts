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
const DELETED_IDS_KEY = 'mun_deleted_notification_ids';

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

export function getDeletedNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.map((id: string) => String(id).toLowerCase().trim()));
    }
  } catch {}
  return new Set();
}

export function recordDeletedNotificationId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanId = id.toLowerCase().trim();
    const set = getDeletedNotificationIds();
    set.add(cleanId);
    if (cleanId.startsWith('notif_room_')) {
      set.add(cleanId.replace('notif_room_', ''));
    } else {
      set.add(`notif_room_${cleanId}`);
    }
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to record deleted notification ID', err);
  }
}

export function recordAllDeletedNotificationIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedNotificationIds();
    for (const id of ids) {
      const cleanId = id.toLowerCase().trim();
      set.add(cleanId);
      if (cleanId.startsWith('notif_room_')) {
        set.add(cleanId.replace('notif_room_', ''));
      } else {
        set.add(`notif_room_${cleanId}`);
      }
    }
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to record deleted notification IDs', err);
  }
}

export function isNotificationDeleted(id: string, roomCode?: string): boolean {
  const deleted = getDeletedNotificationIds();
  const cleanId = id.toLowerCase().trim();
  if (deleted.has(cleanId)) return true;
  if (roomCode) {
    const cleanCode = roomCode.toLowerCase().trim();
    if (deleted.has(cleanCode) || deleted.has(`notif_room_${cleanCode}`)) return true;
  }
  return false;
}

export function getStoredNotifications(): DelegateNotification[] {
  if (typeof window === 'undefined') return [];
  const deleted = getDeletedNotificationIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      // First visit initialization
      const initial = defaultStaticNotifications.filter((n) => !deleted.has(n.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((n) => !isNotificationDeleted(n.id, n.roomCode));
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredNotifications(notifications: DelegateNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    const deleted = getDeletedNotificationIds();
    const cleanList = notifications.filter((n) => !isNotificationDeleted(n.id, n.roomCode));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
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
  force?: boolean;
}): DelegateNotification | null {
  const cleanCode = room.code.toLowerCase().trim();
  const id = `notif_room_${cleanCode}`;
  const deleted = getDeletedNotificationIds();

  // If user permanently deleted this notification, don't re-create unless deliberately forced
  if (!room.force && (deleted.has(id) || deleted.has(cleanCode))) {
    return null;
  }

  // If forced, restore it from the deleted set
  if (room.force) {
    deleted.delete(id);
    deleted.delete(cleanCode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(deleted)));
    }
  }

  const current = getStoredNotifications();
  const meetingUrl = room.meetingUrl || formatMeetingUrl(cleanCode);

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
  const deleted = getDeletedNotificationIds();
  const current = getStoredNotifications();
  let modified = false;
  const list = [...current];

  rooms.forEach((room) => {
    const code = (room.code || room.id || '').toLowerCase().trim();
    if (!code) return;

    const notifId = `notif_room_${code}`;
    // Permanently deleted check
    if (deleted.has(notifId) || deleted.has(code)) {
      return;
    }

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
  const deleted = getDeletedNotificationIds();
  try {
    const res = await fetch('/api/notifications');
    if (!res.ok) return getStoredNotifications();
    const data = await res.json();
    if (Array.isArray(data.notifications)) {
      const local = getStoredNotifications();
      const localReadMap = new Map(local.map((n) => [n.id, n.read]));

      const validServerNotifs = data.notifications.filter(
        (sn: any) => !isNotificationDeleted(sn.id, sn.roomCode)
      );

      const merged: DelegateNotification[] = validServerNotifs.map((serverN: any) => ({
        ...serverN,
        read: localReadMap.has(serverN.id) ? localReadMap.get(serverN.id)! : Boolean(serverN.read),
      }));

      // Keep local notifications that aren't on server, if not deleted
      for (const loc of local) {
        if (!isNotificationDeleted(loc.id, loc.roomCode) && !merged.some((m) => m.id === loc.id)) {
          merged.push(loc);
        }
      }

      merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      saveStoredNotifications(merged);
      return merged;
    }
  } catch (e) {
    // Return local on network error
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
  recordDeletedNotificationId(id);
  const current = getStoredNotifications();
  const cleanId = id.toLowerCase().trim();
  const updated = current.filter(
    (n) =>
      n.id.toLowerCase().trim() !== cleanId &&
      n.roomCode?.toLowerCase().trim() !== cleanId &&
      `notif_room_${n.roomCode?.toLowerCase().trim()}` !== cleanId
  );
  saveStoredNotifications(updated);
}

export function clearAllNotifications(): void {
  const current = getStoredNotifications();
  const idsToPermanentlyDelete = [
    ...current.map((n) => n.id),
    ...current.filter((n) => n.roomCode).map((n) => n.roomCode!),
    ...current.filter((n) => n.roomCode).map((n) => `notif_room_${n.roomCode!.toLowerCase().trim()}`),
    'notif-rop-rules',
    'notif-ai-clarifier',
  ];
  recordAllDeletedNotificationIds(idsToPermanentlyDelete);
  saveStoredNotifications([]);
}

export function getUnreadNotificationCount(): number {
  const list = getStoredNotifications();
  return list.filter((n) => !n.read).length;
}
