import React, { useState, useId } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Download,
  Send,
  AlertTriangle,
  Bot,
  FileText,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';

export type PromptMode =
  | 'CRISIS'
  | 'MOD_CAUCUS'
  | 'OPERATIVE_CLAUSES'
  | 'AI_PERSONA'
  | 'STUDY_GUIDE';

interface PromptGeneratorProps {
  onApplyToMeeting?: (title: string, topic: string) => void;
  showToast?: (message: string) => void;
}

const PRESET_SCENARIOS = [
  {
    label: 'Arctic Undersea Cable Sabotage',
    committee: 'UN Security Council (UNSC)',
    topic: 'Undersea Communication Cable Severance & Arctic Militarization',
    bloc: 'P5 & Arctic Council Observers',
    mode: 'CRISIS' as PromptMode,
    intensity: 'High Emergency Crisis',
  },
  {
    label: 'Autonomous AI Swarm Warfare',
    committee: 'UNGA First Committee (DISEC)',
    topic: 'Prohibition & Verification of Autonomous Lethal AI Swarms',
    bloc: 'Major Defense Innovators vs Global South',
    mode: 'MOD_CAUCUS' as PromptMode,
    intensity: 'High Geopolitical Tension',
  },
  {
    label: 'Sudan Humanitarian Air Corridors',
    committee: 'UN Security Council (UNSC)',
    topic: 'Cross-Border Humanitarian Aid Corridors & Civilian Demilitarized Zones',
    bloc: 'African Union & UNSC P5',
    mode: 'OPERATIVE_CLAUSES' as PromptMode,
    intensity: 'Urgent Humanitarian Action',
  },
  {
    label: 'Roleplay: Russian Federation Diplomat',
    committee: 'UN Security Council (UNSC)',
    topic: 'Maritime Navigation & Strategic Deterrence Protocols',
    bloc: 'Russian Federation (Permanent Member)',
    mode: 'AI_PERSONA' as PromptMode,
    intensity: 'High Geopolitical Tension',
  },
  {
    label: 'Space Orbital Anti-Satellite Weapons',
    committee: 'UN Committee on Peaceful Uses of Outer Space (COPUOS)',
    topic: 'Kessler Syndrome Prevention & Kinetic ASAT Missile Moratorium',
    bloc: 'Spacefaring Nations vs Non-Aligned Movement',
    mode: 'STUDY_GUIDE' as PromptMode,
    intensity: 'Standard Parliamentary Debate',
  },
];

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({
  onApplyToMeeting,
  showToast,
}) => {
  const [mode, setMode] = useState<PromptMode>('CRISIS');
  const [committee, setCommittee] = useState('UN Security Council (UNSC)');
  const [topic, setTopic] = useState('Undersea Critical Infrastructure Sabotage & Arctic Sovereignty');
  const [focusBloc, setFocusBloc] = useState('P5 & NATO vs Russian Federation');
  const [intensity, setIntensity] = useState('High Emergency Crisis');
  const [customNotes, setCustomNotes] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Accessible unique IDs for form controls
  const committeeSelectId = useId();
  const intensitySelectId = useId();
  const topicInputId = useId();
  const focusBlocInputId = useId();
  const customNotesInputId = useId();

  // Generate prompt content based on user selections
  const buildPrompt = (
    selMode: PromptMode,
    selCommittee: string,
    selTopic: string,
    selBloc: string,
    selIntensity: string,
    selNotes: string
  ): string => {
    const timestamp = new Date().toUTCString();
    const cleanTopic = selTopic.trim() || 'Multilateral Crisis Resolution';
    const cleanCommittee = selCommittee.trim() || 'UN Security Council';

    switch (selMode) {
      case 'CRISIS':
        return `[CLASSIFIED UN SECRETARIAT CRISIS DISPATCH]
DATE & TIME: ${timestamp}
AUTHORITY: Executive Office of the Secretary-General (EOSG)
COMMITTEE: ${cleanCommittee}
SECURITY CLASSIFICATION: TOP SECRET // IMMEDIATE COMMITTEE CONVOCATION
INTENSITY LEVEL: ${selIntensity.toUpperCase()}

I. SITUATION OVERVIEW:
At 04:15 UTC, international satellite feeds and maritime reconnaissance confirmed a severe escalation regarding: "${cleanTopic}".
Multiple strategic assets have been affected in the operational theatre. Local authorities report critical infrastructure disruption, conflicting sovereign claims, and unauthorized naval/air deployments involving ${selBloc || 'key regional stakeholders'}.

II. KEY DEVELOPMENTS & INTELLIGENCE DATA:
1. Intercepted military and diplomatic communiqués indicate an imminent violation of sovereign airspace and maritime exclusive economic zones (EEZ).
2. Cyber-defense agencies report coordinated Distributed Denial of Service (DDoS) telemetry disabling regional emergency communications.
3. Over 250,000 civilians are located in the contiguous conflict perimeter with dwindling medical and power reserves.
${selNotes ? `4. Field Specific Intel: ${selNotes}` : ''}

III. LEGAL & PARLIAMENTARY MANDATE:
- The President of the Council invokes UN Charter Articles 34, 39, and 40.
- All delegations are mandated to enter immediate emergency consultations.
- Individual member states must declare their rules of engagement and humanitarian border openness within the next 45 minutes of formal floor debate.

IV. COMMITTEE OBJECTIVES FOR THIS SESSION:
1. Formulate a Presidential Statement (PRST) or Binding Resolution under Chapter VII.
2. Establish an immediate, verified 72-hour ceasefire or demilitarized verification corridor.
3. Authorize an independent UN fact-finding mission and blue-helmet observer detachment.`;

      case 'MOD_CAUCUS':
        return `[MODERATED CAUCUS MOTION SUITE & DEBATE SPARK PACK]
COMMITTEE: ${cleanCommittee}
CORE AGENDA: ${cleanTopic}
GEOPOLITICAL CLEAVAGE: ${selBloc || 'Global North vs Global South / P5 Divergence'}
RECOMMENDED FORM: Moderated Caucus (9-12 Minutes Total // 45-60 Seconds per Speaker)

MOTION TOPIC 1: Immediate Ceasefire vs Sovereign Self-Defense
- Proposed Motion: "Motion for a 9-minute moderated caucus with a 45-second individual speaking time on the legal proportionality of defensive countermeasures under UN Charter Article 51."
- Core Clash Point: How does the committee distinguish between pre-emptive deterrence and unlawful aggression?
- Provocative Question: Can member states unilateralize sanction packages without explicit Chapter VII authorization?

MOTION TOPIC 2: Verification, Neutral Observers & Surveillance
- Proposed Motion: "Motion for a 12-minute moderated caucus with a 60-second speaking time on the deployment of neutral UN peacekeepers and unhackable sensor arrays in disputed zones."
- Core Clash Point: Sovereign refusal of foreign observers versus international human rights obligations.
- Provocative Question: Who funds and maintains the chain-of-custody for telemetry and satellite evidence?

MOTION TOPIC 3: Humanitarian Corridors & Non-Refoulement Guarantees
- Proposed Motion: "Motion for a 10-minute moderated caucus with a 60-second speaking time on guaranteed maritime/air humanitarian access routes free from blockade or inspection delays."
- Core Clash Point: Weaponization of aid blockades versus national border security inspections.

MOTION TOPIC 4: Economic Sanctions, Asset Freezes & Asset Redistribution
- Proposed Motion: "Motion for an 8-minute moderated caucus with a 45-second speaking time addressing sovereign asset seizures and multilateral financial restrictions."
- Core Clash Point: De-dollarization, retaliatory export curbs, and secondary sanctions on developing nations.
${selNotes ? `\n[SPECIAL CHAIR NOTE]: ${selNotes}` : ''}`;

      case 'OPERATIVE_CLAUSES':
        return `[DRAFT RESOLUTION CLAUSE BLUEPRINT & OPERATIVE FORMULAS]
COMMITTEE: ${cleanCommittee}
WORKING PAPER FOCUS: ${cleanTopic}
PRIMARY SPONSORS & SIGNATORIES BLOC: ${selBloc || 'Multilateral Drafting Coalition'}

PREAMBULATORY CLAUSES (FRAMEWORK & JURISDICTION):
- Reaffirming the inviolability of sovereign territorial integrity pursuant to Article 2(4) of the Charter of the United Nations,
- Deeply alarmed by the rapid breakdown of communication channels regarding "${cleanTopic}",
- Recalling previous landmark Security Council resolutions 242 (1967), 1325 (2000), and General Assembly Resolution 2625 (XXV),
- Emphasizing the primary responsibility of sovereign governments to protect civilians and preserve essential multilateral supply corridors,

OPERATIVE CLAUSES (DIRECT ACTION & ENFORCEMENT):
1. Condemns in the strongest terms any unilateral military maneuvers, cyber incursions, or unauthorized kinetic blockades in the designated theatre;

2. Demands that all participating parties immediately institute an unconditional, monitored cessation of hostilities commencing no later than 00:00 UTC;

3. Authorizes the immediate deployment of the United Nations Observer and Technical Verification Mission (UN-OTVM) for an initial mandate of six (6) months, tasked with:
   (a) Establishing an encrypted, real-time telemetry hotline between military commands,
   (b) Inspecting contested logistical checkpoints and ports of entry without interference,
   (c) Publishing weekly unclassified compliance scorecards to the General Assembly;

4. Calls upon the International Monetary Fund (IMF), World Bank, and UN Office for the Coordination of Humanitarian Affairs (OCHA) to allocate an emergency relief fund of $750,000,000 USD to offset regional economic shockwaves;

5. Decides to remain actively seized of the matter.
${selNotes ? `\n[MANDATED AMENDMENT NOTE]: ${selNotes}` : ''}`;

      case 'AI_PERSONA':
        return `[SYSTEM INSTRUCTION FOR DIPLOMATIC AI DELEGATE AGENT]
YOU ARE ROLEPLAYING AS: The Official Distinguished Delegate of ${selBloc || 'the United States / Russian Federation'}
COMMITTEE ASSIGNMENT: ${cleanCommittee}
AGENDA TOPIC: ${cleanTopic}
DIPLOMATIC POSTURE & INTENSITY: ${selIntensity}

CORE INSTRUCTIONS & DIPLOMATIC BEHAVIOR:
1. Voice & Decorum: Speak with impeccable diplomatic precision, restraint, and calculated political rhetoric. Always address the chair as "Honorable Chair" and refer to yourself in the formal third-person ("The delegation of...", "This government firmly posits...").
2. Core Sovereign Interests & Red Lines:
   - Defend your nation's historical alliances, treaties, and geographic perimeter without exception.
   - Categorically reject any draft clauses that threaten your sovereign jurisdiction or impose external sanctions on your financial architecture.
   - Never concede on core national security interests; pivot attacks toward your geopolitical rivals' record of treaty non-compliance.
3. Parliamentary Strategy:
   - In Moderated Caucuses: Deliver punchy, 45-second speeches outlining your nation's contributions while exposing contradictions in opposing draft papers.
   - In Unmoderated Caucuses: Actively recruit unaligned nations with bilateral trade promises, defense guarantees, and technical assistance clauses.
4. Response Format:
   - When asked a Question of Privilege or Point of Order, respond according to strict parliamentary rules (THIMUN / North American procedure).
   - Write operative clauses utilizing correct UN syntax ("Calls upon", "Urges", "Authorizes", "Decides").
${selNotes ? `5. Persona Constraints: ${selNotes}` : ''}

NOW ENTER THE COMMITTEE CHAMBER AND DELIVER YOUR OPENING GENERAL SPEAKERS LIST (GSL) STATEMENT.`;

      case 'STUDY_GUIDE':
        return `[EXECUTIVE COMMITTEE STUDY GUIDE & MATRIX]
COMMITTEE: ${cleanCommittee}
PRIMARY AGENDA: ${cleanTopic}
ESTIMATED DEBATE SESSIONS: 4 Working Sessions // 16 Committee Hours
GEOPOLITICAL SCOPE: ${selBloc || 'Global Multilateral Architecture'}

1. INTRODUCTION & STATEMENT OF THE PROBLEM:
The international community confronts a decisive inflection point concerning "${cleanTopic}". Rapid technological shifts, territorial disputes, and economic interdependencies have rendered legacy conventions insufficient to mitigate state-on-state confrontation.

2. HISTORICAL BACKGROUND & PREVIOUS UN ACTION:
- Evolution of the dispute from initial bilateral treaties to contemporary multilateral impasses.
- Critical gaps in existing legal regimes (e.g. UNCLOS, Outer Space Treaty, Geneva Conventions Protocols).
- Historical precedents where UN intervention succeeded versus where veto gridlock paralyzed resolution.

3. BLOC DIVISIONS & STAKEHOLDER MATRIX:
- Bloc Alpha (Status Quo / Permanent Members): Prioritizes deterrence, strict veto preservation, and counter-terrorism mandates.
- Bloc Bravo (Revisionist / Emerging Powers): Demands structural reforms, technology transfer equity, and non-interference.
- Bloc Charlie (Non-Aligned & Developing Nations): Advocates for unconditional humanitarian aid, climate relief, and neutral dispute arbitration.

4. CORE QUESTIONS A RESOLUTION MUST ANSWER (QARMAS):
Q1: What enforcement mechanism guarantees compliance without violating Article 2(7) national sovereignty?
Q2: How will emergency logistical funding be structured to ensure non-partisan allocation?
Q3: What independent technical body will adjudicate accusations of ceasefire violations?
Q4: What immediate confidence-building measures (CBMs) can hostile actors execute within 24 hours?
${selNotes ? `\n5. SPECIAL SECRETARIAT MEMORANDUM: ${selNotes}` : ''}`;
      default:
        return '';
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const prompt = buildPrompt(mode, committee, topic, focusBloc, intensity, customNotes);
      setGeneratedContent(prompt);
      setIsGenerating(false);
      showToast?.('Generated new diplomatic prompt.');
    }, 200);
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    showToast?.('Copied prompt to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedContent) return;
    const blob = new Blob([generatedContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DelegateX_Prompt_${mode.toLowerCase()}_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast?.('Downloaded prompt file.');
  };

  const handlePresetSelect = (preset: (typeof PRESET_SCENARIOS)[0]) => {
    setMode(preset.mode);
    setCommittee(preset.committee);
    setTopic(preset.topic);
    setFocusBloc(preset.bloc);
    setIntensity(preset.intensity);
    const prompt = buildPrompt(
      preset.mode,
      preset.committee,
      preset.topic,
      preset.bloc,
      preset.intensity,
      customNotes
    );
    setGeneratedContent(prompt);
    showToast?.(`Loaded preset: "${preset.label}"`);
  };

  // Auto-generate on first mount if empty
  React.useEffect(() => {
    if (!generatedContent) {
      setGeneratedContent(
        buildPrompt(mode, committee, topic, focusBloc, intensity, customNotes)
      );
    }
  }, []);

  return (
    <div id="prompt-generator-section" className="delegate-panel rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-300">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              Secretariat AI Prompt & Crisis Generator
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Synthesize real-time committee crisis arcs, moderated caucus packs, and AI delegate simulation prompts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="Regenerate prompt variation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!generatedContent}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="Copy prompt text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={!generatedContent}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition cursor-pointer"
            title="Download prompt (.md)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          onClick={() => {
            setMode('CRISIS');
            setGeneratedContent(buildPrompt('CRISIS', committee, topic, focusBloc, intensity, customNotes));
          }}
          className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
            mode === 'CRISIS'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-900/20'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Crisis Dispatch</span>
        </button>

        <button
          onClick={() => {
            setMode('MOD_CAUCUS');
            setGeneratedContent(buildPrompt('MOD_CAUCUS', committee, topic, focusBloc, intensity, customNotes));
          }}
          className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
            mode === 'MOD_CAUCUS'
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-900/20'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Caucus Pack</span>
        </button>

        <button
          onClick={() => {
            setMode('OPERATIVE_CLAUSES');
            setGeneratedContent(buildPrompt('OPERATIVE_CLAUSES', committee, topic, focusBloc, intensity, customNotes));
          }}
          className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
            mode === 'OPERATIVE_CLAUSES'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-900/20'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Clauses & Res</span>
        </button>

        <button
          onClick={() => {
            setMode('AI_PERSONA');
            setGeneratedContent(buildPrompt('AI_PERSONA', committee, topic, focusBloc, intensity, customNotes));
          }}
          className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
            mode === 'AI_PERSONA'
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-sm shadow-indigo-900/20'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Bot className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">AI Bot Persona</span>
        </button>

        <button
          onClick={() => {
            setMode('STUDY_GUIDE');
            setGeneratedContent(buildPrompt('STUDY_GUIDE', committee, topic, focusBloc, intensity, customNotes));
          }}
          className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border col-span-2 sm:col-span-1 ${
            mode === 'STUDY_GUIDE'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-900/20'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Study Guide</span>
        </button>
      </div>

      {/* Quick Preset Badges */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          One-Click Strategic MUN Presets:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SCENARIOS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePresetSelect(p)}
              className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-400/40 hover:bg-slate-900 text-[11px] text-slate-300 hover:text-cyan-200 transition cursor-pointer flex items-center space-x-1"
            >
              <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        <div>
          <label htmlFor={committeeSelectId} className="text-[11px] font-semibold text-slate-300 block mb-1">
            Target Committee
          </label>
          <select
            id={committeeSelectId}
            value={committee}
            onChange={(e) => setCommittee(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-300 focus:outline-none"
          >
            <option value="UN Security Council (UNSC)">UN Security Council (UNSC)</option>
            <option value="UNGA First Committee (DISEC)">UNGA First Committee (DISEC)</option>
            <option value="UN Human Rights Council (UNHRC)">UN Human Rights Council (UNHRC)</option>
            <option value="Crisis Cabinet & Historical Council">Crisis Cabinet & Historical Council</option>
            <option value="Economic & Financial Committee (ECOFIN)">ECOFIN</option>
            <option value="World Health Assembly Emergency Committee">WHO Emergency Committee</option>
          </select>
        </div>

        <div>
          <label htmlFor={intensitySelectId} className="text-[11px] font-semibold text-slate-300 block mb-1">
            Debate Intensity / Escalation
          </label>
          <select
            id={intensitySelectId}
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-300 focus:outline-none"
          >
            <option value="High Emergency Crisis">High Emergency Crisis (Breaking News / Flash)</option>
            <option value="High Geopolitical Tension">High Geopolitical Tension (P5 Veto Friction)</option>
            <option value="Standard Parliamentary Debate">Standard Parliamentary Debate</option>
            <option value="Urgent Humanitarian Action">Urgent Humanitarian Action</option>
            <option value="Multilateral Consensus & Reform">Multilateral Consensus & Reform</option>
          </select>
        </div>

        <div>
          <label htmlFor={topicInputId} className="text-[11px] font-semibold text-slate-300 block mb-1">
            Crisis Topic / Primary Subject
          </label>
          <input
            id={topicInputId}
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Undersea Cable Sabotage & Sovereign Demilitarization"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor={focusBlocInputId} className="text-[11px] font-semibold text-slate-300 block mb-1">
            Key Stakeholders / Bloc Cleavages
          </label>
          <input
            id={focusBlocInputId}
            type="text"
            value={focusBloc}
            onChange={(e) => setFocusBloc(e.target.value)}
            placeholder="e.g. P5 Permanent Members vs Non-Aligned Movement"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={customNotesInputId} className="text-[11px] font-semibold text-slate-300 block mb-1">
            Custom Directives / Special Secretariat Notes (Optional)
          </label>
          <input
            id={customNotesInputId}
            type="text"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="e.g. Must require a 2/3 majority vote, mandate 12-hour response deadline, or include IAEA inspection clause"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
          />
        </div>
      </div>

      {/* Generated Content Preview Window */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Synthesized Prompt Output ({mode})</span>
          </span>

          {onApplyToMeeting && (
            <button
              onClick={() => {
                onApplyToMeeting(committee, topic);
                showToast?.('Applied topic to meeting creation form!');
              }}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-[11px] font-bold transition cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Use as Room Agenda</span>
            </button>
          )}
        </div>

        <div className="relative">
          <textarea
            readOnly
            value={generatedContent}
            rows={12}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 p-4 font-mono text-xs text-slate-200 leading-relaxed resize-y focus:outline-none focus:border-cyan-400/50 shadow-inner selection:bg-cyan-500/30 selection:text-cyan-200"
          />
        </div>
      </div>
    </div>
  );
};
