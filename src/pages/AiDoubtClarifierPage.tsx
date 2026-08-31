import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  Bot,
  SendHorizonal,
  Sparkles,
  MessageSquareText,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  HelpCircle,
  BookOpen,
  ArrowLeft,
  Loader2,
  RefreshCw,
  LogIn,
  UserCheck,
  Lock,
  X,
  UserPlus,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ClarificationItem {
  id: string;
  question: string;
  answer: string;
  source?: string;
  time: string;
}

export default function AiDoubtClarifierPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState('');

  const [history, setHistory] = useState<ClarificationItem[]>([
    {
      id: 'init-1',
      question: 'What is the difference between Preambulatory and Operative clauses in a draft resolution?',
      answer: '• Preambulatory Clauses (italicized verbs like *Recalling*, *Deeply concerned*, *Emphasizing*) establish the legal justification, past UN precedents, and moral imperative behind the committee action.\n• Operative Clauses (numbered, underlined verbs like <u>1. Calls upon</u>, <u>2. Authorizes</u>, <u>3. Recommends</u>) mandate specific actions, sub-committees, monitoring frameworks, and resource allocations.',
      source: 'MUN RoP Guide',
      time: 'Just now',
    },
  ]);

  const presetQuestions = [
    'What is GSL and how do I structure a 90-second speech?',
    'What is the difference between Moderated and Unmoderated caucus?',
    'How do I frame a Point of Parliamentary Inquiry vs Point of Order?',
    'How does Veto power work in the UN Security Council?',
    'What are Sponsors vs Signatories on a draft resolution?',
    'How should I prepare for crisis committee backroom directives?',
  ];

  const handleAsk = async (questionToAsk?: string) => {
    const query = (questionToAsk ?? input).trim();
    if (!query || isLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      setPendingQuestion(query);
      setShowAuthModal(true);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-doubt-clarifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      let data: any = {};
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch {
        data = { answer: 'Model UN (MUN) simulates UN diplomacy, procedural motions, moderated and unmoderated caucuses, and resolution drafting.', source: 'local' };
      }

      if (!response.ok && data.error) {
        throw new Error(data.error || 'Failed to clarify query.');
      }

      const newItem: ClarificationItem = {
        id: Date.now().toString(),
        question: query,
        answer: data.answer || 'In MUN proceedings, ensure your query specifies the committee format (UN4MUN vs THIMUN) and relevant sovereign country stance.',
        source: data.source === 'gemini' ? 'Gemini 2.5 Flash' : 'DelegateX Knowledge Engine',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHistory((prev) => [newItem, ...prev]);
      if (!questionToAsk) setInput('');
    } catch (err: any) {
      setError(err.message || 'The clarifier is currently unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="delegate-page min-h-screen text-slate-100 pt-24 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-5 py-10 flex-1 w-full space-y-8">
        {/* Header Title & Auth Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  AI Doubt Clarifier
                </h1>
                <span className="flex items-center gap-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  AI POWERED
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Instant procedural, diplomatic, and policy guidance for Model UN delegates
              </p>
            </div>
          </div>

          {/* Authentication Status Badge or Sign In CTA */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-950/40 px-3.5 py-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <div className="flex flex-col">
                  <span className="font-bold text-cyan-200 leading-tight">
                    {user.name || 'Delegate'}
                  </span>
                  <span className="text-[10px] text-cyan-400/80">Authorized {user.role}</span>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition shadow-md shadow-cyan-500/20"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In to Access Tool</span>
              </Link>
            )}
          </div>
        </div>

        {/* Unauthenticated Notification Banner */}
        {!isAuthenticated && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Delegate Sign-In Required</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sign in or create a free delegate account to unlock unlimited AI clarifications, foreign policy prompts, and RoP analysis.
                </p>
              </div>
            </div>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition shrink-0 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In Now</span>
            </Link>
          </div>
        )}

        {/* Question Input Box */}
        <div className="delegate-panel rounded-3xl p-5 sm:p-7 shadow-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="space-y-3"
          >
            <label htmlFor="clarifier-query" className="text-xs font-semibold text-slate-300 block">
              What MUN rule, speech technique, or foreign policy question do you need help with?
            </label>
            <div className="relative">
              <textarea
                id="clarifier-query"
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask e.g.: 'How do I raise a point of personal privilege?' or 'What are the voting rules for substantive resolutions?'..."
                className="w-full rounded-2xl border border-white/15 bg-slate-950/80 p-4 text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-400">
                Trained on THIMUN, UN4MUN, Harvard MUN, and UN Charter protocols.
              </span>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Clarify Query</span>
                    <SendHorizonal className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Quick preset chips */}
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Popular Delegate Inquiries:
            </p>
            <div className="flex flex-wrap gap-2">
              {presetQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInput(q);
                    handleAsk(q);
                  }}
                  className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:text-cyan-300 hover:border-cyan-300/40 hover:bg-slate-800 transition text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Responses Stream / History */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Clarification Stream ({history.length})
          </h2>

          {history.map((item) => (
            <div
              key={item.id}
              className="delegate-panel rounded-2xl p-5 sm:p-6 space-y-3 transition duration-300"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-start space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-400/10 text-cyan-300 shrink-0 mt-0.5">
                    <MessageSquareText className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {item.question}
                  </h3>
                </div>

                <button
                  onClick={() => copyToClipboard(item.id, item.answer)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition shrink-0"
                  title="Copy answer"
                >
                  {copiedId === item.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Answer Content */}
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2 whitespace-pre-wrap">
                {item.answer}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1.5 text-cyan-400/80 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Source: {item.source || 'AI Engine'}
                </span>
                <span>{item.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Grid */}
        <section className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 md:grid-cols-3">
          {[
            [MessageSquareText, 'Sharper Questions', 'Turn ambiguous points into pointed, parliamentary interventions that command Dais attention.'],
            [ShieldCheck, 'Diplomatic Polish', 'Frame policy defenses with correct diplomatic decorum and UN treaty references.'],
            [Sparkles, 'Crisis Preparedness', 'Quickly compose directives, communique notes, and unmoderated caucus compromise text.'],
          ].map(([Icon, title, desc]) => {
            const FeatureIcon = Icon as typeof MessageSquareText;
            return (
              <div key={title as string} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <FeatureIcon className="h-5 w-5" />
                </div>
                <h4 className="mb-1 text-sm font-bold text-white">{title as string}</h4>
                <p className="text-xs leading-relaxed text-slate-400">{desc as string}</p>
              </div>
            );
          })}
        </section>

        {/* Return to Dashboard */}
        <div className="flex justify-center pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 transition hover:bg-emerald-300 shadow-lg shadow-emerald-500/20"
          >
            <span>Return to Delegate Command Center</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      {/* Sign-In Gate Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-cyan-400/30 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Sign In to Access AI Clarifier
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs">
                To submit custom queries, consult parliamentary rules, and generate AI speeches, please sign in with your Delegate account.
              </p>
            </div>

            {pendingQuestion && (
              <div className="p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-300">
                <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-1">Your Question</span>
                &quot;{pendingQuestion}&quot;
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Link
                to="/auth"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-cyan-300 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200 transition shadow-lg shadow-cyan-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Continue</span>
              </Link>
              <Link
                to="/auth"
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Free Delegate Account</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
