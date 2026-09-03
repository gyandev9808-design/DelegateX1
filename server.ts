import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'delegatex_super_secret_jwt_key_2026_un_diplomacy';
const JWT_EXPIRES_IN = '7d';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Force JSON header on /api routes
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Intelligent MUN fallback responses
const getMunFallbackReply = (question: string) => {
  const normalized = question.toLowerCase().trim();
  if (/^(hi|hello|hey|greetings|who are you)\b/.test(normalized)) {
    return "Hello! I am DelegateX Clarifier, your dedicated Model UN and diplomatic AI tutor. Ask me about MUN Rules of Procedure (RoP), speechwriting, moderated & unmoderated caucuses, resolution clauses, crisis notes, points and motions, country stances, or any diplomatic questions.";
  }
  if (normalized.includes("sponsor") || normalized.includes("signator")) {
    return "• **Sponsors**: Delegations that actively author, draft, and agree with the entire content of a draft resolution. Usually 2 to 5 per paper.\n• **Signatories**: Delegations that wish to see the draft resolution introduced on the floor for formal debate and voting, regardless of whether they support all clauses. Usually requires 20–25% of the committee.";
  }
  if (normalized.includes("what is mun") || normalized.includes("what does mun mean") || normalized.includes("model united nations")) {
    return "Model United Nations (MUN) is an academic simulation of UN committees where delegates represent sovereign nations or historical figures. Delegates debate global agendas, caucus with allies, draft resolutions, and vote under formal Rules of Procedure (RoP).";
  }
  if (normalized.includes("gsl") || normalized.includes("general speakers list") || normalized.includes("general speaker")) {
    return "The **General Speakers List (GSL)** is the default formal debate list in committee:\n• **Purpose**: Establish your delegation's core stance on the agenda item.\n• **Time Limit**: Usually 60 or 90 seconds per speaker.\n• **Structure**: Hook (15s) → National Policy & Past Actions (45s) → Multilateral Proposals (30s).\n• **Yielding**: If remaining time exceeds 10s, yield to: the Chair, Questions (Points of Information), or another delegate.";
  }
  if (normalized.includes("moderated caucus") || normalized.includes("mod caucus")) {
    return "A **Moderated Caucus** is a focused debate on a specific sub-agenda:\n• **Motion format**: *\"The Delegation of [Country] moves for a Moderated Caucus of [Total Time, e.g. 9 minutes] with an individual speaker's time of [Time, e.g. 45 seconds] on the topic of [Specific Subtopic].\"*\n• **Chair Role**: Recognizes delegates with raised placards one at a time.\n• **Goal**: Delve into specific points of contention without going into broad generalities.";
  }
  if (normalized.includes("unmoderated caucus") || normalized.includes("unmod")) {
    return "An **Unmoderated Caucus (Unmod)** is an informal working session:\n• **Format**: Delegates stand up, move freely around the room, form regional/ideological blocs, and author working papers/resolutions.\n• **Motion format**: *\"The Delegation of [Country] moves for an Unmoderated Caucus for a total time of [e.g. 15 minutes].\"*\n• **Strategy**: Identify lead sponsors early, divide clause drafting responsibilities, and negotiate with undecided signatory countries.";
  }
  if (normalized.includes("point of order") || normalized.includes("point of information") || normalized.includes("point of personal privilege") || normalized.includes("parliamentary inquiry") || normalized.includes("points")) {
    return "The 4 fundamental **Points** in Model UN:\n1. **Point of Personal Privilege**: Raised when there is physical/environmental discomfort (e.g. audibility, room temperature, screen visibility). *Can interrupt a speaker ONLY if audibility is impaired.*\n2. **Point of Order**: Raised immediately when the Chair or a delegate violates formal Rules of Procedure.\n3. **Point of Parliamentary Inquiry**: A question to the Dais regarding procedural rules or the current state of debate.\n4. **Point of Information**: A direct substantive question directed to a delegate who has just completed their speech and yielded to questions.";
  }
  if (normalized.includes("resolution") || normalized.includes("draft resolution") || normalized.includes("clause") || normalized.includes("preamb")) {
    return "A **Draft Resolution** is the official solution document of a committee:\n\n• **Preambulatory Clauses** *(Italicized verbs, ending in commas)*:\nState the context, historical treaties, and justification.\n*Examples*: *Guided by* the UN Charter, *Recalling* resolution 242, *Deeply concerned by*...\n\n• **Operative Clauses** *(Numbered, underlined verbs, ending in semicolons, final clause ending in a period)*:\nDirect tangible actions, funding, commissions, or mandates.\n*Examples*: <u>1. Calls upon</u> Member States to..., <u>2. Authorizes</u> the dispatch of..., <u>3. Decides</u> to remain seized of the matter.";
  }
  if (normalized.includes("veto") || normalized.includes("p5") || normalized.includes("security council")) {
    return "The **P5 Veto Power** in the UN Security Council (UNSC):\n• Held by: **United States, United Kingdom, France, China, and the Russian Federation**.\n• Under UN Charter Article 27(3), substantive resolutions require 9 affirmative votes and **NO negative votes** from any P5 member.\n• An abstention by a P5 member does **not** count as a veto.";
  }
  if (normalized.includes("crisis") || normalized.includes("directive") || normalized.includes("backroom") || normalized.includes("portfolio")) {
    return "In **Crisis Committees**:\n• **Portfolio Powers**: Use your character/country's unique personal assets (troops, state intelligence, media control, private capital).\n• **Directives**: Orders signed by multiple delegates to execute committee actions in the real-time simulation.\n• **Personal Crisis Notes**: Secret written directives sent to the Backroom Crisis Staff to build leverage, acquire assets, or launch strategic actions.\n• **Speed & Adaptability**: React dynamically as crisis updates break onto the floor.";
  }
  if (normalized.includes("opening speech") || normalized.includes("speech") || normalized.includes("hook")) {
    return "Framework for a winning **Opening Speech (90 seconds)**:\n1. **Hook (15s)**: A compelling sovereign principle, striking metric, or historical quote.\n2. **National Stance (35s)**: Clear position of your country, past actions taken, and national constraints.\n3. **Action Pillars (30s)**: Propose 2–3 tangible solutions (e.g. multilateral monitoring, sovereign aid fund, regulatory framework).\n4. **Call to Unity (10s)**: Invite like-minded delegations to collaborate in the upcoming unmoderated caucus.";
  }
  if (normalized.includes("voting") || normalized.includes("roll call") || normalized.includes("majority") || normalized.includes("substantive") || normalized.includes("procedural")) {
    return "MUN **Voting Rules**:\n• **Procedural Votes** (e.g. motions for caucuses, adjournment): All delegates must vote 'Yes' or 'No'. No abstentions allowed. Requires Simple Majority (>50%).\n• **Substantive Votes** (e.g. draft resolutions, amendments): Delegates can vote 'Yes', 'No', 'Abstain', or 'Pass' (on first round of Roll Call). Requires simple majority or 2/3 majority depending on committee rules.";
  }
  if (normalized.includes("amendment") || normalized.includes("friendly") || normalized.includes("unfriendly")) {
    return "• **Friendly Amendment**: Agreed to by **all** primary sponsors of the draft resolution. Integrated automatically into the text without requiring committee floor debate or vote.\n• **Unfriendly Amendment**: Proposed by other delegates and not accepted by all sponsors. Requires a specific number of signatories and must be debated and voted upon before voting on the draft resolution as a whole.";
  }
  if (normalized.includes("position paper") || normalized.includes("research")) {
    return "A **Position Paper** consists of 3 distinct sections:\n1. **Topic Background**: Brief global summary of the agenda item.\n2. **National Policy**: Your country's past resolutions, domestic laws, and sovereign treaties.\n3. **Proposed Solutions**: Concrete, creative operative actions your delegation intends to champion during committee.";
  }
  // Generic intelligent breakdown for specific custom questions
  return `Based on your question ("${question.replace(/"/g, '')}"):

• **Key Diplomatic Principle**: In international negotiations, align your position with the relevant UN Charter articles, treaty frameworks, and committee mandate.
• **Procedural Best Practice**: Always establish whether the action is recommendatory (General Assembly) or binding (UN Security Council under Chapter VII).
• **Actionable Advice**: Frame your response around three pillars: (1) Sovereign legitimacy, (2) Multilateral consensus, and (3) Concrete monitoring and implementation mechanisms.`;
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
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const systemInstruction = `You are DelegateX AI Diplomatic Clarifier, an expert Model United Nations (MUN) diplomat, Secretariat Chair, speech coach, and international affairs tutor.
Your primary directive is to directly, accurately, and thoroughly answer the specific question asked by the user.
- Provide practical, authoritative, and actionable answers tailored precisely to the question.
- Cover MUN Rules of Procedure (UN4MUN, THIMUN, Harvard MUN), caucus motions, draft resolutions (preambulatory and operative clauses), speaking techniques, crisis backroom strategies, voting thresholds, P5 veto rules, or foreign policy positions as relevant to what the user asked.
- If the question is about a specific diplomatic or general topic, answer it directly and factually.
- Keep responses clear, structured, engaging, and readable using bullet points, numbered steps, or bold headers where appropriate.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
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

// POST /api/auth/profile - Update user profile (e.g. name / username)
app.post('/api/auth/profile', authenticateJwtMiddleware, (req, res) => {
  try {
    const authUser = (req as any).user;
    const { name, title, country, committee } = req.body;
    const emailKey = authUser.email?.toLowerCase();

    let existing = accountsStore.get(emailKey);
    if (!existing) {
      existing = {
        id: authUser.id || 'usr_' + Date.now(),
        name: name?.trim() || authUser.name || 'Delegate',
        email: emailKey,
        role: authUser.role || 'DELEGATE',
        title: title || authUser.title || 'Distinguished Delegate',
        country: country || authUser.country || 'United States',
        committee: committee || authUser.committee || 'UN Security Council (UNSC)',
        passwordHash: '',
        createdAt: Date.now(),
      };
    } else {
      if (name && typeof name === 'string' && name.trim().length >= 1) {
        existing.name = name.trim();
      }
      if (title && typeof title === 'string') {
        existing.title = title.trim();
      }
      if (country && typeof country === 'string') {
        existing.country = country.trim();
      }
      if (committee && typeof committee === 'string') {
        existing.committee = committee.trim();
      }
    }

    accountsStore.set(emailKey, existing);
    const newToken = generateJwtToken(existing);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      token: newToken,
      user: {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        role: existing.role,
        title: existing.title,
        country: existing.country,
        committee: existing.committee,
        avatarColor: existing.avatarColor,
        createdAt: existing.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Helper to remove all accounts with DELEGATE role
const purgeAllDelegateAccounts = () => {
  let count = 0;
  for (const [email, account] of accountsStore.entries()) {
    if (account.role === 'DELEGATE') {
      accountsStore.delete(email);
      count++;
    }
  }
  return count;
};

// Initial purge of all delegate accounts
purgeAllDelegateAccounts();

// POST /api/auth/purge-delegates - Purge all delegate accounts from system
app.post('/api/auth/purge-delegates', (req, res) => {
  try {
    const deletedCount = purgeAllDelegateAccounts();
    return res.json({
      success: true,
      message: `Successfully removed all ${deletedCount} delegate accounts from the system.`,
      deletedCount,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to purge delegate accounts.' });
  }
});
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role, title, country, committee, secretariatPasskey } = req.body;
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

    let assignedRole: 'MASTER_ADMIN' | 'ADMIN' | 'CHAIR' | 'DELEGATE' = role || (cleanEmail === 'gyan.dev9808@gmail.com' || cleanEmail.includes('admin') ? 'ADMIN' : 'DELEGATE');

    if (assignedRole === 'ADMIN' || assignedRole === 'MASTER_ADMIN' || assignedRole === 'CHAIR') {
      const cleanKey = (secretariatPasskey || '').trim();
      const isAuthorized = cleanKey === 'AdminSecretariat2026!' || cleanKey === 'Secretariat2026!' || cleanEmail === 'gyan.dev9808@gmail.com' || cleanEmail.includes('admin');
      if (!isAuthorized) {
        return res.status(403).json({ error: 'Invalid Secretariat Passkey. An authorized passkey is required to create an Admin account.' });
      }
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser: StoredUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      email: cleanEmail,
      role: assignedRole,
      title: title || (assignedRole === 'MASTER_ADMIN' ? 'Secretary-General & Master Admin' : assignedRole === 'ADMIN' ? 'Secretariat Administrator' : assignedRole === 'CHAIR' ? 'Executive Board Chair' : 'Distinguished Delegate'),
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

// Helper function to dispatch verification email via Nodemailer (Gmail or Custom SMTP)
async function sendVerificationEmail(toEmail: string, code: string, token: string): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.EMAIL_FROM || (gmailUser ? `DelegateX Security <${gmailUser}>` : 'DelegateX Security <no-reply@delegatex.org>');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f1f5f9; padding: 20px; }
          .card { max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #67e8f9; letter-spacing: -0.5px; }
          .sub { font-size: 13px; color: #94a3b8; margin-top: 4px; }
          .code-box { background: #0f172a; border: 1px solid #06b6d4; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0; }
          .code { font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #22d3ee; font-family: monospace; }
          .expiry { font-size: 12px; color: #94a3b8; margin-top: 10px; }
          .footer { margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">DelegateX Security</div>
            <div class="sub">Model UN Diplomatic Intelligence & Chambers</div>
          </div>
          <p style="font-size: 15px; color: #e2e8f0; line-height: 1.5;">Hello Diplomat,</p>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
            We received a request to verify your account credentials. Please enter the following 6-digit verification code into the application:
          </p>
          <div class="code-box">
            <div class="code">${code}</div>
            <div class="expiry">Expires in 15 minutes • Single-use code</div>
          </div>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
            If you did not request this verification code, please ignore this email or reset your password immediately.
          </p>
          <div class="footer">
            © 2026 DelegateX MUN Security Verification Dispatch. Sent to ${toEmail}.
          </div>
        </div>
      </body>
    </html>
  `;

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });
      await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: `[DelegateX] Your Verification Code is ${code}`,
        text: `Your DelegateX verification code is: ${code}. This code expires in 15 minutes.`,
        html: htmlContent,
      });
      console.log(`[EMAIL DISPATCH] Successfully sent email to ${toEmail} via Gmail.`);
      return true;
    } catch (e) {
      console.error(`[EMAIL DISPATCH ERROR] Failed to send via Gmail SMTP:`, e);
    }
  } else if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: `[DelegateX] Your Verification Code is ${code}`,
        text: `Your DelegateX verification code is: ${code}. This code expires in 15 minutes.`,
        html: htmlContent,
      });
      console.log(`[EMAIL DISPATCH] Successfully sent email to ${toEmail} via custom SMTP.`);
      return true;
    } catch (e) {
      console.error(`[EMAIL DISPATCH ERROR] Failed to send via custom SMTP:`, e);
    }
  } else {
    console.log(`[EMAIL DISPATCH TO ${toEmail}] Fresh verification code: ${code} generated at ${new Date().toISOString()}`);
  }
  return false;
}

// POST /api/auth/forgot-password - Generate password reset token and verification code sent to email
app.post('/api/auth/forgot-password', async (req, res) => {
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

    // Dispatch email directly to the recipient without leaking the code to client response
    await sendVerificationEmail(cleanEmail, resetCode, resetToken);

    return res.json({
      success: true,
      message: `A fresh 6-digit verification code has been dispatched directly to ${cleanEmail}. Please check your email inbox (including Spam/Junk folder).`,
      email: cleanEmail,
      expiresInMinutes: 15,
      generatedAt: generatedTime,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to initiate password reset.' });
  }
});

// POST /api/auth/send-email-code - Explicit email code dispatcher with fresh code regeneration every time
app.post('/api/auth/send-email-code', async (req, res) => {
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
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

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

    // Dispatch email directly
    await sendVerificationEmail(cleanEmail, freshCode, freshToken);

    return res.json({
      success: true,
      message: `A fresh single-use verification code has been generated and dispatched directly to ${cleanEmail}. Please check your email inbox.`,
      email: cleanEmail,
      purpose: purpose || 'Verification',
      expiresInMinutes: 15,
      generatedAt: generatedTime,
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

    const requestedCode = (req.body.roomId || req.body.code)?.toString().toLowerCase().trim();
    const roomId = requestedCode || generateMeetCode();

    // Enforce only one server per meeting code - return existing instance if already created
    if (liveRooms.has(roomId)) {
      const existingRoom = liveRooms.get(roomId)!;
      return res.status(200).json({
        roomId,
        room: existingRoom,
        hostId: existingRoom.hostId,
        alreadyExists: true,
        message: 'Connected to existing meeting server',
      });
    }

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

// Delete Meeting Room
app.delete('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const cleanId = roomId.toLowerCase().trim();
  const existed = liveRooms.delete(cleanId);
  return res.json({ success: true, deleted: existed });
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

// Delete specific chat message in a room
app.delete('/api/rooms/:roomId/messages/:messageId', (req, res) => {
  const { roomId, messageId } = req.params;
  const cleanId = roomId.toLowerCase().trim();

  const room = liveRooms.get(cleanId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const initialLen = room.messages.length;
  room.messages = room.messages.filter((m) => m.id !== messageId);

  return res.json({ success: true, deleted: room.messages.length < initialLen });
});

// Clear all chat messages in a room
app.delete('/api/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const cleanId = roomId.toLowerCase().trim();

  const room = liveRooms.get(cleanId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  room.messages = [];
  return res.json({ success: true, count: 0 });
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

// Fallback JSON 404 handler for unmatched /api requests
app.all('/api/*', (req, res) => {
  return res.status(404).json({ error: `Endpoint ${req.method} ${req.path} not found` });
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
