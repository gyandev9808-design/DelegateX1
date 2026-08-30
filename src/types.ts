export type Role = 'MASTER_ADMIN' | 'ADMIN' | 'CHAIR' | 'DELEGATE';

export type SessionType = 'TRAINING' | 'LIVE_COMMITTEE' | 'CRISIS_SIMULATION';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface MeetingRoom {
  id: string;
  code: string;
  title: string;
  topic: string;
  type: SessionType;
  googleMeetUrl: string;
  isLive?: boolean;
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CHAIR';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: 'gemini' | 'local';
}

export interface TrainingModule {
  id: string;
  title: string;
  desc: string;
  duration: string;
  iconName: string;
  category: string;
  content: {
    summary: string;
    keyPoints: string[];
    sampleScript?: string;
    proTip: string;
  };
}
