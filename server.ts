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
