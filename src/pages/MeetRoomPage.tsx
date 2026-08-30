import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Hand,
  MessageSquare,
  Users,
  Info,
  PhoneOff,
  Smile,
  Copy,
  Check,
  Radio,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Maximize,
  Minimize,
  MoreVertical,
  Volume2,
  FileText,
  Send,
  Trash2,
  Shield,
  Layers,
  ChevronRight,
  Settings,
  Grid,
  Square,
} from 'lucide-react';

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

export default function MeetRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const cleanRoomId = (roomId || 'unsc-live-2026').toLowerCase();
  const navigate = useNavigate();

  // Green Room / Pre-join state
  const [isJoined, setIsJoined] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [delegationCountry, setDelegationCountry] = useState('Observer Delegation');
  const [userRole, setUserRole] = useState<'DELEGATE' | 'CHAIR'>('DELEGATE');

  // Media state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isBlurBackground, setIsBlurBackground] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Audio level meter
  const [audioLevel, setAudioLevel] = useState(0);

  // UI Panels
  const [activeSidePanel, setActiveSidePanel] = useState<'CHAT' | 'PEOPLE' | 'INFO' | 'FLOOR' | null>(null);
  const [showReactionsPicker, setShowReactionsPicker] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [isLiveCaptionsOn, setIsLiveCaptionsOn] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewLayout, setViewLayout] = useState<'GRID' | 'SPOTLIGHT'>('GRID');
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);

  // Floating Reactions
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);

  // Room State from Server
  const [roomTitle, setRoomTitle] = useState('UN Security Council Live Floor');
  const [roomAgenda, setRoomAgenda] = useState('Arctic Sovereignty & Environmental Security');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // GSL Committee Floor Clock inside Meet
  const [gslTime, setGslTime] = useState(90);
  const [gslTimeLeft, setGslTimeLeft] = useState(90);
  const [isGslRunning, setIsGslRunning] = useState(false);
  const [gslSpeakers, setGslSpeakers] = useState<string[]>([
    'President of the Council (Chair)',
    'United States of America',
    'French Republic',
    'Federative Republic of Brazil',
  ]);
  const [newSpeakerInput, setNewSpeakerInput] = useState('');
  const [activeMotion, setActiveMotion] = useState('General Speakers List');

  // Whiteboard / Resolution drafting text
  const [draftResolutionText, setDraftResolutionText] = useState(
    `DRAFT RESOLUTION 1.1\nCommittee: UN Security Council\nTopic: Arctic Environmental Navigation Protocols\n\nOperative Clauses:\n1. Calls upon all littoral Arctic States to uphold innocent passage under UNCLOS;\n2. Establishes a multilateral joint environmental monitoring task force;\n3. Urges international scientific collaboration on polar ice shelf preservation.`
  );

  // Video Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const greenRoomVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // User Local ID
  const [localUserId] = useState(() => 'usr_' + Math.random().toString(36).substring(2, 9));

  // 1. Initialize Camera & Mic Media Stream
  const initMediaStream = async (audioEnabled: boolean, videoEnabled: boolean) => {
    try {
      setMediaError(null);
      // Stop old tracks if any
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (!audioEnabled && !videoEnabled) {
        localStreamRef.current = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (greenRoomVideoRef.current) greenRoomVideoRef.current.srcObject = null;
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: audioEnabled,
      });

      localStreamRef.current = stream;

      if (greenRoomVideoRef.current) {
        greenRoomVideoRef.current.srcObject = stream;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Audio analysis for active speaking detection
      if (audioEnabled && stream.getAudioTracks().length > 0) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkAudio = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            }
            animFrameRef.current = requestAnimationFrame(checkAudio);
          };
          checkAudio();
        } catch (e) {
          console.warn('AudioContext visualization warning:', e);
        }
      }
    } catch (err: any) {
      console.warn('Media devices access notice:', err);
      setMediaError(
        'Camera or microphone permission not granted. You can still participate with audio/video off.'
      );
    }
  };

  // Initial media check in green room
  useEffect(() => {
    initMediaStream(isMicOn, isVideoOn);
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Fetch / Sync Room State from Server
  const syncRoomState = async () => {
    try {
      const res = await fetch(`/api/rooms/${cleanRoomId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          if (data.room.title) setRoomTitle(data.room.title);
          if (data.room.agenda) setRoomAgenda(data.room.agenda);
          if (data.room.participants) setParticipants(data.room.participants);
          if (data.room.messages) setChatMessages(data.room.messages);
          if (Array.isArray(data.room.speakersQueue)) setGslSpeakers(data.room.speakersQueue);
        }
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    syncRoomState();
    const interval = setInterval(syncRoomState, 3000);
    return () => clearInterval(interval);
  }, [cleanRoomId]);

  // GSL Timer Loop
  useEffect(() => {
    let interval: any;
    if (isGslRunning && gslTimeLeft > 0) {
      interval = setInterval(() => setGslTimeLeft((prev) => prev - 1), 1000);
    } else if (gslTimeLeft === 0) {
      setIsGslRunning(false);
    }
    return () => clearInterval(interval);
  }, [isGslRunning, gslTimeLeft]);

  // Handle Speech Recognition for Live Captions
  useEffect(() => {
    let recognition: any = null;
    if (isLiveCaptionsOn && isMicOn) {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            setCaptionText(current);
          };
          recognition.onerror = () => {};
          recognition.start();
        } catch {
          // Ignore
        }
      } else {
        setCaptionText('Live captions activated (Transcribing delegate floor speech...)');
      }
    } else {
      setCaptionText('');
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }
    };
  }, [isLiveCaptionsOn, isMicOn]);

  // Toggle Mic
  const toggleMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
    if (isJoined) {
      fetch(`/api/rooms/${cleanRoomId}/participant-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: localUserId, isMuted: !nextState }),
      }).catch(() => {});
    }
  };

  // Toggle Video Camera
  const toggleVideo = async () => {
    const nextState = !isVideoOn;
    setIsVideoOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
    } else if (nextState) {
      await initMediaStream(isMicOn, true);
    }
    if (isJoined) {
      fetch(`/api/rooms/${cleanRoomId}/participant-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: localUserId, isVideoOn: nextState }),
      }).catch(() => {});
    }
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
          }
        };
      } catch {
        // User cancelled picker
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    }
  };

  // Raise Hand / Placard
  const toggleHandRaise = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    triggerReaction(next ? '🙋‍♂️' : '✋');
    fetch(`/api/rooms/${cleanRoomId}/participant-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: localUserId, isHandRaised: next }),
    }).catch(() => {});
  };

  // Trigger Floating Emoji Reaction
  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = Math.floor(Math.random() * 60) + 20; // 20% to 80% width
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  };

  // Join Room Execution
  const handleJoinMeeting = async () => {
    const name = displayName.trim() || 'Delegate';
    const country = delegationCountry.trim() || (userRole === 'CHAIR' ? 'Executive Board' : 'Observer State');

    try {
      await fetch(`/api/rooms/${cleanRoomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: localUserId,
          name,
          country,
          role: userRole,
          isMuted: !isMicOn,
          isVideoOn,
        }),
      });
    } catch {
      // Proceed locally
    }

    setIsJoined(true);

    // Reattach stream to in-call local video element
    setTimeout(() => {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }, 100);
  };

  // Send Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const text = newChatMessage.trim();
    setNewChatMessage('');

    const optimisticMsg: ChatMessage = {
      id: 'msg_local_' + Date.now(),
      senderId: localUserId,
      senderName: displayName.trim() || 'You',
      senderRole: userRole,
      senderCountry: delegationCountry.trim() || 'Delegation',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      await fetch(`/api/rooms/${cleanRoomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: localUserId,
          senderName: displayName.trim() || 'Delegate',
          senderRole: userRole,
          senderCountry: delegationCountry.trim() || 'Delegation',
          text,
        }),
      });
    } catch {}
  };

  // Copy Room Link
  const copyMeetingLink = () => {
    const url = `${window.location.origin}/meet/${cleanRoomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Leave Call
  const handleLeaveCall = async () => {
    try {
      await fetch(`/api/rooms/${cleanRoomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: localUserId }),
      });
    } catch {}

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    navigate('/meet');
  };

  // Format time (mm:ss)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filter other participants
  const otherParticipants = participants.filter((p) => p.id !== localUserId);

  // ----------------------------------------------------
  // VIEW 1: PRE-JOIN GREEN ROOM / LOBBY
  // ----------------------------------------------------
  if (!isJoined) {
    return (
      <div className="delegate-page min-h-screen text-slate-100 flex flex-col justify-between selection:bg-cyan-500/20 selection:text-cyan-200">
        {/* Top bar */}
        <header className="border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/meet"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <PhoneOff className="h-4 w-4 rotate-90" />
            </Link>
            <div>
              <h2 className="font-bold text-white text-sm sm:text-base">Google Meet: {roomTitle}</h2>
              <p className="text-xs text-slate-400 font-mono">Room Code: {cleanRoomId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Live Readiness Check</span>
            </span>
          </div>
        </header>

        {/* Center Green Room */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-8 flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* Left: Video Preview Card */}
          <div className="w-full lg:w-3/5 space-y-4">
            <div className="relative aspect-video w-full rounded-3xl bg-slate-950 border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center group">
              {isVideoOn ? (
                <video
                  ref={greenRoomVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover scale-x-[-1] ${isBlurBackground ? 'blur-md' : ''}`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="h-24 w-24 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 text-3xl font-extrabold shadow-xl shadow-cyan-500/20">
                    {(displayName.trim() || 'D')[0].toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-slate-300">Camera is turned off</p>
                </div>
              )}

              {/* Live Audio Meter on bottom-left */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1.5 border border-white/10 backdrop-blur-md">
                <div className="flex items-end gap-0.5 h-3.5">
                  <span
                    className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(4, (audioLevel * 1.4) % 14)}px` }}
                  />
                  <span
                    className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(4, audioLevel % 14)}px` }}
                  />
                  <span
                    className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(4, (audioLevel * 0.8) % 14)}px` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-300">
                  {isMicOn ? (audioLevel > 10 ? 'Microphone Active' : 'Mic Ready') : 'Muted'}
                </span>
              </div>

              {/* In-Preview Quick Controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full shadow-lg transition active:scale-95 ${
                    isMicOn
                      ? 'bg-slate-900/90 text-white border border-white/20 hover:bg-slate-800'
                      : 'bg-rose-500 text-white shadow-rose-500/30'
                  }`}
                  title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full shadow-lg transition active:scale-95 ${
                    isVideoOn
                      ? 'bg-slate-900/90 text-white border border-white/20 hover:bg-slate-800'
                      : 'bg-rose-500 text-white shadow-rose-500/30'
                  }`}
                  title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setIsBlurBackground(!isBlurBackground)}
                  className={`p-3 rounded-full border border-white/20 transition ${
                    isBlurBackground ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40' : 'bg-slate-900/90 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle background blur effect"
                >
                  <Sparkles className="h-5 w-5" />
                </button>
              </div>
            </div>

            {mediaError && (
              <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl">
                {mediaError}
              </p>
            )}
          </div>

          {/* Right: Join Configuration & Confirmation */}
          <div className="w-full lg:w-2/5 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Ready to join?</h1>
              <p className="text-xs text-slate-400">
                {participants.length > 0
                  ? `${participants.length} delegates and chairs are currently in this session.`
                  : 'No one else is in the call yet. You will be the first.'}
              </p>
            </div>

            <div className="space-y-3.5 delegate-panel p-5 rounded-2xl border border-white/10">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Your Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Assigned Country / Allocation
                </label>
                <input
                  type="text"
                  value={delegationCountry}
                  onChange={(e) => setDelegationCountry(e.target.value)}
                  placeholder="e.g. French Republic, Observer, or Dais"
                  className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Session Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserRole('DELEGATE')}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      userRole === 'DELEGATE'
                        ? 'bg-cyan-300 text-slate-950 shadow'
                        : 'bg-slate-950 border border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    Delegate
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRole('CHAIR')}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      userRole === 'CHAIR'
                        ? 'bg-cyan-300 text-slate-950 shadow'
                        : 'bg-slate-950 border border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    Executive Board / Chair
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleJoinMeeting}
                className="w-full rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/25 transition hover:bg-cyan-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Video className="h-4 w-4" />
                <span>Join Now</span>
              </button>

              <button
                onClick={() => {
                  toggleScreenShare();
                  handleJoinMeeting();
                }}
                className="w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-xs font-semibold text-white hover:bg-white/10 transition flex items-center justify-center gap-2"
              >
                <MonitorUp className="h-4 w-4 text-cyan-300" />
                <span>Present Screen Immediately</span>
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 py-3 px-6 text-center text-xs text-slate-500">
          Google Meet Live Floor Engine · DelegateX Secured Audio & Video
        </footer>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: IN-CALL REAL GOOGLE MEET ROOM
  // ----------------------------------------------------
  return (
    <div className="relative h-screen w-screen bg-[#111315] text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Top Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 rounded-full bg-black/60 border border-white/15 px-3 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold text-white tracking-wide">{roomTitle}</span>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-400/30">
              {cleanRoomId}
            </span>
          </div>

          {isScreenSharing && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
              <MonitorUp className="h-3.5 w-3.5" />
              <span>You are presenting</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setViewLayout(viewLayout === 'GRID' ? 'SPOTLIGHT' : 'GRID')}
            className="flex items-center gap-1.5 rounded-full bg-black/60 border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:text-white backdrop-blur-md transition"
            title="Change Layout"
          >
            {viewLayout === 'GRID' ? <Square className="h-3.5 w-3.5" /> : <Grid className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{viewLayout === 'GRID' ? 'Spotlight' : 'Grid'}</span>
          </button>

          <button
            onClick={copyMeetingLink}
            className="flex items-center gap-1.5 rounded-full bg-black/60 border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:text-white backdrop-blur-md transition"
            title="Copy Joining Link"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Floating Reactions Container */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-20 text-3xl animate-floating-reaction select-none"
            style={{ left: `${item.x}%` }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Live Captions Bar (Google Meet Style) */}
      {isLiveCaptionsOn && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-[90%] bg-black/85 border border-white/15 backdrop-blur-xl p-3.5 rounded-2xl text-center shadow-2xl pointer-events-none transition-all animate-in fade-in">
          <p className="text-xs sm:text-sm font-medium text-white leading-relaxed">
            <span className="text-cyan-300 font-bold mr-2">[{displayName || 'Delegate'}]:</span>
            {captionText || 'Listening for live floor debate...'}
          </p>
        </div>
      )}

      {/* Main Stage: Video Grid + Optional Right Sidebar */}
      <div className="flex-1 flex w-full overflow-hidden p-3 sm:p-4 gap-3">
        {/* Left/Center: Video Grid Area */}
        <div className="flex-1 flex flex-col justify-center items-center h-full overflow-hidden">
          {/* If Screen Share is Active, show Presentation View */}
          {isScreenSharing ? (
            <div className="relative w-full h-full rounded-2xl bg-slate-950 border border-white/10 overflow-hidden flex flex-col items-center justify-center">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 border border-white/15 px-3 py-1.5 rounded-full text-xs font-semibold text-white backdrop-blur-md">
                <MonitorUp className="h-4 w-4 text-cyan-300" />
                <span>Screen Presentation: {displayName || 'Delegate'}</span>
              </div>
              <button
                onClick={toggleScreenShare}
                className="absolute bottom-4 right-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition"
              >
                Stop Presenting
              </button>
            </div>
          ) : (
            /* Multi-User Video Grid */
            <div
              className={`w-full h-full max-h-[calc(100vh-100px)] grid gap-3 p-2 items-center justify-center ${
                otherParticipants.length === 0
                  ? 'grid-cols-1 max-w-4xl'
                  : otherParticipants.length === 1
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-5xl'
                  : otherParticipants.length <= 3
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-6xl'
                  : 'grid-cols-2 sm:grid-cols-3 max-w-7xl'
              }`}
            >
              {/* Local User Video Tile */}
              <div
                className={`relative aspect-video w-full h-full max-h-[520px] rounded-2xl bg-[#1e2023] border overflow-hidden shadow-xl flex items-center justify-center transition-all ${
                  audioLevel > 15 && isMicOn
                    ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                    : 'border-white/10'
                }`}
              >
                {isVideoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`h-full w-full object-cover scale-x-[-1] ${isBlurBackground ? 'blur-md' : ''}`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="h-20 w-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 text-2xl font-extrabold shadow-lg">
                      {(displayName.trim() || 'Y')[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-slate-300">{displayName || 'You'}</span>
                  </div>
                )}

                {/* Local Placard / Hand Raised Badge */}
                {isHandRaised && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-400 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-full shadow-lg animate-bounce">
                    <Hand className="h-3.5 w-3.5" />
                    <span>Placard Raised</span>
                  </div>
                )}

                {/* Local Info Tag */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 border border-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md text-xs font-semibold text-white">
                  <span>{displayName || 'You'} ({delegationCountry || 'Delegate'})</span>
                  {!isMicOn && <MicOff className="h-3 w-3 text-rose-400" />}
                </div>
              </div>

              {/* Remote Participants Tiles */}
              {otherParticipants.map((p) => (
                <div
                  key={p.id}
                  className={`relative aspect-video w-full h-full max-h-[520px] rounded-2xl bg-[#1e2023] border overflow-hidden shadow-xl flex items-center justify-center transition-all ${
                    p.isSpeaking
                      ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                      : 'border-white/10'
                  }`}
                >
                  {p.isVideoOn ? (
                    <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                        <div className="h-20 w-20 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-white text-2xl font-bold">
                          {p.name[0]}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-20 w-20 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-white text-2xl font-bold">
                        {p.name[0]}
                      </div>
                      <span className="text-xs font-semibold text-slate-300">{p.name}</span>
                    </div>
                  )}

                  {/* Remote Hand Raised */}
                  {p.isHandRaised && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-400 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-full shadow-lg">
                      <Hand className="h-3.5 w-3.5" />
                      <span>Placard Raised</span>
                    </div>
                  )}

                  {/* Remote Info Tag */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 border border-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md text-xs font-semibold text-white">
                    <span>{p.name} ({p.country || 'Delegate'})</span>
                    {p.isMuted ? (
                      <MicOff className="h-3 w-3 text-rose-400" />
                    ) : (
                      <Volume2 className="h-3 w-3 text-emerald-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side Panel (Chat, People, Info, or Floor GSL Timer) */}
        {activeSidePanel && (
          <div className="w-80 sm:w-96 h-full bg-[#1e2023] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl z-20 animate-in slide-in-from-right duration-200">
            {/* Side Panel Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeSidePanel === 'CHAT' && <MessageSquare className="h-4 w-4 text-cyan-300" />}
                {activeSidePanel === 'PEOPLE' && <Users className="h-4 w-4 text-cyan-300" />}
                {activeSidePanel === 'FLOOR' && <Clock className="h-4 w-4 text-emerald-400" />}
                {activeSidePanel === 'INFO' && <Info className="h-4 w-4 text-cyan-300" />}
                <h3 className="font-bold text-white text-sm">
                  {activeSidePanel === 'CHAT' && 'In-Call Messages'}
                  {activeSidePanel === 'PEOPLE' && `Participants (${participants.length + (participants.find(p => p.id === localUserId) ? 0 : 1)})`}
                  {activeSidePanel === 'FLOOR' && 'GSL Speaker Clock & Floor'}
                  {activeSidePanel === 'INFO' && 'Joining Information'}
                </h3>
              </div>
              <button
                onClick={() => setActiveSidePanel(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Side Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* CHAT TAB */}
              {activeSidePanel === 'CHAT' && (
                <div className="flex flex-col h-full justify-between">
                  <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
                    <div className="rounded-xl bg-cyan-950/40 border border-cyan-400/20 p-2.5 text-[11px] text-cyan-200">
                      Messages can be seen only by people in the call and are deleted when the call ends.
                    </div>

                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl text-xs space-y-1 ${
                          msg.isSystem
                            ? 'bg-white/5 border border-white/10 text-slate-300 text-center font-mono text-[11px]'
                            : msg.senderId === localUserId
                            ? 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-100 ml-4'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 mr-4'
                        }`}
                      >
                        {!msg.isSystem && (
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-cyan-300">
                              {msg.senderName} ({msg.senderCountry || 'Delegate'})
                            </span>
                            <span>{msg.timestamp}</span>
                          </div>
                        )}
                        <p className="leading-relaxed break-words">{msg.text}</p>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  <form onSubmit={handleSendChat} className="mt-3 flex gap-2 pt-2 border-t border-white/10">
                    <input
                      type="text"
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      placeholder="Send a message to everyone..."
                      className="flex-1 rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300"
                    />
                    <button
                      type="submit"
                      disabled={!newChatMessage.trim()}
                      className="p-2 rounded-xl bg-cyan-300 text-slate-950 disabled:opacity-40 font-bold transition hover:bg-cyan-200"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* PEOPLE TAB */}
              {activeSidePanel === 'PEOPLE' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase">In Call</span>
                    <button
                      onClick={copyMeetingLink}
                      className="text-xs text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Invite</span>
                    </button>
                  </div>

                  {/* You */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-400/20 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-cyan-400/20 border border-cyan-400 flex items-center justify-center text-cyan-300 font-bold text-xs">
                        {(displayName || 'Y')[0]}
                      </div>
                      <div>
                        <p className="font-bold text-white">{displayName || 'You'} (You)</p>
                        <p className="text-[10px] text-slate-400">{delegationCountry} · {userRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      {isMicOn ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5 text-rose-400" />}
                      {isVideoOn ? <Video className="h-3.5 w-3.5 text-slate-300" /> : <VideoOff className="h-3.5 w-3.5 text-rose-400" />}
                    </div>
                  </div>

                  {/* Other participants */}
                  {otherParticipants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs">
                          {p.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.country || 'Delegate'} · {p.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        {p.isMuted ? <MicOff className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FLOOR / GSL CLOCK TAB */}
              {activeSidePanel === 'FLOOR' && (
                <div className="space-y-4">
                  {/* Countdown Clock */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 text-center space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      GSL Floor Speaker
                    </p>
                    <h4 className="text-sm font-bold text-cyan-300">
                      {gslSpeakers[0] || 'Speakers Queue Empty'}
                    </h4>
                    <div className="text-4xl font-mono font-black text-white tracking-tight py-1">
                      {formatTime(gslTimeLeft)}
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => setIsGslRunning(!isGslRunning)}
                        className="p-2.5 rounded-full bg-cyan-300 text-slate-950 font-bold hover:bg-cyan-200 transition"
                      >
                        {isGslRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setIsGslRunning(false);
                          setGslTimeLeft(gslTime);
                        }}
                        className="p-2.5 rounded-full bg-slate-800 text-slate-300 hover:text-white transition"
                        title="Reset Timer"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setGslSpeakers((prev) => prev.slice(1));
                          setGslTimeLeft(gslTime);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                      >
                        Yield
                      </button>
                    </div>
                  </div>

                  {/* Add to GSL Queue */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-300">Speakers Queue ({gslSpeakers.length})</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {gslSpeakers.map((spk, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                        >
                          <span>{idx + 1}. {spk}</span>
                          {idx > 0 && (
                            <button
                              onClick={() => setGslSpeakers(gslSpeakers.filter((_, i) => i !== idx))}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add Delegation to GSL..."
                        value={newSpeakerInput}
                        onChange={(e) => setNewSpeakerInput(e.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300"
                      />
                      <button
                        onClick={() => {
                          if (newSpeakerInput.trim()) {
                            setGslSpeakers([...gslSpeakers, newSpeakerInput.trim()]);
                            setNewSpeakerInput('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-300 text-slate-950 font-bold text-xs hover:bg-cyan-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* INFO TAB */}
              {activeSidePanel === 'INFO' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Meeting Room</span>
                    <p className="text-sm font-bold text-white">{roomTitle}</p>
                    <p className="text-xs text-slate-400 mt-1">{roomAgenda}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-xs text-slate-400">Joining Info</span>
                    <div className="p-3 rounded-xl bg-slate-950 border border-white/10 space-y-2">
                      <p className="font-mono text-xs text-cyan-300 break-all">
                        {window.location.origin}/meet/{cleanRoomId}
                      </p>
                      <button
                        onClick={copyMeetingLink}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold transition"
                      >
                        {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedLink ? 'Joining info copied' : 'Copy joining info'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Reactions Picker Popup */}
      {showReactionsPicker && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#1e2023] border border-white/15 rounded-2xl p-2 shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-in fade-in zoom-in-95">
          {['❤️', '👏', '👍', '💡', '🇺🇳', '🙋‍♂️', '🔥', '🎉'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                triggerReaction(emoji);
                setShowReactionsPicker(false);
              }}
              className="h-10 w-10 flex items-center justify-center text-xl rounded-xl hover:bg-white/10 transition active:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Whiteboard / Resolution Draft Modal */}
      {showWhiteboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e2023] border border-cyan-400/30 max-w-2xl w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-300" />
                <h3 className="font-bold text-white text-base">Collaborative Working Paper & Resolution Scratchpad</h3>
              </div>
              <button
                onClick={() => setShowWhiteboard(false)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Real-time working draft for operative and preambulatory clauses during unmoderated caucus.
            </p>

            <textarea
              rows={12}
              value={draftResolutionText}
              onChange={(e) => setDraftResolutionText(e.target.value)}
              className="w-full font-mono text-xs text-white bg-slate-950 border border-white/15 rounded-2xl p-4 focus:outline-none focus:border-cyan-300 leading-relaxed"
            />

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                {draftResolutionText.length} characters
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(draftResolutionText);
                    alert('Draft Resolution copied to clipboard!');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  Copy Clauses
                </button>
                <button
                  onClick={() => setShowWhiteboard(false)}
                  className="px-5 py-2 rounded-xl bg-cyan-300 text-slate-950 font-bold text-xs hover:bg-cyan-200 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          BOTTOM GOOGLE MEET CONTROL BAR
      ---------------------------------------------------- */}
      <footer className="h-20 bg-[#1e2023] border-t border-white/10 px-4 sm:px-6 flex items-center justify-between z-30 select-none">
        {/* Left: Meeting Time and Room Code */}
        <div className="hidden md:flex items-center gap-3 w-1/4">
          <span className="text-sm font-bold text-white">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-mono text-slate-300 truncate">{cleanRoomId}</span>
        </div>

        {/* Center: Main Media Controls */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-1 md:w-2/4">
          {/* Mic Button */}
          <button
            onClick={toggleMic}
            className={`p-3.5 rounded-full transition shadow-lg active:scale-95 ${
              isMicOn
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-rose-500 text-white shadow-rose-500/30'
            }`}
            title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          {/* Camera Button */}
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-full transition shadow-lg active:scale-95 ${
              isVideoOn
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-rose-500 text-white shadow-rose-500/30'
            }`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          {/* Live Captions (CC) Button */}
          <button
            onClick={() => setIsLiveCaptionsOn(!isLiveCaptionsOn)}
            className={`p-3.5 rounded-full transition hidden sm:flex ${
              isLiveCaptionsOn
                ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Turn on live captions"
          >
            <span className="font-bold text-xs tracking-wider">CC</span>
          </button>

          {/* Reactions Button */}
          <button
            onClick={() => setShowReactionsPicker(!showReactionsPicker)}
            className="p-3.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            title="Send a reaction"
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Screen Sharing / Present Now Button */}
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-full transition ${
              isScreenSharing
                ? 'bg-cyan-400 text-slate-950 shadow-cyan-400/30 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isScreenSharing ? 'Stop presenting' : 'Present now'}
          >
            <MonitorUp className="h-5 w-5" />
          </button>

          {/* Raise Hand / Placard Button */}
          <button
            onClick={toggleHandRaise}
            className={`p-3.5 rounded-full transition shadow-lg ${
              isHandRaised
                ? 'bg-amber-400 text-slate-950 shadow-amber-400/20 scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Raise Placard / Hand"
          >
            <Hand className={`h-5 w-5 ${isHandRaised ? 'animate-bounce' : ''}`} />
          </button>

          {/* Whiteboard / Resolution Draft */}
          <button
            onClick={() => setShowWhiteboard(true)}
            className="p-3.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition hidden lg:flex"
            title="Open Resolution Scratchpad"
          >
            <FileText className="h-5 w-5" />
          </button>

          {/* Leave Call Button (Red) */}
          <button
            onClick={() => setShowEndCallModal(true)}
            className="px-5 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-lg shadow-rose-600/30 active:scale-95 flex items-center justify-center gap-1.5"
            title="Leave call"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>

        {/* Right: Side Panel Toggles */}
        <div className="flex items-center justify-end gap-2 w-1/4">
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'INFO' ? null : 'INFO')}
            className={`p-3 rounded-full transition ${
              activeSidePanel === 'INFO' ? 'bg-cyan-400/20 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Meeting details"
          >
            <Info className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'PEOPLE' ? null : 'PEOPLE')}
            className={`p-3 rounded-full transition relative ${
              activeSidePanel === 'PEOPLE' ? 'bg-cyan-400/20 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Show everyone"
          >
            <Users className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-slate-700 border border-slate-600 text-[9px] font-bold flex items-center justify-center text-slate-200">
              {participants.length + (participants.find(p => p.id === localUserId) ? 0 : 1)}
            </span>
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'CHAT' ? null : 'CHAT')}
            className={`p-3 rounded-full transition ${
              activeSidePanel === 'CHAT' ? 'bg-cyan-400/20 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Chat with everyone"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'FLOOR' ? null : 'FLOOR')}
            className={`p-3 rounded-full transition ${
              activeSidePanel === 'FLOOR' ? 'bg-emerald-400/20 text-emerald-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="GSL Speaker Clock & Committee Activities"
          >
            <Clock className="h-5 w-5" />
          </button>
        </div>
      </footer>

      {/* Confirmation Modal to Leave Call */}
      {showEndCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e2023] border border-white/10 max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-2xl text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <PhoneOff className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-lg">Leave this call?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You can rejoin this committee floor meeting at any time using the room code.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEndCallModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Stay in Call
              </button>
              <button
                onClick={handleLeaveCall}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-500 transition shadow-lg shadow-rose-600/30"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
