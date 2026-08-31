import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Hand,
  MessageSquare,
  Users,
  Info,
  Clock,
  Send,
  Copy,
  Check,
  RotateCcw,
  Play,
  Pause,
  Smile,
  Shield,
  FileText,
  Volume2,
  Trash2,
  Radio,
  Sliders,
  Maximize,
  Minimize,
  MoreVertical,
  DoorOpen,
  Pin,
  PinOff,
  Crown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { soundEffects } from '../components/meet/AudioChimes';
import DeviceSettingsModal, { DeviceSettings } from '../components/meet/DeviceSettingsModal';
import WhiteboardModal from '../components/meet/WhiteboardModal';
import HostControlsModal from '../components/meet/HostControlsModal';
import BreakoutRoomsModal from '../components/meet/BreakoutRoomsModal';

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
  isLocked?: boolean;
  chatDisabled?: boolean;
  screenShareDisabled?: boolean;
  participants: Participant[];
  messages: ChatMessage[];
  breakouts?: { id: string; name: string }[];
}

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

// WebRTC ICE Servers
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function MeetRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const cleanRoomId = (roomId || 'unsc-live').toLowerCase().trim();

  // --- LOBBY / PRE-JOIN STATE ---
  const [isInLobby, setIsInLobby] = useState<boolean>(true);
  const [localUserName, setLocalUserName] = useState<string>(
    () => localStorage.getItem('mun_user_name') || 'Diplomatic Delegate'
  );
  const [localCountry, setLocalCountry] = useState<string>(
    () => localStorage.getItem('mun_user_country') || 'France'
  );
  const [localRole, setLocalRole] = useState<'CHAIR' | 'DELEGATE'>('DELEGATE');
  const [lobbyAudioLevel, setLobbyAudioLevel] = useState<number>(0);

  // --- LOCAL USER MEDIA STATE ---
  const [localUserId] = useState<string>(
    () => 'usr_' + Math.random().toString(36).substring(2, 9)
  );
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLiveCaptionsOn, setIsLiveCaptionsOn] = useState<boolean>(false);
  const [liveCaptionsText, setLiveCaptionsText] = useState<string>('');

  // --- DEVICE SETTINGS & VIRTUAL BACKGROUND ---
  const [deviceSettings, setDeviceSettings] = useState<DeviceSettings>({
    audioInputId: 'default',
    audioOutputId: 'default',
    videoInputId: 'default',
    videoResolution: '720p',
    noiseCancellation: true,
    echoCancellation: true,
    virtualBackground: 'none',
  });

  // --- MODALS STATE ---
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showWhiteboard, setShowWhiteboard] = useState<boolean>(false);
  const [showHostControls, setShowHostControls] = useState<boolean>(false);
  const [showBreakoutModal, setShowBreakoutModal] = useState<boolean>(false);
  const [showEndCallModal, setShowEndCallModal] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  // --- CAUCUS & RESOLUTION STATE ---
  const [currentBreakoutName, setCurrentBreakoutName] = useState<string>('Plenary Main Chamber');
  const [activeBreakoutId, setActiveBreakoutId] = useState<string | null>(null);
  const [draftResolutionText, setDraftResolutionText] = useState<string>(
    `DRAFT RESOLUTION 1.1\nCOMMITTEE: UN Security Council\nAGENDA: Multilateral Maritime Protocols\nSPONSORS: France, United Kingdom\nSIGNATORIES: Japan, Ghana, Switzerland\n\nThe Security Council,\nReaffirming its commitment to the UN Charter and peaceful dispute settlement,\n\n1. Calls upon all Member States to uphold international maritime conventions;\n2. Authorizes the establishment of multilateral observer corridors;\n3. Urges immediate humanitarian access in contested sectors.`
  );

  // --- MEDIA REFS ---
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const lobbyVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const [remoteStreamKeys, setRemoteStreamKeys] = useState<number>(0); // force re-render when remote streams update

  // Audio meter
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micLevelInterval = useRef<any>(null);

  // --- ROOM / MEETING STATE ---
  const [roomTitle, setRoomTitle] = useState<string>('UN Security Council Live Session');
  const [roomAgenda, setRoomAgenda] = useState<string>('Maritime Security & Rules of Procedure');
  const [hostId, setHostId] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [chatDisabled, setChatDisabled] = useState<boolean>(false);
  const [screenShareDisabled, setScreenShareDisabled] = useState<boolean>(true);
  const [showScreenShareRestrictedModal, setShowScreenShareRestrictedModal] = useState<boolean>(false);

  const currentUserRole = localStorage.getItem('mun_user_role') || 'DELEGATE';
  const currentUserEmail = (localStorage.getItem('mun_user_email') || '').toLowerCase();
  const isChairOrAdmin =
    localRole === 'CHAIR' ||
    currentUserRole === 'ADMIN' ||
    currentUserRole === 'MASTER_ADMIN' ||
    currentUserRole === 'CHAIR' ||
    currentUserEmail === 'gyan.dev9808@gmail.com' ||
    currentUserEmail.includes('admin') ||
    currentUserEmail.includes('sec');

  // Participants & Chat
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Side Panel Toggle
  const [activeSidePanel, setActiveSidePanel] = useState<'CHAT' | 'PEOPLE' | 'FLOOR' | 'INFO' | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Emoji Reactions
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [showReactionsPicker, setShowReactionsPicker] = useState<boolean>(false);

  // GSL Timer
  const [gslSpeakers, setGslSpeakers] = useState<string[]>([
    'France (Executive Board)',
    'United Kingdom',
    'United States',
    'Japan',
  ]);
  const [gslTime, setGslTime] = useState<number>(90);
  const [gslTimeLeft, setGslTimeLeft] = useState<number>(90);
  const [isGslRunning, setIsGslRunning] = useState<boolean>(false);
  const [newSpeakerInput, setNewSpeakerInput] = useState<string>('');

  // ----------------------------------------------------
  // 1. INITIALIZE LOCAL MEDIA (CAMERA & MIC)
  // ----------------------------------------------------
  const initLocalMedia = async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: deviceSettings.echoCancellation,
          noiseSuppression: deviceSettings.noiseCancellation,
          deviceId: deviceSettings.audioInputId !== 'default' ? { exact: deviceSettings.audioInputId } : undefined,
        },
        video: {
          width: deviceSettings.videoResolution === '1080p' ? 1920 : deviceSettings.videoResolution === '720p' ? 1280 : 640,
          height: deviceSettings.videoResolution === '1080p' ? 1080 : deviceSettings.videoResolution === '720p' ? 720 : 480,
          deviceId: deviceSettings.videoInputId !== 'default' ? { exact: deviceSettings.videoInputId } : undefined,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      // Apply initial tracks state
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOn;
      });

      if (lobbyVideoRef.current) {
        lobbyVideoRef.current.srcObject = stream;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize audio level meter
      setupAudioMeter(stream);
    } catch (err) {
      console.warn('Microphone or Camera access restricted:', err);
    }
  };

  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      if (micLevelInterval.current) clearInterval(micLevelInterval.current);

      micLevelInterval.current = setInterval(() => {
        if (!analyserRef.current || !isMicOn) {
          setLobbyAudioLevel(0);
          return;
        }
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setLobbyAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
      }, 100);
    } catch (e) {
      console.warn('Audio analyser setup notice:', e);
    }
  };

  useEffect(() => {
    initLocalMedia();

    return () => {
      if (micLevelInterval.current) clearInterval(micLevelInterval.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [deviceSettings.audioInputId, deviceSettings.videoInputId, deviceSettings.videoResolution]);

  // Sync video elements when stream or video status updates
  useEffect(() => {
    if (localStreamRef.current) {
      if (lobbyVideoRef.current && lobbyVideoRef.current.srcObject !== localStreamRef.current) {
        lobbyVideoRef.current.srcObject = localStreamRef.current;
      }
      if (localVideoRef.current && localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  }, [isInLobby, isVideoOn]);

  // ----------------------------------------------------
  // 2. TOGGLE MEDIA CONTROLS
  // ----------------------------------------------------
  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = next));
    }
    updateParticipantState({ isMuted: !next });
  };

  const toggleVideo = () => {
    const next = !isVideoOn;
    setIsVideoOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = next));
    }
    updateParticipantState({ isVideoOn: next });
  };

  const toggleHandRaise = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    if (next) {
      soundEffects.playHandRaiseChime();
      triggerReaction('🙋‍♂️');
      // Add user to GSL Speaker queue
      if (!gslSpeakers.includes(localUserName)) {
        setGslSpeakers((prev) => [...prev, `${localUserName} (${localCountry})`]);
      }
    }
    updateParticipantState({ isHandRaised: next });
  };

  const toggleScreenShare = async () => {
    if (!isChairOrAdmin && screenShareDisabled && !isScreenSharing) {
      setShowScreenShareRestrictedModal(true);
      return;
    }

    if (isScreenSharing) {
      // Stop screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      // Replace tracks in peer connections back to camera
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        // Replace tracks in WebRTC peer connections with screen track
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender && screenTrack) {
            sender.replaceTrack(screenTrack);
          }
        });
      } catch (err) {
        console.warn('Screen share canceled or not supported:', err);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // ----------------------------------------------------
  // 3. JOINING & LEAVING THE ROOM
  // ----------------------------------------------------
  const handleJoinMeeting = async () => {
    localStorage.setItem('mun_user_name', localUserName);
    localStorage.setItem('mun_user_country', localCountry);

    try {
      const res = await fetch(`/api/rooms/${cleanRoomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: localUserId,
          name: localUserName,
          country: localCountry,
          role: localRole,
          isMuted: !isMicOn,
          isVideoOn: isVideoOn,
        }),
      });
      const data = await res.json();
      if (data.room) {
        setRoomTitle(data.room.title || 'UN Security Council Session');
        setRoomAgenda(data.room.agenda || 'Multilateral Agenda');
        setHostId(data.room.hostId || '');
        setIsLocked(!!data.room.isLocked);
        setChatDisabled(!!data.room.chatDisabled);
        setScreenShareDisabled(!!data.room.screenShareDisabled);
        setParticipants(data.room.participants || []);
        setChatMessages(data.room.messages || []);
        if (data.room.speakersQueue?.length) {
          setGslSpeakers(data.room.speakersQueue);
        }
      }
    } catch {
      // Local fallback
    }

    soundEffects.playJoinChime();
    setIsInLobby(false);
  };

  const handleLeaveCall = async () => {
    try {
      await fetch(`/api/rooms/${cleanRoomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: localUserId }),
      });
    } catch {}

    soundEffects.playLeaveChime();
    navigate('/meet');
  };

  // Update participant state on server
  const updateParticipantState = async (updates: Partial<Participant>) => {
    try {
      await fetch(`/api/rooms/${cleanRoomId}/participant-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localUserId,
          ...updates,
        }),
      });
    } catch {}
  };

  // ----------------------------------------------------
  // 4. WebRTC MESH PEER CONNECTIONS & SIGNALING
  // ----------------------------------------------------
  const sendSignal = async (targetId: string, type: 'offer' | 'answer' | 'candidate', data: any) => {
    try {
      await fetch(`/api/rooms/${cleanRoomId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId,
          senderId: localUserId,
          senderName: localUserName,
          type,
          data,
        }),
      });
    } catch (e) {
      console.warn('Signal send error:', e);
    }
  };

  const createPeerConnection = (remoteUserId: string): RTCPeerConnection => {
    if (peerConnectionsRef.current.has(remoteUserId)) {
      return peerConnectionsRef.current.get(remoteUserId)!;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(remoteUserId, 'candidate', event.candidate);
      }
    };

    // On Track received from remote peer
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      remoteStreamsRef.current.set(remoteUserId, remoteStream);
      setRemoteStreamKeys((k) => k + 1);
    };

    peerConnectionsRef.current.set(remoteUserId, pc);
    return pc;
  };

  // Poll room state & signals periodically
  useEffect(() => {
    if (isInLobby) return;

    const interval = setInterval(async () => {
      try {
        // Fetch Room Sync
        const roomRes = await fetch(`/api/rooms/${cleanRoomId}`);
        const roomData = await roomRes.json();
        if (roomData.room) {
          const r: RoomState = roomData.room;
          setRoomTitle(r.title);
          setRoomAgenda(r.agenda);
          setHostId(r.hostId);
          setIsLocked(!!r.isLocked);
          setChatDisabled(!!r.chatDisabled);
          setScreenShareDisabled(!!r.screenShareDisabled);

          // Update participants list (excluding self)
          const otherParticipants = (r.participants || []).filter((p) => p.id !== localUserId);
          setParticipants(otherParticipants);

          // Play message chime if new messages arrived
          if (r.messages && r.messages.length > chatMessages.length) {
            const lastMsg = r.messages[r.messages.length - 1];
            if (lastMsg.senderId !== localUserId && !lastMsg.isSystem) {
              soundEffects.playMessageChime();
            }
            setChatMessages(r.messages);
          }

          // Check if user was kicked by host
          const selfExists = (r.participants || []).some((p) => p.id === localUserId);
          if (!selfExists && participants.length > 0) {
            alert('You have been removed from the session by the host Dais.');
            navigate('/meet');
            return;
          }

          // Initiate WebRTC peer connection offers for newly joined participants
          otherParticipants.forEach(async (p) => {
            if (!peerConnectionsRef.current.has(p.id)) {
              const pc = createPeerConnection(p.id);
              // Only one side initiates offer based on ID comparison to avoid collisions
              if (localUserId > p.id) {
                try {
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  sendSignal(p.id, 'offer', offer);
                } catch (e) {
                  console.warn('Error creating WebRTC offer:', e);
                }
              }
            }
          });
        }

        // Fetch WebRTC Signals intended for this user
        const sigRes = await fetch(`/api/rooms/${cleanRoomId}/signals/${localUserId}`);
        const sigData = await sigRes.json();
        if (sigData.signals && sigData.signals.length > 0) {
          for (const sig of sigData.signals) {
            const senderId = sig.senderId;
            let pc = peerConnectionsRef.current.get(senderId);
            if (!pc) {
              pc = createPeerConnection(senderId);
            }

            if (sig.type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendSignal(senderId, 'answer', answer);
            } else if (sig.type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
            } else if (sig.type === 'candidate') {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(sig.data));
              } catch (iceErr) {
                console.warn('ICE candidate addition error:', iceErr);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Meeting sync tick warning:', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isInLobby, cleanRoomId, localUserId, chatMessages.length, participants.length]);

  // ----------------------------------------------------
  // 5. CHAT & GSL TIMER LOGIC
  // ----------------------------------------------------
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (chatDisabled && localRole !== 'CHAIR') {
      alert('Floor chat has been paused by the Dais.');
      return;
    }

    const text = chatInput.trim();
    setChatInput('');

    const newMsg: ChatMessage = {
      id: 'msg_local_' + Date.now(),
      senderId: localUserId,
      senderName: localUserName,
      senderRole: localRole,
      senderCountry: localCountry,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);

    try {
      await fetch(`/api/rooms/${cleanRoomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });
    } catch {}
  };

  const handleDeleteMessage = async (msgId: string) => {
    setChatMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await fetch(`/api/rooms/${cleanRoomId}/messages/${msgId}`, {
        method: 'DELETE',
      });
    } catch {}
  };

  const handleClearChat = async () => {
    setChatMessages([]);
    try {
      await fetch(`/api/rooms/${cleanRoomId}/messages`, {
        method: 'DELETE',
      });
    } catch {}
  };

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // GSL Timer interval
  useEffect(() => {
    let timer: any = null;
    if (isGslRunning && gslTimeLeft > 0) {
      timer = setInterval(() => {
        setGslTimeLeft((prev) => {
          if (prev <= 1) {
            soundEffects.playTimerWarningChime();
            setIsGslRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGslRunning, gslTimeLeft]);

  // Floating Reactions physics
  const triggerReaction = (emoji: string) => {
    const id = 'react_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    const newReaction: FloatingReaction = {
      id,
      emoji,
      x: 30 + Math.random() * 40,
      y: 80,
    };

    setReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2800);
  };

  const copyMeetingLink = () => {
    const url = `${window.location.origin}/meet/${cleanRoomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper for virtual background styles
  const getVirtualBackgroundClass = () => {
    if (deviceSettings.virtualBackground === 'blur-light') return 'backdrop-blur-sm filter blur-[2px]';
    if (deviceSettings.virtualBackground === 'blur-heavy') return 'backdrop-blur-xl filter blur-[8px]';
    return '';
  };

  // ----------------------------------------------------
  // RENDER: LOBBY / PRE-JOIN SCREEN
  // ----------------------------------------------------
  if (isInLobby) {
    return (
      <div className="min-h-screen bg-[#202124] text-slate-100 flex flex-col justify-between p-4 sm:p-8 selection:bg-cyan-500/30">
        {/* Top Header */}
        <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">DelegateX Live Meet</h1>
              <p className="text-xs text-slate-400 font-mono">Room: {cleanRoomId}</p>
            </div>
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
            title="Audio & Video Settings"
          >
            <Sliders className="h-5 w-5" />
          </button>
        </header>

        {/* Main Lobby Center */}
        <main className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
          {/* Left: Live Video Preview Card */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-white/15 shadow-2xl flex items-center justify-center">
              {/* Live Camera Stream */}
              <video
                ref={lobbyVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 transition duration-300 ${
                  !isVideoOn ? 'hidden' : getVirtualBackgroundClass()
                }`}
              />

              {/* Avatar Placeholder when video is disabled */}
              {!isVideoOn && (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-24 w-24 rounded-full bg-cyan-500/20 border-2 border-cyan-400/40 flex items-center justify-center text-3xl font-extrabold text-cyan-300 shadow-xl">
                    {localUserName.charAt(0).toUpperCase() || 'D'}
                  </div>
                  <p className="text-xs font-semibold text-slate-400">Camera is off</p>
                </div>
              )}

              {/* Virtual Background Badge */}
              {deviceSettings.virtualBackground !== 'none' && (
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-cyan-400/30 px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
                  <Sparkles className="h-3 w-3" />
                  <span className="capitalize">{deviceSettings.virtualBackground.replace('-', ' ')}</span>
                </div>
              )}

              {/* Floating Bottom Media Toggles */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-lg">
                <button
                  onClick={toggleMic}
                  className={`p-3.5 rounded-full transition ${
                    isMicOn
                      ? 'bg-slate-800 text-white hover:bg-slate-700'
                      : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  }`}
                  title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-3.5 rounded-full transition ${
                    isVideoOn
                      ? 'bg-slate-800 text-white hover:bg-slate-700'
                      : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  }`}
                  title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>

                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-3.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Visual Effects & Devices"
                >
                  <Sparkles className="h-5 w-5" />
                </button>
              </div>

              {/* Mic Input Level Visualizer */}
              {isMicOn && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-slate-950/80 px-2.5 py-1.5 rounded-full border border-white/10">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: `${lobbyAudioLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Join Form and Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Ready to join?</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Configure your delegation profile and join the committee floor.
              </p>
            </div>

            <div className="bg-[#1a1b1e] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Your Full Name / Delegate Title</label>
                <input
                  type="text"
                  value={localUserName}
                  onChange={(e) => setLocalUserName(e.target.value)}
                  placeholder="e.g. Delegate of France..."
                  className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-sm text-white focus:border-cyan-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Country / Portfolio</label>
                  <input
                    type="text"
                    value={localCountry}
                    onChange={(e) => setLocalCountry(e.target.value)}
                    placeholder="e.g. France"
                    className="w-full rounded-2xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-300 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Role</label>
                  <select
                    value={localRole}
                    onChange={(e) => setLocalRole(e.target.value as any)}
                    className="w-full rounded-2xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-300 focus:outline-none"
                  >
                    <option value="DELEGATE">Delegate</option>
                    <option value="CHAIR">President / Chair (Dais)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={handleJoinMeeting}
                  disabled={!localUserName.trim()}
                  className="w-full rounded-2xl bg-cyan-300 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 hover:bg-cyan-200 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                >
                  Join Meeting Now
                </button>

                <button
                  onClick={() => {
                    if (!isChairOrAdmin && screenShareDisabled) {
                      setShowScreenShareRestrictedModal(true);
                      return;
                    }
                    setIsScreenSharing(true);
                    handleJoinMeeting();
                  }}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-xs font-semibold text-white hover:bg-white/10 transition flex items-center justify-center gap-2"
                >
                  <MonitorUp className="h-4 w-4 text-cyan-300" />
                  <span>Present Screen Immediately {!isChairOrAdmin && screenShareDisabled ? '(Dais Permission Required)' : ''}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 px-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Real-time end-to-end WebRTC encrypted connection</span>
            </div>
          </div>
        </main>

        <footer className="text-center py-2 text-xs text-slate-500">
          DelegateX Multi-Chamber Video Platform · Google Meet Architecture
        </footer>

        {/* Device Settings Modal in Lobby */}
        <DeviceSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={deviceSettings}
          onSaveSettings={(newSettings) => setDeviceSettings(newSettings)}
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: IN-CALL GOOGLE MEET EXPERIENCE
  // ----------------------------------------------------
  const totalTiles = participants.length + 1; // self + remote participants
  const gridClass =
    totalTiles === 1
      ? 'grid-cols-1'
      : totalTiles === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : totalTiles <= 4
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className="h-screen w-screen bg-[#202124] text-slate-100 flex flex-col select-none overflow-hidden font-sans">
      {/* ----------------------------------------------------
          MAIN CALL BODY (Video Tiles + Optional Side Panel)
      ---------------------------------------------------- */}
      <div className="flex-1 flex relative overflow-hidden bg-[#131417]">
        {/* VIDEO TILES GRID */}
        <div
          className={`flex-1 p-3 sm:p-4 overflow-y-auto grid ${gridClass} gap-3 sm:gap-4 items-center justify-center transition-all duration-300`}
        >
          {/* LOCAL USER TILE */}
          <div
            className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-[#202124] border shadow-2xl flex items-center justify-center transition-all ${
              pinnedParticipantId === localUserId
                ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            {/* Local Video Stream */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                isScreenSharing ? '' : '-scale-x-100'
              } ${!isVideoOn ? 'hidden' : getVirtualBackgroundClass()}`}
            />

            {/* Placeholder Avatar when Video is Off */}
            {!isVideoOn && (
              <div className="flex flex-col items-center gap-2">
                <div className="h-20 w-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400/40 flex items-center justify-center text-2xl font-extrabold text-cyan-300 shadow-xl">
                  {localUserName.charAt(0).toUpperCase()}
                </div>
                <p className="text-[11px] font-semibold text-slate-400">{localCountry}</p>
              </div>
            )}

            {/* Bottom Bar on Tile: Name, Country, Mute status */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-semibold text-white">
                <span>{localUserName} (You)</span>
                <span className="text-[10px] text-cyan-300">· {localCountry}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {isHandRaised && (
                  <div className="bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg animate-bounce">
                    <Hand className="h-3 w-3" />
                  </div>
                )}

                <div
                  className={`p-1.5 rounded-full ${
                    isMicOn ? 'bg-slate-950/80 text-emerald-400' : 'bg-rose-500 text-white'
                  }`}
                >
                  {isMicOn ? <Volume2 className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                </div>
              </div>
            </div>

            {/* Pin Action Button */}
            <button
              onClick={() =>
                setPinnedParticipantId(pinnedParticipantId === localUserId ? null : localUserId)
              }
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-400 hover:text-white border border-white/10 transition opacity-0 hover:opacity-100"
            >
              {pinnedParticipantId === localUserId ? (
                <PinOff className="h-3.5 w-3.5 text-cyan-300" />
              ) : (
                <Pin className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* REMOTE PARTICIPANTS TILES */}
          {participants.map((p) => {
            const remoteStream = remoteStreamsRef.current.get(p.id);

            return (
              <div
                key={p.id}
                className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-[#202124] border shadow-2xl flex items-center justify-center transition-all ${
                  pinnedParticipantId === p.id
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Remote Stream Video Element */}
                {remoteStream && p.isVideoOn ? (
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => {
                      if (el && el.srcObject !== remoteStream) {
                        el.srcObject = remoteStream;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`h-20 w-20 rounded-full ${p.avatarColor} border-2 border-white/20 flex items-center justify-center text-2xl font-extrabold text-white shadow-xl`}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {p.country || 'Delegate'}
                    </p>
                  </div>
                )}

                {/* Bottom Tile Info Bar */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-semibold text-white">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-slate-400">· {p.country || 'Delegate'}</span>
                    {p.role === 'CHAIR' && (
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                        Dais
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {p.isHandRaised && (
                      <div className="bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg animate-bounce">
                        <Hand className="h-3 w-3" />
                      </div>
                    )}

                    <div
                      className={`p-1.5 rounded-full ${
                        !p.isMuted ? 'bg-slate-950/80 text-emerald-400' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {!p.isMuted ? <Volume2 className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                </div>

                {/* Pin Action Button */}
                <button
                  onClick={() =>
                    setPinnedParticipantId(pinnedParticipantId === p.id ? null : p.id)
                  }
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-400 hover:text-white border border-white/10 transition opacity-0 hover:opacity-100"
                >
                  {pinnedParticipantId === p.id ? (
                    <PinOff className="h-3.5 w-3.5 text-cyan-300" />
                  ) : (
                    <Pin className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FLOATING EMOJI REACTIONS RENDERER */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {reactions.map((react) => (
            <div
              key={react.id}
              className="absolute text-3xl sm:text-4xl animate-in fade-in zoom-in slide-in-from-bottom duration-1000 select-none"
              style={{
                left: `${react.x}%`,
                bottom: `${react.y}px`,
                animation: 'floatingReaction 2.5s ease-out forwards',
              }}
            >
              {react.emoji}
            </div>
          ))}
        </div>

        {/* ----------------------------------------------------
            RIGHT SIDE PANEL (Chat, People, Floor Clock, Info)
        ---------------------------------------------------- */}
        {activeSidePanel && (
          <aside className="w-full sm:w-80 md:w-96 bg-[#1a1b1e] border-l border-white/10 flex flex-col z-30 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Side Panel Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                {activeSidePanel === 'CHAT' && <MessageSquare className="h-4 w-4 text-cyan-300" />}
                {activeSidePanel === 'PEOPLE' && <Users className="h-4 w-4 text-cyan-300" />}
                {activeSidePanel === 'FLOOR' && <Clock className="h-4 w-4 text-emerald-400" />}
                {activeSidePanel === 'INFO' && <Info className="h-4 w-4 text-cyan-300" />}
                <h3 className="font-bold text-white text-sm">
                  {activeSidePanel === 'CHAT' && `In-Call Messages (${chatMessages.length})`}
                  {activeSidePanel === 'PEOPLE' && `Delegations (${participants.length + 1})`}
                  {activeSidePanel === 'FLOOR' && 'GSL Debate & Motions'}
                  {activeSidePanel === 'INFO' && 'Joining Details'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {activeSidePanel === 'CHAT' && chatMessages.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-[10px] text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
                    title="Clear in-call chat"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveSidePanel(null)}
                  className="text-slate-400 hover:text-white p-1 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* TAB: IN-CALL CHAT */}
            {activeSidePanel === 'CHAT' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 text-center text-[11px] text-slate-400">
                    Messages can be seen only by people in the call and are deleted when the call ends.
                  </div>

                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No messages yet. Send a message to all delegates on the floor.
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isSelf = msg.senderId === localUserId;
                      const canDelete = isSelf || localRole === 'CHAIR';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1 group relative`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span className="font-bold text-slate-300">
                              {msg.senderName} {isSelf && '(You)'}
                            </span>
                            <span>· {msg.timestamp}</span>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-500 p-0.5 transition"
                                title="Delete message"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed flex items-center justify-between gap-2 ${
                              isSelf
                                ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none'
                                : 'bg-slate-900 border border-white/10 text-white rounded-tl-none'
                            }`}
                          >
                            <span className="break-words">{msg.text}</span>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className={`opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-black/10 shrink-0 ${
                                  isSelf ? 'text-slate-800 hover:text-slate-950' : 'text-slate-400 hover:text-rose-400'
                                }`}
                                title="Delete this message"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input Box */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-[#141518]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={chatDisabled ? 'Chat disabled by Dais' : 'Send a message to everyone...'}
                      disabled={chatDisabled && localRole !== 'CHAIR'}
                      className="flex-1 rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300 disabled:opacity-40"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || (chatDisabled && localRole !== 'CHAIR')}
                      className="p-2.5 rounded-xl bg-cyan-300 text-slate-950 font-bold hover:bg-cyan-200 disabled:opacity-40 transition"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: PEOPLE / PARTICIPANTS */}
            {activeSidePanel === 'PEOPLE' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {/* Host Controls Quick Banner */}
                {localRole === 'CHAIR' && (
                  <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300">Executive Dais</span>
                    </div>
                    <button
                      onClick={() => setShowHostControls(true)}
                      className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition"
                    >
                      Host Panel
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Call</p>

                  {/* Self Tile */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold text-slate-950">
                        {localUserName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{localUserName} (You)</p>
                        <p className="text-[10px] text-slate-400">{localCountry} · {localRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isMicOn ? (
                        <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <MicOff className="h-3.5 w-3.5 text-rose-400" />
                      )}
                    </div>
                  </div>

                  {/* Remote Participants */}
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-full ${p.avatarColor} flex items-center justify-center text-xs font-bold text-white`}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{p.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {p.country || 'Delegate'} · {p.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {p.isHandRaised && <Hand className="h-3.5 w-3.5 text-amber-400" />}
                        {!p.isMuted ? (
                          <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <MicOff className="h-3.5 w-3.5 text-rose-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: GSL / FLOOR CLOCK & MOTIONS */}
            {activeSidePanel === 'FLOOR' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 text-center space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Recognized GSL Speaker
                  </p>
                  <h4 className="text-sm font-bold text-cyan-300">
                    {gslSpeakers[0] || 'Speakers Queue Empty'}
                  </h4>
                  <div className="text-4xl font-mono font-black text-white py-1">
                    {formatTime(gslTimeLeft)}
                  </div>

                  {/* Timer Controls */}
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
                      title="Reset Clock"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setGslSpeakers((prev) => prev.slice(1));
                        setGslTimeLeft(gslTime);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                    >
                      Yield Floor
                    </button>
                  </div>
                </div>

                {/* Speaker Duration Presets */}
                <div className="flex items-center justify-center gap-2">
                  {[60, 90, 120].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setGslTime(t);
                        setGslTimeLeft(t);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                        gslTime === t
                          ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40'
                          : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {t}s Preset
                    </button>
                  ))}
                </div>

                {/* Speaker Queue */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-300">Queue ({gslSpeakers.length})</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {gslSpeakers.map((spk, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <span>
                          {idx + 1}. {spk}
                        </span>
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

                  {/* Add Speaker Input - ONLY FOR CHAIR / ADMIN */}
                  {isChairOrAdmin ? (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add delegation to GSL..."
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
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-300 text-slate-950 font-bold text-xs hover:bg-cyan-200"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 text-center text-[11px] text-slate-400">
                      <p>Delegations are recognized by the Executive Dais. Raise your placard below to request floor recognition.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: INFO */}
            {activeSidePanel === 'INFO' && (
              <div className="flex-1 p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Meeting Room</span>
                  <p className="text-sm font-bold text-white">{roomTitle}</p>
                  <p className="text-xs text-slate-400 mt-1">{roomAgenda}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/10">
                  <span className="text-xs text-slate-400">Joining Link</span>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                    <p className="font-mono text-xs text-cyan-300 break-all">
                      {window.location.origin}/meet/{cleanRoomId}
                    </p>
                    <button
                      onClick={copyMeetingLink}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold transition"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedLink ? 'Link copied' : 'Copy joining info'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ----------------------------------------------------
          REACTIONS PICKER POPUP
      ---------------------------------------------------- */}
      {showReactionsPicker && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#202124] border border-white/20 rounded-3xl p-2 shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-in fade-in zoom-in-95">
          {['❤️', '👏', '👍', '💡', '🇺🇳', '🙋‍♂️', '🔥', '🎉', '🕊️'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                triggerReaction(emoji);
                setShowReactionsPicker(false);
              }}
              className="h-10 w-10 flex items-center justify-center text-xl rounded-2xl hover:bg-white/10 transition active:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------
          MORE OPTIONS POPUP MENU
      ---------------------------------------------------- */}
      {showMoreMenu && (
        <div className="absolute bottom-24 right-20 sm:right-28 z-40 bg-[#202124] border border-white/15 rounded-3xl p-2 shadow-2xl w-60 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95">
          <button
            onClick={() => {
              setShowWhiteboard(true);
              setShowMoreMenu(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
          >
            <FileText className="h-4 w-4 text-cyan-300" />
            <span>Working Paper Scratchpad</span>
          </button>

          <button
            onClick={() => {
              setShowBreakoutModal(true);
              setShowMoreMenu(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
          >
            <DoorOpen className="h-4 w-4 text-emerald-400" />
            <span>Caucus Breakout Rooms</span>
          </button>

          <button
            onClick={() => {
              setShowSettingsModal(true);
              setShowMoreMenu(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
          >
            <Sliders className="h-4 w-4 text-cyan-300" />
            <span>Audio & Video Settings</span>
          </button>

          <button
            onClick={() => {
              toggleFullscreen();
              setShowMoreMenu(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Full screen'}</span>
          </button>
        </div>
      )}

      {/* ----------------------------------------------------
          BOTTOM GOOGLE MEET CONTROL BAR
      ---------------------------------------------------- */}
      <footer className="h-20 bg-[#1a1b1e] border-t border-white/10 px-3 sm:px-6 flex items-center justify-between z-30 shrink-0">
        {/* Left: Meeting Time, Room Title, Code & Badges */}
        <div className="flex items-center gap-2.5 sm:gap-3 max-w-[30%] min-w-0">
          <span className="text-xs sm:text-sm font-bold text-white hidden sm:inline shrink-0">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-slate-600 hidden sm:inline shrink-0">|</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-white truncate max-w-[110px] sm:max-w-[160px] md:max-w-[200px]" title={roomTitle}>
              {roomTitle}
            </span>
            <span className="text-[10px] font-mono text-cyan-300 hidden lg:inline shrink-0">({cleanRoomId})</span>
          </div>
          {activeBreakoutId && (
            <span className="hidden xl:inline-flex items-center gap-1 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded-full text-[10px] font-semibold text-cyan-300 shrink-0">
              <DoorOpen className="h-3 w-3" />
              <span className="truncate max-w-[90px]">{currentBreakoutName}</span>
            </span>
          )}
          {isLocked && (
            <span className="hidden md:inline-flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300 shrink-0">
              Locked
            </span>
          )}
          <button
            onClick={copyMeetingLink}
            className="hidden 2xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 text-[11px] font-semibold transition shrink-0"
            title="Copy Joining Link"
          >
            {copiedLink ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>
        </div>

        {/* Center: Main Media Controls */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-1">
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
            title={isScreenSharing ? 'Stop presenting' : !isChairOrAdmin && screenShareDisabled ? 'Present screen (Dais permission required)' : 'Present now'}
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

          {/* More Options */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-3.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            title="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {/* Leave Call Button (Red Pill) */}
          <button
            onClick={() => setShowEndCallModal(true)}
            className="px-5 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-lg shadow-rose-600/30 active:scale-95 flex items-center justify-center gap-1.5"
            title="Leave call"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>

        {/* Right: Side Panel Toggles */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 max-w-[30%]">
          {/* Quick GSL Floor Clock Button */}
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'FLOOR' ? null : 'FLOOR')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full border transition text-xs font-mono font-bold ${
              activeSidePanel === 'FLOOR'
                ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                : 'bg-slate-800 text-white border-white/10 hover:bg-slate-700'
            }`}
            title="GSL Speaker Clock & Floor Motions"
          >
            <Clock className="h-4 w-4 text-cyan-300" />
            <span className="hidden sm:inline">{formatTime(gslTimeLeft)}</span>
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'INFO' ? null : 'INFO')}
            className={`p-3 rounded-full transition ${
              activeSidePanel === 'INFO'
                ? 'bg-cyan-400/20 text-cyan-300'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Meeting details & link"
          >
            <Info className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'PEOPLE' ? null : 'PEOPLE')}
            className={`p-3 rounded-full transition relative ${
              activeSidePanel === 'PEOPLE'
                ? 'bg-cyan-400/20 text-cyan-300'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Show delegates in call"
          >
            <Users className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-slate-700 border border-slate-600 text-[9px] font-bold flex items-center justify-center text-slate-200">
              {participants.length + 1}
            </span>
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'CHAT' ? null : 'CHAT')}
            className={`p-3 rounded-full transition ${
              activeSidePanel === 'CHAT'
                ? 'bg-cyan-400/20 text-cyan-300'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Chat with delegations"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
      </footer>

      {/* ----------------------------------------------------
          MODALS INTEGRATION
      ---------------------------------------------------- */}

      {/* Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={deviceSettings}
        onSaveSettings={(newSettings) => setDeviceSettings(newSettings)}
      />

      {/* Interactive Whiteboard / Resolution Draft Modal */}
      <WhiteboardModal
        isOpen={showWhiteboard}
        onClose={() => setShowWhiteboard(false)}
        initialDraftText={draftResolutionText}
        onUpdateDraftText={(newText) => setDraftResolutionText(newText)}
      />

      {/* Host Dais Controls Modal */}
      <HostControlsModal
        isOpen={showHostControls}
        onClose={() => setShowHostControls(false)}
        isLocked={isLocked}
        chatDisabled={chatDisabled}
        screenShareDisabled={screenShareDisabled}
        participants={participants}
        currentUserId={localUserId}
        onMuteAll={async () => {
          await fetch(`/api/rooms/${cleanRoomId}/host-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'MUTE_ALL', hostUserId: localUserId }),
          });
        }}
        onToggleLock={async (locked) => {
          setIsLocked(locked);
          await fetch(`/api/rooms/${cleanRoomId}/host-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'TOGGLE_LOCK', value: locked }),
          });
        }}
        onToggleChat={async (disabled) => {
          setChatDisabled(disabled);
          await fetch(`/api/rooms/${cleanRoomId}/host-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'TOGGLE_CHAT', value: disabled }),
          });
        }}
        onToggleScreenShare={async (disabled) => {
          setScreenShareDisabled(disabled);
          await fetch(`/api/rooms/${cleanRoomId}/host-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'TOGGLE_SCREEN_SHARE', value: disabled }),
          });
        }}
        onKickParticipant={async (targetId) => {
          await fetch(`/api/rooms/${cleanRoomId}/host-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'KICK_PARTICIPANT', targetUserId: targetId }),
          });
        }}
      />

      {/* Caucus Breakout Rooms Modal */}
      <BreakoutRoomsModal
        isOpen={showBreakoutModal}
        onClose={() => setShowBreakoutModal(false)}
        currentRoomId={cleanRoomId}
        activeBreakout={activeBreakoutId}
        onSwitchBreakout={(breakoutId, breakoutName) => {
          setActiveBreakoutId(breakoutId);
          setCurrentBreakoutName(breakoutName);
        }}
      />

      {/* Confirmation Modal to Leave Call */}
      {showEndCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#202124] border border-white/10 max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-2xl text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <PhoneOff className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-lg">Leave this meeting?</h3>
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
      {/* Screen Share Restricted for Delegates Modal */}
      {showScreenShareRestrictedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#1e2024] border border-cyan-400/30 p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-3 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300">
                <MonitorUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Presentation Permission Required</h3>
                <p className="text-xs text-slate-400">Executive Dais Moderation Policy</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Delegates cannot broadcast screens or share presentations unless explicitly authorized by the Executive Dais (Chair) or Secretariat Administrator.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                <Shield className="h-4 w-4" />
                <span>To request screen sharing rights:</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Raise your Placard to seek recognition from the Chair.</li>
                <li>Send a formal motion or request in the live Floor Chat.</li>
                <li>Once the Dais enables delegate presentations, screen sharing will unlock.</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (!isHandRaised) {
                    toggleHandRaise();
                  }
                  fetch(`/api/rooms/${cleanRoomId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      senderId: localUserId,
                      senderName: localUserName,
                      senderRole: 'DELEGATE',
                      senderCountry: localCountry,
                      text: `[FORMAL REQUEST]: Delegation of ${localCountry} requests permission to share presentation / draft resolution on the screen.`,
                    }),
                  }).catch(() => {});
                  setShowScreenShareRestrictedModal(false);
                }}
                className="flex-1 rounded-2xl bg-cyan-300 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-200 transition shadow-lg shadow-cyan-400/20"
              >
                Raise Placard & Request Chair
              </button>
              <button
                onClick={() => setShowScreenShareRestrictedModal(false)}
                className="px-5 py-3 rounded-2xl bg-white/10 text-xs font-semibold text-white hover:bg-white/15 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
