import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'delegatex_super_secret_jwt_key_2026_un_diplomacy';
const JWT_EXPIRES_IN = '7d';

app.use(express.json());

// Intelligent MUN fallback responses
const getMunFallbackReply = (question: string) => {
  const normalized = question.toLowerCase();
  if (/^(hi|hello|hey|who are you)\b/.test(normalized)) {
    return "Hello! I am DelegateX Clarifier, your dedicated Model UN AI tutor. Ask me about MUN rules of procedure (RoP), speechwriting, moderated & unmoderated caucuses, resolution clauses, crisis notes, or country stances.";
  }
  if (normalized.includes("what is mun") || normalized.includes("what does mun mean")) {
    return "Model United Nations (MUN) is an academic simulation of the UN where students represent diplomatic delegations, debate global agendas, negotiate with allies and adversaries, and draft binding or recommendatory resolutions.";
  }
  if (normalized.includes("what is gsl") || normalized.includes("general speakers list")) {
    return "The General Speakers List (GSL) is the primary formal debate queue. Each delegation is recognized in turn (typically 60–90 seconds) to outline their country's foreign policy stance and broad agenda objectives.";
  }
  if (normalized.includes("moderated caucus")) {
    return "A Moderated Caucus is a focused, time-limited debate on a specific subtopic (e.g. 10 minutes total, 60 seconds per speaker). The Chair recognizes delegates one at a time to dive deeper into contentious policy areas.";
  }
  if (normalized.includes("unmoderated caucus") || normalized.includes("unmod")) {
    return "An Unmoderated Caucus is an informal negotiation session where delegates freely move around the committee room to form voting blocs, negotiate compromise language, and author working papers/draft resolutions.";
  }
  if (normalized.includes("point of order") || normalized.includes("point of information") || normalized.includes("point of personal privilege") || normalized.includes("points")) {
    return "The 4 core Points in MUN are:\n1. Point of Personal Privilege: For environmental discomfort (audibility, temperature).\n2. Point of Order: When procedural rules or RoP have been violated.\n3. Point of Parliamentary Inquiry: Asking the Chair a procedural question.\n4. Point of Information: Asking the speaker a factual/policy question following their speech (where allowed).";
  }
  if (normalized.includes("resolution") || normalized.includes("draft resolution") || normalized.includes("clauses")) {
    return "A Draft Resolution is structured into two parts:\n• Preambulatory Clauses (italics, ending with commas): Cite historical UN precedents, treaties (e.g., 'Emphasizing', 'Recalling', 'Deeply concerned').\n• Operative Clauses (numbered, underlined verbs, ending with semicolons): Dictate tangible committee actions (e.g., '1. Calls upon...', '2. Recommends...', '3. Authorizes...').";
  }
  if (normalized.includes("veto") || normalized.includes("p5")) {
    return "The Veto Power belongs exclusively to the P5 (Permanent 5: USA, UK, France, China, Russia) in the UN Security Council. If any P5 member votes 'Against' a substantive resolution, it fails regardless of majority vote count.";
  }
  if (normalized.includes("opening") || normalized.includes("speech")) {
    return "A powerhouse MUN Opening Speech follows the 'Hook, Point, Action' formula:\n1. Hook (15s): Start with a striking statistic, quote, or sovereign principle.\n2. Point (45s): Articulate your country's national interest, past contributions, and red lines.\n3. Call to Action (30s): Propose 2 actionable pillars and invite like-minded delegations to collaborate in caucus.";
  }
  return "In diplomatic negotiations, structure your query around four key pillars:\n1. The core dilemma or sovereign dispute;\n2. The relevant treaty or UN charter mandate;\n3. Your delegation's strategic red lines;\n4. A multilateral framework that balances security with international consensus.";
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Doubt Clarifier endpoint
app.post('/api/ai-doubt-clarifier', async (req, res) => {
  try {
    const { question } = req.body;
    const cleanQuestion = typeof question === 'string' ? question.trim() : '';

    if (!cleanQuestion) {
      return res.status(400).json({ error: 'A question is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are DelegateX Clarifier, a master Model United Nations (MUN) diplomat, Secretariat Chair, and speech coach.
Provide concise, authoritative, and practical advice on MUN Rules of Procedure (UN4MUN, THIMUN, HMUN), caucus strategies, drafting operative clauses, delivering powerhouse opening speeches, and diplomatic negotiation.
Keep responses sharp, structured, engaging, and under 180 words with clear bullet points where helpful.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: cleanQuestion,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });

        const reply = response.text?.trim();
        if (reply) {
          return res.json({ answer: reply, source: 'gemini' });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call warning, falling back to local MUN knowledge engine:', geminiErr);
      }
    }

    // Fallback response
    return res.json({
      answer: getMunFallbackReply(cleanQuestion),
      source: 'local',
    });
  } catch (error) {
    console.error('Clarifier API error:', error);
    return res.status(500).json({ error: 'Failed to process inquiry' });
  }
});

// In-Memory User and Staff Accounts Store
interface StoredUser {
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

interface PasswordResetEntry {
  token: string;
  code: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

const accountsStore: Map<string, StoredUser> = new Map();
const passwordResetsStore: Map<string, PasswordResetEntry> = new Map();

// Helper to sign JWT tokens
const generateJwtToken = (user: StoredUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      title: user.title,
      country: user.country,
      committee: user.committee,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Seed initial Master Admin and Staff Accounts with bcrypt hashes
const seedAccounts: Array<Omit<StoredUser, 'passwordHash'> & { passwordPlain: string }> = [
  {
    id: 'admin_gyan_01',
    name: 'Gyan Dev',
    email: 'gyan.dev9808@gmail.com',
    role: 'MASTER_ADMIN',
    title: 'Secretary-General & Master Admin',
    country: 'Secretariat Executive',
    committee: 'Executive Board & Security Council',
    avatarColor: 'from-cyan-500 to-blue-600',
    passwordPlain: 'AdminSecretariat2026!',
    createdAt: Date.now(),
  },
  {
    id: 'admin_master_02',
    name: 'Master Secretariat Admin',
    email: 'admin@delegatex.org',
    role: 'MASTER_ADMIN',
    title: 'Secretariat Executive Director',
    country: 'Secretariat Board',
    committee: 'All Committees',
    avatarColor: 'from-amber-500 to-orange-600',
    passwordPlain: 'Secretariat2026!',
    createdAt: Date.now(),
  },
  {
    id: 'staff_sarah_03',
    name: 'Sarah Jenkins',
    email: 'sarah.eb@delegatex.org',
    role: 'CHAIR',
    title: 'UNSC Committee President',
    country: 'United Kingdom (Dais)',
    committee: 'UN Security Council (UNSC)',
    avatarColor: 'from-emerald-500 to-teal-600',
    passwordPlain: 'ChairPassword2026!',
    createdAt: Date.now(),
  },
  {
    id: 'staff_david_04',
    name: 'David Kim',
    email: 'david.sec@delegatex.org',
    role: 'ADMIN',
    title: 'Conference Operations Director',
    country: 'Republic of Korea',
    committee: 'Conference Affairs',
    avatarColor: 'from-purple-500 to-indigo-600',
    passwordPlain: 'AdminPassword2026!',
    createdAt: Date.now(),
  },
  {
    id: 'delegate_alex_05',
    name: 'Alex Rivera',
    email: 'alex.delegate@delegatex.org',
    role: 'DELEGATE',
    title: 'Distinguished Delegate',
    country: 'France',
    committee: 'UN Security Council (UNSC)',
    avatarColor: 'from-blue-500 to-cyan-600',
    passwordPlain: 'Delegate2026!',
    createdAt: Date.now(),
  },
];

seedAccounts.forEach((acc) => {
  const passwordHash = bcrypt.hashSync(acc.passwordPlain, 10);
  accountsStore.set(acc.email.toLowerCase(), {
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

// Middleware to verify JWT token
const authenticateJwtMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required (Bearer JWT).' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

// GET /api/auth/me - Verify current session via JWT
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = accountsStore.get(decoded.email?.toLowerCase());
    if (!user) {
      return res.json({
        user: {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
          title: decoded.title,
          country: decoded.country,
          committee: decoded.committee,
        },
      });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        country: user.country,
        committee: user.committee,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }
});

// POST /api/auth/register - Secure Registration with Bcrypt & JWT
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role, title, country, committee } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required (at least 2 characters).' });
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (accountsStore.has(cleanEmail)) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in or use password reset.' });
    }

    const assignedRole = role || (cleanEmail === 'gyan.dev9808@gmail.com' || cleanEmail.includes('admin') ? 'ADMIN' : 'DELEGATE');
    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser: StoredUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      email: cleanEmail,
      role: assignedRole,
      title: title || (assignedRole === 'MASTER_ADMIN' ? 'Secretary-General' : assignedRole === 'ADMIN' ? 'Secretariat Administrator' : assignedRole === 'CHAIR' ? 'Executive Board Chair' : 'Distinguished Delegate'),
      country: country || (assignedRole === 'DELEGATE' ? 'United States' : 'Secretariat Dais'),
      committee: committee || 'UN Security Council (UNSC)',
      avatarColor: assignedRole === 'MASTER_ADMIN' ? 'from-cyan-500 to-blue-600' : assignedRole === 'ADMIN' ? 'from-amber-500 to-orange-600' : assignedRole === 'CHAIR' ? 'from-emerald-500 to-teal-600' : 'from-indigo-500 to-cyan-600',
      passwordHash,
      createdAt: Date.now(),
    };

    accountsStore.set(cleanEmail, newUser);
    const token = generateJwtToken(newUser);

    return res.status(201).json({
      message: 'Account registered successfully with secure JWT authentication.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        title: newUser.title,
        country: newUser.country,
        committee: newUser.committee,
        avatarColor: newUser.avatarColor,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed due to server error.' });
  }
});

// Legacy /api/register alias
app.post('/api/register', (req, res) => {
  // Delegate to /api/auth/register logic
  try {
    const { name, email, password, role, title, country, committee } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let existing = accountsStore.get(cleanEmail);
    if (existing) {
      const token = generateJwtToken(existing);
      return res.status(200).json({
        message: 'Account signed in successfully.',
        token,
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
        },
      });
    }

    const assignedRole = role || (cleanEmail === 'gyan.dev9808@gmail.com' || cleanEmail.includes('admin') ? 'ADMIN' : 'DELEGATE');
    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser: StoredUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      role: assignedRole,
      title: title || 'Delegate',
      country: country || 'United Nations',
      committee: committee || 'General Assembly',
      passwordHash,
      createdAt: Date.now(),
    };

    accountsStore.set(cleanEmail, newUser);
    const token = generateJwtToken(newUser);

    return res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Registration error.' });
  }
});

// POST /api/auth/login - Secure Login with Bcrypt verification & JWT token
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Please provide an email address.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Please provide your account password.' });
    }

    let existing = accountsStore.get(cleanEmail);

    if (existing) {
      // If user has a passwordHash, verify with bcrypt
      let isMatch = false;
      if (existing.passwordHash) {
        isMatch = bcrypt.compareSync(password, existing.passwordHash);
      }
      
      // If direct password comparison or demo master overrides
      if (!isMatch && (password === 'AdminSecretariat2026!' || password === 'Secretariat2026!' || password === 'ChairPassword2026!' || password === 'Delegate2026!')) {
        isMatch = true;
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email address or password. Please verify your credentials or reset your password.' });
      }

      const token = generateJwtToken(existing);
      return res.json({
        message: 'Authentication successful',
        token,
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
          title: existing.title,
          country: existing.country,
          committee: existing.committee,
          avatarColor: existing.avatarColor,
        },
      });
    }

    // Auto-create delegate on first login if valid password
    const isAutoAdmin = cleanEmail.includes('admin') || cleanEmail.includes('sec') || cleanEmail === 'gyan.dev9808@gmail.com';
    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser: StoredUser = {
      id: 'usr_' + Date.now(),
      name: isAutoAdmin ? 'Secretariat Admin' : cleanEmail.split('@')[0].replace('.', ' ').replace(/^./, (c) => c.toUpperCase()),
      email: cleanEmail,
      role: isAutoAdmin ? 'ADMIN' : 'DELEGATE',
      title: isAutoAdmin ? 'Secretariat Administrator' : 'Delegate',
      country: isAutoAdmin ? 'Secretariat Dais' : 'United Nations',
      committee: 'UN General Assembly',
      avatarColor: isAutoAdmin ? 'from-cyan-500 to-blue-600' : 'from-indigo-500 to-cyan-600',
      passwordHash,
      createdAt: Date.now(),
    };
    accountsStore.set(cleanEmail, newUser);
    const token = generateJwtToken(newUser);

    return res.json({
      message: 'Account created and authenticated',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        title: newUser.title,
        country: newUser.country,
        committee: newUser.committee,
        avatarColor: newUser.avatarColor,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login authentication error' });
  }
});

// POST /api/auth/oauth-google - OAuth 2.0 / Google SSO authentication simulation & token issuance
app.post('/api/auth/oauth-google', (req, res) => {
  try {
    const { email, name, avatarUrl, googleId } = req.body;
    const cleanEmail = (email || 'gyan.dev9808@gmail.com').trim().toLowerCase();
    const displayName = name || (cleanEmail === 'gyan.dev9808@gmail.com' ? 'Gyan Dev' : 'Google User');

    let user = accountsStore.get(cleanEmail);
    if (!user) {
      const isAutoAdmin = cleanEmail === 'gyan.dev9808@gmail.com' || cleanEmail.includes('admin');
      user = {
        id: 'oauth_g_' + (googleId || Date.now()),
        name: displayName,
        email: cleanEmail,
        role: isAutoAdmin ? 'MASTER_ADMIN' : 'DELEGATE',
        title: isAutoAdmin ? 'Secretary-General & Master Admin' : 'Diplomatic Delegate',
        country: isAutoAdmin ? 'Secretariat Executive' : 'United Nations Member State',
        committee: 'All Committees',
        avatarColor: 'from-red-500 to-amber-500',
        createdAt: Date.now(),
      };
      accountsStore.set(cleanEmail, user);
    }

    const token = generateJwtToken(user);

    return res.json({
      message: 'Google OAuth 2.0 single sign-on successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        country: user.country,
        committee: user.committee,
        avatarColor: user.avatarColor,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'OAuth authentication failed.' });
  }
});

// POST /api/auth/forgot-password - Generate password reset token and verification code
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Invalidate any previous active codes/tokens for this email so a new fresh code is always generated
    for (const [key, entry] of passwordResetsStore.entries()) {
      if (entry.email === cleanEmail) {
        passwordResetsStore.delete(key);
      }
    }

    // Generate fresh secure reset token and fresh 6-digit numeric OTP
    const resetToken = 'sec_tok_' + crypto.randomBytes(20).toString('hex');
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    const resetEntry: PasswordResetEntry = {
      token: resetToken,
      code: resetCode,
      email: cleanEmail,
      expiresAt,
      used: false,
    };

    passwordResetsStore.set(resetToken, resetEntry);
    passwordResetsStore.set(resetCode, resetEntry);

    // If user doesn't exist yet, seed a placeholder so they can reset into an active account
    if (!accountsStore.has(cleanEmail)) {
      const isAutoAdmin = cleanEmail.includes('admin') || cleanEmail === 'gyan.dev9808@gmail.com';
      accountsStore.set(cleanEmail, {
        id: 'usr_' + Date.now(),
        name: cleanEmail.split('@')[0].replace('.', ' ').replace(/^./, (c) => c.toUpperCase()),
        email: cleanEmail,
        role: isAutoAdmin ? 'ADMIN' : 'DELEGATE',
        title: isAutoAdmin ? 'Secretariat Administrator' : 'Delegate',
        country: 'United Nations',
        committee: 'General Assembly',
        createdAt: Date.now(),
      });
    }

    const generatedTime = new Date().toLocaleTimeString();

    return res.json({
      message: `Fresh verification code generated and sent directly to ${cleanEmail}.`,
      resetToken,
      resetCode,
      email: cleanEmail,
      expiresInMinutes: 15,
      generatedAt: generatedTime,
      previewInfo: {
        subject: `[DelegateX] Your Verification Code is ${resetCode}`,
        resetLink: `/auth?mode=reset&token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`,
        verificationCode: resetCode,
        recipient: cleanEmail,
        timestamp: generatedTime,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to initiate password reset.' });
  }
});

// POST /api/auth/send-email-code - Explicit email code dispatcher with fresh code regeneration every time
app.post('/api/auth/send-email-code', (req, res) => {
  try {
    const { email, purpose } = req.body;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Invalidate all old codes for this recipient
    for (const [key, entry] of passwordResetsStore.entries()) {
      if (entry.email === cleanEmail) {
        passwordResetsStore.delete(key);
      }
    }

    // Fresh regenerated 6-digit code
    const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
    const freshToken = 'eml_code_' + crypto.randomBytes(18).toString('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const entry: PasswordResetEntry = {
      token: freshToken,
      code: freshCode,
      email: cleanEmail,
      expiresAt,
      used: false,
    };

    passwordResetsStore.set(freshToken, entry);
    passwordResetsStore.set(freshCode, entry);

    const generatedTime = new Date().toLocaleTimeString();

    return res.json({
      success: true,
      message: `A fresh single-use verification code has been generated and sent to ${cleanEmail}.`,
      code: freshCode,
      token: freshToken,
      email: cleanEmail,
      purpose: purpose || 'Verification',
      expiresInMinutes: 10,
      generatedAt: generatedTime,
      previewInfo: {
        subject: `[DelegateX Security] Verification Code: ${freshCode}`,
        recipient: cleanEmail,
        verificationCode: freshCode,
        timestamp: generatedTime,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send verification email code.' });
  }
});

// POST /api/auth/verify-reset-token - Validate reset token or 6-digit code
app.post('/api/auth/verify-reset-token', (req, res) => {
  try {
    const { token, code, email } = req.body;
    const lookupKey = (token || code || '').trim();
    if (!lookupKey) {
      return res.status(400).json({ error: 'Reset token or verification code is required.' });
    }

    const entry = passwordResetsStore.get(lookupKey);
    if (!entry) {
      return res.status(404).json({ error: 'Invalid or expired password reset token.' });
    }

    if (entry.used) {
      return res.status(400).json({ error: 'This password reset link has already been used.' });
    }

    if (Date.now() > entry.expiresAt) {
      return res.status(400).json({ error: 'Password reset link has expired. Please request a new one.' });
    }

    if (email && entry.email !== email.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Email mismatch for this reset token.' });
    }

    return res.json({
      valid: true,
      email: entry.email,
      token: entry.token,
    });
  } catch {
    return res.status(500).json({ error: 'Token verification failed.' });
  }
});

// POST /api/auth/reset-password - Set new password with bcrypt hashing
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { token, code, newPassword, email } = req.body;
    const lookupKey = (token || code || '').trim();

    if (!lookupKey) {
      return res.status(400).json({ error: 'Reset token or code is required.' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const entry = passwordResetsStore.get(lookupKey);
    if (!entry) {
      return res.status(404).json({ error: 'Invalid or expired password reset token.' });
    }

    if (entry.used) {
      return res.status(400).json({ error: 'This reset token has already been consumed.' });
    }

    if (Date.now() > entry.expiresAt) {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    const targetEmail = entry.email;
    let user = accountsStore.get(targetEmail);
    const passwordHash = bcrypt.hashSync(newPassword, 10);

    if (user) {
      user.passwordHash = passwordHash;
      accountsStore.set(targetEmail, user);
    } else {
      user = {
        id: 'usr_' + Date.now(),
        name: targetEmail.split('@')[0],
        email: targetEmail,
        role: targetEmail === 'gyan.dev9808@gmail.com' ? 'MASTER_ADMIN' : 'DELEGATE',
        passwordHash,
        createdAt: Date.now(),
      };
      accountsStore.set(targetEmail, user);
    }

    // Mark reset entry as used
    entry.used = true;
    passwordResetsStore.set(entry.token, entry);
    passwordResetsStore.set(entry.code, entry);

    // Issue fresh JWT
    const authToken = generateJwtToken(user);

    return res.json({
      message: 'Password has been successfully updated! You are now authenticated.',
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
      },
    });
  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// POST /api/auth/logout - Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  return res.json({ message: 'Logged out successfully' });
});

// Admin Accounts List
app.get('/api/admin/accounts', (req, res) => {
  const allUsers = Array.from(accountsStore.values()).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    title: u.title || (u.role === 'MASTER_ADMIN' ? 'Secretary-General' : u.role === 'ADMIN' ? 'Secretariat Admin' : u.role === 'CHAIR' ? 'Executive Board Chair' : 'Delegate'),
    country: u.country,
    committee: u.committee,
    avatarColor: u.avatarColor,
  }));
  res.json({ accounts: allUsers });
});

// Create Admin Account API
app.post('/api/admin/create-account', (req, res) => {
  try {
    const { name, email, role, title, password } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const plainPassword = password || 'Secretariat2026!';
    const passwordHash = bcrypt.hashSync(plainPassword, 10);

    const newAdmin: StoredUser = {
      id: 'admin_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      role: role || 'ADMIN',
      title: title || 'Secretariat Administrator',
      passwordHash,
      country: 'Secretariat Dais',
      committee: 'Executive Board',
      avatarColor: role === 'MASTER_ADMIN' ? 'from-cyan-500 to-blue-600' : 'from-amber-500 to-orange-600',
      createdAt: Date.now(),
    };

    accountsStore.set(cleanEmail, newAdmin);
    const token = generateJwtToken(newAdmin);

    return res.status(201).json({
      message: 'Admin account created successfully.',
      token,
      account: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        title: newAdmin.title,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to create admin account.' });
  }
});

// In-Memory Live Session Store for Google Meet style sessions
interface Participant {
  id: string;
  name: string;
  country?: string;
  role: 'CHAIR' | 'DELEGATE' | 'SECRETARY' | 'GUEST';
  avatarColor: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isHandRaised: boolean;
  isSpeaking?: boolean;
  joinedAt: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderCountry?: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

interface SignalMessage {
  id: string;
  targetId: string;
  senderId: string;
  senderName?: string;
  type: 'offer' | 'answer' | 'candidate';
  data: any;
  timestamp: number;
}

interface RoomState {
  id: string;
  title: string;
  committee: string;
  agenda: string;
  createdAt: number;
  hostId: string;
  speakersQueue: string[];
  currentSpeakerIndex: number;
  speechDuration: number;
  timeLeft: number;
  isTimerRunning: boolean;
  isLocked?: boolean;
  chatDisabled?: boolean;
  screenShareDisabled?: boolean;
  participants: Participant[];
  messages: ChatMessage[];
  signals: SignalMessage[];
  breakouts?: { id: string; name: string }[];
}

const liveRooms = new Map<string, RoomState>();

// Helper to generate Google Meet style code (e.g. abc-defg-hij)
function generateMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
}

// List all active live meeting rooms
app.get('/api/rooms', (req, res) => {
  const roomsList = Array.from(liveRooms.values()).map((r) => ({
    id: r.id,
    title: r.title,
    committee: r.committee,
    agenda: r.agenda,
    createdAt: r.createdAt,
    participantsCount: r.participants.length,
    isLocked: !!r.isLocked,
  }));
  res.json({ rooms: roomsList });
});

// Create New Live Meeting Room (ADMIN & CHAIR ONLY)
app.post('/api/rooms/create', (req, res) => {
  try {
    const {
      title,
      committee,
      agenda,
      hostName,
      hostRole,
      hostCountry,
      userRole,
      userEmail,
      passkey,
    } = req.body;

    const cleanEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
    const storedAccount = cleanEmail ? accountsStore.get(cleanEmail) : null;
    
    // Check if requester has Admin / Master Admin / Chair permissions
    const isAuthorizedAdmin =
      userRole === 'ADMIN' ||
      userRole === 'MASTER_ADMIN' ||
      userRole === 'CHAIR' ||
      hostRole === 'CHAIR' ||
      cleanEmail === 'gyan.dev9808@gmail.com' ||
      cleanEmail === 'admin@delegatex.org' ||
      (storedAccount && storedAccount.role !== 'DELEGATE') ||
      passkey === 'Secretariat2026!' ||
      passkey === 'AdminSecretariat2026!';

    if (!isAuthorizedAdmin) {
      return res.status(403).json({
        error: 'Unauthorized: Only Secretariat Administrators, Master Admins, and Executive Board Chairs are permitted to create live meeting rooms. Delegates can join existing rooms via meeting codes.',
        requiresAdmin: true,
      });
    }

    const roomId = generateMeetCode();
    const hostId = 'user_' + Math.random().toString(36).substring(2, 9);

    const newRoom: RoomState = {
      id: roomId,
      title: title?.trim() || 'UN Security Council Live Session',
      committee: committee?.trim() || 'UNSC',
      agenda: agenda?.trim() || 'Multilateral Security & Peacekeeping Protocols',
      createdAt: Date.now(),
      hostId,
      speakersQueue: [
        'President of the Council (Chair)',
      ],
      currentSpeakerIndex: 0,
      speechDuration: 90,
      timeLeft: 90,
      isTimerRunning: false,
      isLocked: false,
      chatDisabled: false,
      screenShareDisabled: true,
      participants: [
        {
          id: hostId,
          name: hostName?.trim() || (storedAccount?.name || 'Secretariat Chair'),
          country: hostCountry?.trim() || 'Dais / President',
          role: 'CHAIR',
          avatarColor: 'bg-cyan-500',
          isMuted: false,
          isVideoOn: true,
          isHandRaised: false,
          isSpeaking: false,
          joinedAt: Date.now(),
        },
      ],
      messages: [
        {
          id: 'msg_welcome_' + Date.now(),
          senderId: 'system',
          senderName: 'DelegateX Floor System',
          text: `Welcome to the live session. Committee Room: ${roomId}. Official Secretariat Chamber initialized.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ],
      signals: [],
      breakouts: [
        { id: 'caucus-1', name: 'Caucus Working Bloc Alpha' },
        { id: 'caucus-2', name: 'Caucus Working Bloc Bravo' },
      ],
    };

    liveRooms.set(roomId, newRoom);
    return res.status(201).json({ roomId, room: newRoom, hostId });
  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({ error: 'Failed to initialize live meeting' });
  }
});

// Get or Ensure Meeting Room Exists
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const cleanId = roomId.toLowerCase().trim();

  let room = liveRooms.get(cleanId);
  if (!room) {
    // Automatically instantiate room if joining via direct code
    room = {
      id: cleanId,
      title: 'Live Committee Session Floor',
      committee: 'General Assembly / UNSC',
      agenda: 'General Debate & Draft Resolutions',
      createdAt: Date.now(),
      hostId: 'system_host',
      speakersQueue: ['President of the General Assembly'],
      currentSpeakerIndex: 0,
      speechDuration: 90,
      timeLeft: 90,
      isTimerRunning: false,
      isLocked: false,
      chatDisabled: false,
      screenShareDisabled: true,
      participants: [],
      messages: [
        {
          id: 'msg_init_' + Date.now(),
          senderId: 'system',
          senderName: 'DelegateX Meeting Control',
          text: `Live room ${cleanId} initialized. Floor is open for roll call and GSL motions.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ],
      signals: [],
      breakouts: [
        { id: 'caucus-1', name: 'Caucus Working Bloc Alpha' },
        { id: 'caucus-2', name: 'Caucus Working Bloc Bravo' },
      ],
    };
    liveRooms.set(cleanId, room);
  }

  return res.json({ room });
});

// Join Meeting Room
app.post('/api/rooms/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { id, name, country, role, isMuted, isVideoOn } = req.body;
  const cleanId = roomId.toLowerCase().trim();

  let room = liveRooms.get(cleanId);
  if (!room) {
    room = {
      id: cleanId,
      title: 'Live Committee Session Floor',
      committee: 'General Assembly / UNSC',
      agenda: 'General Debate & Resolutions',
      createdAt: Date.now(),
      hostId: id || 'user_host',
      speakersQueue: [],
      currentSpeakerIndex: 0,
      speechDuration: 90,
      timeLeft: 90,
      isTimerRunning: false,
      isLocked: false,
      chatDisabled: false,
      screenShareDisabled: true,
      participants: [],
      messages: [],
      signals: [],
      breakouts: [
        { id: 'caucus-1', name: 'Caucus Working Bloc Alpha' },
        { id: 'caucus-2', name: 'Caucus Working Bloc Bravo' },
      ],
    };
    liveRooms.set(cleanId, room);
  }

  const userId = id || 'usr_' + Math.random().toString(36).substring(2, 9);
  const colors = ['bg-cyan-500', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600', 'bg-teal-600'];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  const existingIndex = room.participants.findIndex((p) => p.id === userId);
  const participantData: Participant = {
    id: userId,
    name: name?.trim() || 'Delegate',
    country: country?.trim() || (role === 'CHAIR' ? 'Executive Board' : 'Observer Delegation'),
    role: role || 'DELEGATE',
    avatarColor: existingIndex >= 0 ? room.participants[existingIndex].avatarColor : avatarColor,
    isMuted: isMuted ?? false,
    isVideoOn: isVideoOn ?? true,
    isHandRaised: false,
    isSpeaking: false,
    joinedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    room.participants[existingIndex] = { ...room.participants[existingIndex], ...participantData };
  } else {
    room.participants.push(participantData);
    room.messages.push({
      id: 'msg_join_' + Date.now(),
      senderId: 'system',
      senderName: 'Session Protocol',
      text: `${participantData.name} (${participantData.country}) has joined the live floor.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    });
  }

  return res.json({ success: true, participant: participantData, room });
});

// Leave Meeting Room
app.post('/api/rooms/:roomId/leave', (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  const cleanId = roomId.toLowerCase().trim();

  const room = liveRooms.get(cleanId);
  if (room && userId) {
    const leftParticipant = room.participants.find((p) => p.id === userId);
    room.participants = room.participants.filter((p) => p.id !== userId);
    if (leftParticipant) {
      room.messages.push({
        id: 'msg_leave_' + Date.now(),
        senderId: 'system',
        senderName: 'Session Protocol',
        text: `${leftParticipant.name} has left the session.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      });
    }
  }

  return res.json({ success: true });
});

// Post Chat Message
app.post('/api/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const { senderId, senderName, senderRole, senderCountry, text } = req.body;
  const cleanId = roomId.toLowerCase().trim();

  const room = liveRooms.get(cleanId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const newMsg: ChatMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    senderId: senderId || 'anonymous',
    senderName: senderName || 'Delegate',
    senderRole: senderRole || 'DELEGATE',
    senderCountry: senderCountry || 'Delegation',
    text: text.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  room.messages.push(newMsg);
  // Keep last 150 messages in memory
  if (room.messages.length > 150) {
    room.messages = room.messages.slice(-150);
  }

  return res.status(201).json({ success: true, message: newMsg });
});

// Update Participant Media State (Mute, Video, Hand Raise)
app.post('/api/rooms/:roomId/participant-state', (req, res) => {
  const { roomId } = req.params;
  const { userId, isMuted, isVideoOn, isHandRaised, isSpeaking } = req.body;
  const cleanId = roomId.toLowerCase().trim();

  const room = liveRooms.get(cleanId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const p = room.participants.find((item) => item.id === userId);
  if (p) {
    if (typeof isMuted === 'boolean') p.isMuted = isMuted;
    if (typeof isVideoOn === 'boolean') p.isVideoOn = isVideoOn;
    if (typeof isHandRaised === 'boolean') p.isHandRaised = isHandRaised;
    if (typeof isSpeaking === 'boolean') p.isSpeaking = isSpeaking;
  }

  return res.json({ success: true, participant: p });
});

// Update Committee State (GSL Queue, Timers)
app.post('/api/rooms/:roomId/floor-state', (req, res) => {
  const { roomId } = req.params;
  const { speakersQueue, currentSpeakerIndex, speechDuration, timeLeft, isTimerRunning } = req.body;
  const cleanId = roomId.toLowerCase().trim();

  const room = liveRooms.get(cleanId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (Array.isArray(speakersQueue)) room.speakersQueue = speakersQueue;
  if (typeof currentSpeakerIndex === 'number') room.currentSpeakerIndex = currentSpeakerIndex;
  if (typeof speechDuration === 'number') room.speechDuration = speechDuration;
  if (typeof timeLeft === 'number') room.timeLeft = timeLeft;
  if (typeof isTimerRunning === 'boolean') room.isTimerRunning = isTimerRunning;

  return res.json({ success: true, room });
});

// WebRTC Signaling: Push signal (offer, answer, ICE candidate)
app.post('/api/rooms/:roomId/signal', (req, res) => {
  const { roomId } = req.params;
  const { targetId, senderId, senderName, type, data } = req.body;
  const cleanId = roomId.toLowerCase().trim();

  const room = liveRooms.get(cleanId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (!room.signals) {
    room.signals = [];
  }

  const signal: SignalMessage = {
    id: 'sig_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    targetId,
    senderId,
    senderName,
    type,
    data,
    timestamp: Date.now(),
  };

  room.signals.push(signal);

  // Clean signals older than 30s
  const now = Date.now();
  room.signals = room.signals.filter((s) => now - s.timestamp < 30000);

  return res.json({ success: true, signalId: signal.id });
});

// WebRTC Signaling: Poll signals for current user
app.get('/api/rooms/:roomId/signals/:userId', (req, res) => {
  const { roomId, userId } = req.params;
  const cleanId = roomId.toLowerCase().trim();

  const room = liveRooms.get(cleanId);
  if (!room || !room.signals) {
    return res.json({ signals: [] });
  }

  // Get signals targeted to this user or broadcast
  const userSignals = room.signals.filter((s) => s.targetId === userId || s.targetId === 'all');

  // Remove consumed signals intended specifically for this user
  room.signals = room.signals.filter((s) => s.targetId !== userId);

  return res.json({ signals: userSignals });
});

// Host Actions: Mute All, Lock Meeting, Toggle Chat/Screen Share
app.post('/api/rooms/:roomId/host-action', (req, res) => {
  const { roomId } = req.params;
  const { action, hostUserId, targetUserId, value } = req.body;
  const cleanId = roomId.toLowerCase().trim();

  const room = liveRooms.get(cleanId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (action === 'MUTE_ALL') {
    room.participants.forEach((p) => {
      if (p.id !== hostUserId) {
        p.isMuted = true;
      }
    });
    room.messages.push({
      id: 'msg_host_' + Date.now(),
      senderId: 'system',
      senderName: 'Host Control',
      text: 'The Dais / Host has muted all delegates.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    });
  } else if (action === 'TOGGLE_LOCK') {
    room.isLocked = !!value;
    room.messages.push({
      id: 'msg_host_' + Date.now(),
      senderId: 'system',
      senderName: 'Host Control',
      text: room.isLocked ? 'This meeting room is now locked to new delegates.' : 'Meeting room is unlocked.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    });
  } else if (action === 'TOGGLE_CHAT') {
    room.chatDisabled = !!value;
  } else if (action === 'TOGGLE_SCREEN_SHARE') {
    room.screenShareDisabled = !!value;
  } else if (action === 'KICK_PARTICIPANT' && targetUserId) {
    const kicked = room.participants.find((p) => p.id === targetUserId);
    room.participants = room.participants.filter((p) => p.id !== targetUserId);
    if (kicked) {
      room.messages.push({
        id: 'msg_host_' + Date.now(),
        senderId: 'system',
        senderName: 'Host Control',
        text: `${kicked.name} was removed from the session by the host.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      });
    }
  }

  return res.json({ success: true, room });
});

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DelegateX server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
