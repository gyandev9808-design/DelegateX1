import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

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

// Registration API
app.post('/api/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    return res.status(201).json({
      message: 'Account registered successfully.',
      user: {
        id: 'usr_' + Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'DELEGATE',
      },
    });
  } catch {
    return res.status(500).json({ error: 'Registration error.' });
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
  participants: Participant[];
  messages: ChatMessage[];
}

const liveRooms = new Map<string, RoomState>();

// Helper to generate Google Meet style code (e.g. abc-defg-hij)
function generateMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
}

// Create New Live Meeting Room
app.post('/api/rooms/create', (req, res) => {
  try {
    const { title, committee, agenda, hostName, hostRole, hostCountry } = req.body;
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
      participants: [
        {
          id: hostId,
          name: hostName?.trim() || 'Conference Host',
          country: hostCountry?.trim() || 'Dais / President',
          role: hostRole === 'DELEGATE' ? 'DELEGATE' : 'CHAIR',
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
          text: `Welcome to the live session. Committee Room: ${roomId}. Rules of Procedure are in effect.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
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
      participants: [],
      messages: [],
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
