import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

interface ClarificationItem {
  id: string;
  question: string;
  answer: string;
  source?: string;
  time: string;
}

export default function AiDoubtClarifierPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-doubt-clarifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clarify query.');
      }

      const newItem: ClarificationItem = {
        id: Date.now().toString(),
        question: query,
        answer: data.answer,
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
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
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
        </div>

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
    </div>
  );
}
