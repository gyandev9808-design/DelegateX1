import React, { useState, useEffect } from 'react';
import {
  Mic,
  Video,
  Volume2,
  Sliders,
  Check,
  Play,
  Sparkles,
  Shield,
  Layers,
  X,
} from 'lucide-react';
import { soundEffects } from './AudioChimes';

export interface DeviceSettings {
  audioInputId: string;
  audioOutputId: string;
  videoInputId: string;
  videoResolution: '720p' | '1080p' | '360p';
  noiseCancellation: boolean;
  echoCancellation: boolean;
  virtualBackground: 'none' | 'blur-light' | 'blur-heavy' | 'un-assembly' | 'un-sc' | 'embassy';
}

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DeviceSettings;
  onSaveSettings: (newSettings: DeviceSettings) => void;
}

export default function DeviceSettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}: DeviceSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'AUDIO' | 'VIDEO' | 'EFFECTS' | 'GENERAL'>('AUDIO');
  const [localSettings, setLocalSettings] = useState<DeviceSettings>(settings);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [isPlayingTestTone, setIsPlayingTestTone] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!isOpen) return;

    // Enumerate hardware devices
    async function loadDevices() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputs(devices.filter((d) => d.kind === 'audioinput'));
        setAudioOutputs(devices.filter((d) => d.kind === 'audiooutput'));
        setVideoInputs(devices.filter((d) => d.kind === 'videoinput'));
      } catch (err) {
        console.warn('Failed to enumerate devices:', err);
      }
    }

    loadDevices();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestSpeaker = () => {
    setIsPlayingTestTone(true);
    soundEffects.playJoinChime();
    setTimeout(() => {
      soundEffects.playHandRaiseChime();
      setIsPlayingTestTone(false);
    }, 1000);
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#202124] border border-white/15 max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Audio & Video Settings</h3>
              <p className="text-xs text-slate-400">Configure devices, HD resolution & background effects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body with Sidebar Tabs */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-[360px] overflow-hidden">
          {/* Navigation Tab Column */}
          <div className="md:col-span-4 bg-[#1a1b1e] border-r border-white/10 p-3 space-y-1">
            <button
              onClick={() => setActiveTab('AUDIO')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                activeTab === 'AUDIO'
                  ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mic className="h-4 w-4" />
              <span>Audio Devices</span>
            </button>

            <button
              onClick={() => setActiveTab('VIDEO')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                activeTab === 'VIDEO'
                  ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Video className="h-4 w-4" />
              <span>Video & Resolution</span>
            </button>

            <button
              onClick={() => setActiveTab('EFFECTS')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                activeTab === 'EFFECTS'
                  ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Visual Effects</span>
            </button>

            <button
              onClick={() => setActiveTab('GENERAL')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                activeTab === 'GENERAL'
                  ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Acoustic Control</span>
            </button>
          </div>

          {/* Tab Content Column */}
          <div className="md:col-span-8 p-6 overflow-y-auto space-y-6">
            {/* AUDIO TAB */}
            {activeTab === 'AUDIO' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Microphone Input
                  </label>
                  <select
                    value={localSettings.audioInputId}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, audioInputId: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-300 focus:outline-none"
                  >
                    <option value="default">Default System Microphone</option>
                    {audioInputs.map((dev) => (
                      <option key={dev.deviceId} value={dev.deviceId}>
                        {dev.label || `Microphone (${dev.deviceId.substring(0, 5)})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Speaker Output
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={localSettings.audioOutputId}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, audioOutputId: e.target.value })
                      }
                      className="flex-1 rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-300 focus:outline-none"
                    >
                      <option value="default">Default System Speakers</option>
                      {audioOutputs.map((dev) => (
                        <option key={dev.deviceId} value={dev.deviceId}>
                          {dev.label || `Speaker (${dev.deviceId.substring(0, 5)})`}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleTestSpeaker}
                      disabled={isPlayingTestTone}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-white/10 flex items-center gap-1.5 shrink-0"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>{isPlayingTestTone ? 'Testing...' : 'Test'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIDEO TAB */}
            {activeTab === 'VIDEO' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Camera Device
                  </label>
                  <select
                    value={localSettings.videoInputId}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, videoInputId: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-300 focus:outline-none"
                  >
                    <option value="default">Default Web Camera</option>
                    {videoInputs.map((dev) => (
                      <option key={dev.deviceId} value={dev.deviceId}>
                        {dev.label || `Camera (${dev.deviceId.substring(0, 5)})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Send Resolution (Maximum)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['720p', '1080p', '360p'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setLocalSettings({ ...localSettings, videoResolution: res })}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                          localSettings.videoResolution === res
                            ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300'
                            : 'border-white/10 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {res === '1080p' ? '1080p (Full HD)' : res === '720p' ? '720p (High Def)' : '360p (Standard)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* EFFECTS TAB */}
            {activeTab === 'EFFECTS' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select a background filter or virtual diplomatic backdrop for video stream.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'none', label: 'No Effect', desc: 'Standard video stream' },
                    { id: 'blur-light', label: 'Slight Blur', desc: 'Subtle background softening' },
                    { id: 'blur-heavy', label: 'Heavy Blur', desc: 'Total privacy blur' },
                    { id: 'un-assembly', label: 'UN General Assembly', desc: 'Official GA hall backdrop' },
                    { id: 'un-sc', label: 'UN Security Council', desc: 'Horseshoe chamber backdrop' },
                    { id: 'embassy', label: 'Diplomatic Embassy', desc: 'Executive international office' },
                  ].map((eff) => (
                    <button
                      key={eff.id}
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          virtualBackground: eff.id as any,
                        })
                      }
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-1 ${
                        localSettings.virtualBackground === eff.id
                          ? 'border-cyan-400 bg-cyan-400/15 text-white shadow-lg shadow-cyan-500/10'
                          : 'border-white/10 bg-slate-950 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{eff.label}</span>
                        {localSettings.virtualBackground === eff.id && (
                          <Check className="h-3.5 w-3.5 text-cyan-300" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{eff.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* GENERAL ACOUSTIC TAB */}
            {activeTab === 'GENERAL' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">AI Noise Suppression</p>
                      <p className="text-[11px] text-slate-400">
                        Filters background keyboard typing, room chatter, and fan sounds
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.noiseCancellation}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          noiseCancellation: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded accent-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div>
                      <p className="text-xs font-bold text-white">Acoustic Echo Cancellation</p>
                      <p className="text-[11px] text-slate-400">
                        Prevents audio feedback when delegates speak through open speakers
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.echoCancellation}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          echoCancellation: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded accent-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#1a1b1e] border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-cyan-300 text-slate-950 text-xs font-bold hover:bg-cyan-200 transition shadow-lg shadow-cyan-500/20"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
