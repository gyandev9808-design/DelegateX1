import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: 'MASTER_ADMIN' | 'ADMIN' | 'CHAIR' | 'DELEGATE';
  title?: string;
  country?: string;
  committee?: string;
  passwordHash?: string;
  avatarColor?: string;
  createdAt: number;
}

export interface PasswordResetEntry {
  token: string;
  code: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

export interface Participant {
  id: string;
  name: string;
  role: 'DELEGATE' | 'CHAIR' | 'OBSERVER';
  country: string;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isSpeaking?: boolean;
  joinedAt: number;
  lastSeen?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderCountry?: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  recipientId?: string;
}

export interface SignalMessage {
  id: string;
  from: string;
  to: string;
  type: 'offer' | 'answer' | 'candidate';
  payload: any;
  timestamp: number;
}

export interface RoomState {
  id: string;
  title: string;
  committee: string;
  agenda: string;
  type: 'TRAINING' | 'COMMITTEE' | 'CRISIS';
  hostId: string;
  createdAt: number;
  chatDisabled: boolean;
  screenShareDisabled: boolean;
  isLocked?: boolean;
  speakersQueue: string[];
  currentSpeakerIndex: number;
  speechDuration: number;
  timeLeft: number;
  isTimerRunning: boolean;
  timerStartedAt?: number;
  participants: Participant[];
  messages: ChatMessage[];
  signals: SignalMessage[];
  breakouts: { id: string; name: string }[];
}

export const seedAccounts = [
  {
    id: 'admin_gyan_01',
    name: 'Gyan Dev',
    email: 'gyan.dev9808@gmail.com',
    role: 'MASTER_ADMIN' as const,
    title: 'Secretary-General & Master Admin',
    country: 'Secretariat Executive',
    committee: 'Executive Board & Security Council',
    avatarColor: 'from-cyan-500 to-blue-600',
    passwordPlain: 'AdminSecretariat2026!',
    createdAt: 1741250000000,
  },
  {
    id: 'admin_master_02',
    name: 'Master Secretariat Admin',
    email: 'admin@delegatex.org',
    role: 'MASTER_ADMIN' as const,
    title: 'Secretariat Executive Director',
    country: 'Secretariat Board',
    committee: 'All Committees',
    avatarColor: 'from-amber-500 to-orange-600',
    passwordPlain: 'Secretariat2026!',
    createdAt: 1741250000000,
  },
  {
    id: 'staff_sarah_03',
    name: 'Sarah Jenkins',
    email: 'sarah.eb@delegatex.org',
    role: 'CHAIR' as const,
    title: 'UNSC Committee President',
    country: 'United Kingdom (Dais)',
    committee: 'UN Security Council (UNSC)',
    avatarColor: 'from-emerald-500 to-teal-600',
    passwordPlain: 'ChairPassword2026!',
    createdAt: 1741250000000,
  },
  {
    id: 'staff_david_04',
    name: 'David Kim',
    email: 'david.sec@delegatex.org',
    role: 'ADMIN' as const,
    title: 'Conference Operations Director',
    country: 'Republic of Korea',
    committee: 'Conference Affairs',
    avatarColor: 'from-purple-500 to-indigo-600',
    passwordPlain: 'AdminPassword2026!',
    createdAt: 1741250000000,
  },
];

// In-Memory Fallbacks (used when DATABASE_URL is not set or during local preview)
const memUsers = new Map<string, StoredUser>();
const memResets = new Map<string, PasswordResetEntry>();
const memRooms = new Map<string, RoomState>();

// Pre-populate memory store with seed accounts
seedAccounts.forEach((acc) => {
  const passwordHash = bcrypt.hashSync(acc.passwordPlain, 10);
  memUsers.set(acc.email.toLowerCase(), {
    id: acc.id,
    name: acc.name,
    email: acc.email.toLowerCase(),
    role: acc.role,
    title: acc.title,
    country: acc.country,
    committee: acc.committee,
    avatarColor: acc.avatarColor,
    passwordHash,
    createdAt: acc.createdAt,
  });
});

const getConnectionString = (): string | undefined => {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
};

let dbInitialized = false;
let initPromise: Promise<void> | null = null;

function getSql() {
  const connStr = getConnectionString();
  if (!connStr) return null;
  return neon(connStr);
}

export async function ensureDb(): Promise<void> {
  if (dbInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const sql = getSql();
    if (!sql) {
      console.log('ℹ️ [Database] Running with in-memory store. Set DATABASE_URL to connect to your Vercel Neon Postgres database.');
      dbInitialized = true;
      return;
    }

    try {
      console.log('🔄 [Database] Connecting to Neon Postgres on Vercel...');
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL,
          title TEXT,
          country TEXT,
          committee TEXT,
          password_hash TEXT,
          avatar_color TEXT,
          created_at BIGINT NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS password_resets (
          token TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          email TEXT NOT NULL,
          expires_at BIGINT NOT NULL,
          used BOOLEAN DEFAULT FALSE
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS meeting_rooms (
          id TEXT PRIMARY KEY,
          title TEXT,
          committee TEXT,
          agenda TEXT,
          type TEXT,
          host_id TEXT,
          created_at BIGINT,
          chat_disabled BOOLEAN DEFAULT FALSE,
          screen_share_disabled BOOLEAN DEFAULT FALSE,
          is_locked BOOLEAN DEFAULT FALSE,
          speakers_queue JSONB DEFAULT '[]'::jsonb,
          current_speaker_index INTEGER DEFAULT 0,
          speech_duration INTEGER DEFAULT 90,
          time_left INTEGER DEFAULT 90,
          is_timer_running BOOLEAN DEFAULT FALSE,
          timer_started_at BIGINT DEFAULT 0,
          participants JSONB DEFAULT '[]'::jsonb,
          messages JSONB DEFAULT '[]'::jsonb,
          signals JSONB DEFAULT '[]'::jsonb,
          breakouts JSONB DEFAULT '[]'::jsonb,
          updated_at BIGINT DEFAULT 0
        );
      `;

      // Check if users exist; if not, seed defaults
      const existing = await sql`SELECT id FROM users LIMIT 1`;
      if (existing.length === 0) {
        console.log('🌱 [Database] Seeding initial Secretariat accounts into Neon Postgres...');
        for (const acc of seedAccounts) {
          const passwordHash = bcrypt.hashSync(acc.passwordPlain, 10);
          await sql`
            INSERT INTO users (id, name, email, role, title, country, committee, avatar_color, password_hash, created_at)
            VALUES (${acc.id}, ${acc.name}, ${acc.email.toLowerCase()}, ${acc.role}, ${acc.title || ''}, ${acc.country || ''}, ${acc.committee || ''}, ${acc.avatarColor || ''}, ${passwordHash}, ${acc.createdAt})
            ON CONFLICT (email) DO NOTHING;
          `;
        }
      }

      console.log('✅ [Database] Neon Postgres tables verified and ready.');
      dbInitialized = true;
    } catch (err) {
      console.error('⚠️ [Database] Neon Postgres init error, falling back to memory:', err);
      dbInitialized = true;
    }
  })();

  return initPromise;
}

// User operations
export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const cleanEmail = email.toLowerCase().trim();
  const sql = getSql();
  if (!sql) {
    return memUsers.get(cleanEmail) || null;
  }
  await ensureDb();
  try {
    const rows = await sql`
      SELECT id, name, email, role, title, country, committee, password_hash as "passwordHash", avatar_color as "avatarColor", created_at as "createdAt"
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1;
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role as any,
      title: r.title,
      country: r.country,
      committee: r.committee,
      passwordHash: r.passwordHash,
      avatarColor: r.avatarColor,
      createdAt: Number(r.createdAt),
    };
  } catch (err) {
    console.error('Error fetching user from Neon:', err);
    return memUsers.get(cleanEmail) || null;
  }
}

export async function saveUser(user: StoredUser): Promise<void> {
  const cleanEmail = user.email.toLowerCase().trim();
  memUsers.set(cleanEmail, user);

  const sql = getSql();
  if (!sql) return;
  await ensureDb();
  try {
    await sql`
      INSERT INTO users (id, name, email, role, title, country, committee, avatar_color, password_hash, created_at)
      VALUES (${user.id}, ${user.name}, ${cleanEmail}, ${user.role}, ${user.title || ''}, ${user.country || ''}, ${user.committee || ''}, ${user.avatarColor || ''}, ${user.passwordHash || ''}, ${user.createdAt})
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        title = EXCLUDED.title,
        country = EXCLUDED.country,
        committee = EXCLUDED.committee,
        avatar_color = EXCLUDED.avatar_color,
        password_hash = EXCLUDED.password_hash;
    `;
  } catch (err) {
    console.error('Error saving user to Neon:', err);
  }
}

export async function deleteUserByEmail(email: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim();
  const memExisted = memUsers.delete(cleanEmail);

  const sql = getSql();
  if (!sql) return memExisted;
  await ensureDb();
  try {
    const res = await sql`DELETE FROM users WHERE email = ${cleanEmail};`;
    return true;
  } catch (err) {
    console.error('Error deleting user from Neon:', err);
    return memExisted;
  }
}

export async function getAllUsers(): Promise<Omit<StoredUser, 'passwordHash'>[]> {
  const sql = getSql();
  if (!sql) {
    return Array.from(memUsers.values()).map(({ passwordHash, ...rest }) => rest);
  }
  await ensureDb();
  try {
    const rows = await sql`
      SELECT id, name, email, role, title, country, committee, avatar_color as "avatarColor", created_at as "createdAt"
      FROM users
      ORDER BY created_at DESC;
    `;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role as any,
      title: r.title,
      country: r.country,
      committee: r.committee,
      avatarColor: r.avatarColor,
      createdAt: Number(r.createdAt),
    }));
  } catch (err) {
    console.error('Error listing users from Neon:', err);
    return Array.from(memUsers.values()).map(({ passwordHash, ...rest }) => rest);
  }
}

// Password reset operations
export async function savePasswordReset(entry: PasswordResetEntry): Promise<void> {
  memResets.set(entry.token, entry);
  memResets.set(entry.code, entry);

  const sql = getSql();
  if (!sql) return;
  await ensureDb();
  try {
    await sql`
      INSERT INTO password_resets (token, code, email, expires_at, used)
      VALUES (${entry.token}, ${entry.code}, ${entry.email.toLowerCase()}, ${entry.expiresAt}, ${entry.used})
      ON CONFLICT (token) DO UPDATE SET
        code = EXCLUDED.code,
        expires_at = EXCLUDED.expires_at,
        used = EXCLUDED.used;
    `;
  } catch (err) {
    console.error('Error saving password reset to Neon:', err);
  }
}

export async function getPasswordReset(key: string): Promise<PasswordResetEntry | null> {
  const memEntry = memResets.get(key);
  const sql = getSql();
  if (!sql) return memEntry || null;

  await ensureDb();
  try {
    const rows = await sql`
      SELECT token, code, email, expires_at as "expiresAt", used
      FROM password_resets
      WHERE token = ${key} OR code = ${key}
      LIMIT 1;
    `;
    if (rows.length === 0) return memEntry || null;
    const r = rows[0];
    return {
      token: r.token,
      code: r.code,
      email: r.email,
      expiresAt: Number(r.expiresAt),
      used: Boolean(r.used),
    };
  } catch (err) {
    console.error('Error fetching password reset from Neon:', err);
    return memEntry || null;
  }
}

export async function markPasswordResetUsed(token: string): Promise<void> {
  const memEntry = memResets.get(token);
  if (memEntry) memEntry.used = true;

  const sql = getSql();
  if (!sql) return;
  await ensureDb();
  try {
    await sql`
      UPDATE password_resets
      SET used = TRUE
      WHERE token = ${token};
    `;
  } catch (err) {
    console.error('Error marking reset used in Neon:', err);
  }
}

// Meeting Room operations (Synchronized with Neon Postgres for Vercel Serverless)
export async function getRoom(roomId: string): Promise<RoomState | null> {
  const cleanId = roomId.toLowerCase().trim();
  const sql = getSql();
  if (!sql) {
    const r = memRooms.get(cleanId);
    if (r) adjustRoomTimer(r);
    return r || null;
  }

  await ensureDb();
  try {
    const rows = await sql`
      SELECT id, title, committee, agenda, type, host_id as "hostId", created_at as "createdAt",
             chat_disabled as "chatDisabled", screen_share_disabled as "screenShareDisabled", is_locked as "isLocked",
             speakers_queue as "speakersQueue", current_speaker_index as "currentSpeakerIndex",
             speech_duration as "speechDuration", time_left as "timeLeft", is_timer_running as "isTimerRunning",
             timer_started_at as "timerStartedAt", participants, messages, signals, breakouts
      FROM meeting_rooms
      WHERE id = ${cleanId}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      const r = memRooms.get(cleanId);
      if (r) adjustRoomTimer(r);
      return r || null;
    }

    const r = rows[0];
    const room: RoomState = {
      id: r.id,
      title: r.title || 'Live Committee Session',
      committee: r.committee || 'UN Committee',
      agenda: r.agenda || 'General Multilateral Debate',
      type: (r.type as any) || 'COMMITTEE',
      hostId: r.hostId || 'host',
      createdAt: Number(r.createdAt || Date.now()),
      chatDisabled: Boolean(r.chatDisabled),
      screenShareDisabled: Boolean(r.screenShareDisabled),
      isLocked: Boolean(r.isLocked),
      speakersQueue: Array.isArray(r.speakersQueue) ? r.speakersQueue : [],
      currentSpeakerIndex: Number(r.currentSpeakerIndex || 0),
      speechDuration: Number(r.speechDuration || 90),
      timeLeft: Number(r.timeLeft ?? 90),
      isTimerRunning: Boolean(r.isTimerRunning),
      timerStartedAt: Number(r.timerStartedAt || 0),
      participants: Array.isArray(r.participants) ? r.participants : [],
      messages: Array.isArray(r.messages) ? r.messages : [],
      signals: Array.isArray(r.signals) ? r.signals : [],
      breakouts: Array.isArray(r.breakouts) ? r.breakouts : [],
    };

    adjustRoomTimer(room);
    memRooms.set(cleanId, room);
    return room;
  } catch (err) {
    console.error('Error fetching room from Neon:', err);
    const r = memRooms.get(cleanId);
    if (r) adjustRoomTimer(r);
    return r || null;
  }
}

// Authoritative wall-clock timer adjustment for serverless environments
function adjustRoomTimer(room: RoomState) {
  if (room.isTimerRunning && room.timerStartedAt && room.timerStartedAt > 0) {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - room.timerStartedAt) / 1000);
    const remaining = Math.max(0, room.speechDuration - elapsedSeconds);
    room.timeLeft = remaining;
    if (remaining === 0) {
      room.isTimerRunning = false;
    }
  }
}

export async function saveRoom(room: RoomState): Promise<void> {
  const cleanId = room.id.toLowerCase().trim();
  memRooms.set(cleanId, room);

  const sql = getSql();
  if (!sql) return;
  await ensureDb();

  try {
    await sql`
      INSERT INTO meeting_rooms (
        id, title, committee, agenda, type, host_id, created_at,
        chat_disabled, screen_share_disabled, is_locked,
        speakers_queue, current_speaker_index, speech_duration, time_left,
        is_timer_running, timer_started_at,
        participants, messages, signals, breakouts, updated_at
      )
      VALUES (
        ${cleanId}, ${room.title}, ${room.committee}, ${room.agenda}, ${room.type}, ${room.hostId}, ${room.createdAt},
        ${room.chatDisabled}, ${room.screenShareDisabled}, ${Boolean(room.isLocked)},
        ${JSON.stringify(room.speakersQueue)}::jsonb, ${room.currentSpeakerIndex}, ${room.speechDuration}, ${room.timeLeft},
        ${room.isTimerRunning}, ${room.timerStartedAt || 0},
        ${JSON.stringify(room.participants)}::jsonb,
        ${JSON.stringify(room.messages)}::jsonb,
        ${JSON.stringify(room.signals)}::jsonb,
        ${JSON.stringify(room.breakouts)}::jsonb,
        ${Date.now()}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        committee = EXCLUDED.committee,
        agenda = EXCLUDED.agenda,
        type = EXCLUDED.type,
        chat_disabled = EXCLUDED.chat_disabled,
        screen_share_disabled = EXCLUDED.screen_share_disabled,
        is_locked = EXCLUDED.is_locked,
        speakers_queue = EXCLUDED.speakers_queue,
        current_speaker_index = EXCLUDED.current_speaker_index,
        speech_duration = EXCLUDED.speech_duration,
        time_left = EXCLUDED.time_left,
        is_timer_running = EXCLUDED.is_timer_running,
        timer_started_at = EXCLUDED.timer_started_at,
        participants = EXCLUDED.participants,
        messages = EXCLUDED.messages,
        signals = EXCLUDED.signals,
        breakouts = EXCLUDED.breakouts,
        updated_at = EXCLUDED.updated_at;
    `;
  } catch (err) {
    console.error('Error saving room to Neon:', err);
  }
}

export async function deleteRoomById(roomId: string): Promise<boolean> {
  const cleanId = roomId.toLowerCase().trim();
  const memExisted = memRooms.delete(cleanId);

  const sql = getSql();
  if (!sql) return memExisted;
  await ensureDb();
  try {
    await sql`DELETE FROM meeting_rooms WHERE id = ${cleanId};`;
    return true;
  } catch (err) {
    console.error('Error deleting room from Neon:', err);
    return memExisted;
  }
}

export async function getAllRooms(): Promise<RoomState[]> {
  const sql = getSql();
  if (!sql) {
    return Array.from(memRooms.values());
  }
  await ensureDb();
  try {
    const rows = await sql`
      SELECT id, title, committee, agenda, type, host_id as "hostId", created_at as "createdAt",
             chat_disabled as "chatDisabled", screen_share_disabled as "screenShareDisabled", is_locked as "isLocked",
             speakers_queue as "speakersQueue", current_speaker_index as "currentSpeakerIndex",
             speech_duration as "speechDuration", time_left as "timeLeft", is_timer_running as "isTimerRunning",
             timer_started_at as "timerStartedAt", participants, messages, signals, breakouts
      FROM meeting_rooms
      ORDER BY updated_at DESC, created_at DESC;
    `;

    return rows.map((r) => {
      const room: RoomState = {
        id: r.id,
        title: r.title || 'Live Committee Session',
        committee: r.committee || 'UN Committee',
        agenda: r.agenda || 'General Multilateral Debate',
        type: (r.type as any) || 'COMMITTEE',
        hostId: r.hostId || 'host',
        createdAt: Number(r.createdAt || Date.now()),
        chatDisabled: Boolean(r.chatDisabled),
        screenShareDisabled: Boolean(r.screenShareDisabled),
        isLocked: Boolean(r.isLocked),
        speakersQueue: Array.isArray(r.speakersQueue) ? r.speakersQueue : [],
        currentSpeakerIndex: Number(r.currentSpeakerIndex || 0),
        speechDuration: Number(r.speechDuration || 90),
        timeLeft: Number(r.timeLeft ?? 90),
        isTimerRunning: Boolean(r.isTimerRunning),
        timerStartedAt: Number(r.timerStartedAt || 0),
        participants: Array.isArray(r.participants) ? r.participants : [],
        messages: Array.isArray(r.messages) ? r.messages : [],
        signals: Array.isArray(r.signals) ? r.signals : [],
        breakouts: Array.isArray(r.breakouts) ? r.breakouts : [],
      };
      adjustRoomTimer(room);
      return room;
    });
  } catch (err) {
    console.error('Error fetching all rooms from Neon:', err);
    return Array.from(memRooms.values());
  }
}

export function getDatabaseStatus() {
  const connStr = getConnectionString();
  return {
    provider: connStr ? 'neon-postgresql' : 'in-memory-fallback',
    connected: Boolean(connStr),
    driver: '@neondatabase/serverless',
    vercelReady: true,
  };
}
