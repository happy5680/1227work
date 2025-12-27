
export enum TeachingMode {
  LECTURE = '講述教學',
  DISCUSSION = '小組討論',
  PRACTICE = '實作/演算',
  DIGITAL = '數位運用'
}

export enum TeachingAction {
  ENCOURAGE = '正向鼓勵',
  CORRECT = '糾正規範',
  OPEN_Q = '開放提問',
  CLOSED_Q = '封閉提問',
  PATROL = '巡視走動'
}

export type EngagementLevel = 'high' | 'mid' | 'low';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'mode' | 'action' | 'note' | 'engagement';
  label: string;
  detail?: string;
}

export interface SessionData {
  subject: string;
  startTime: string | null;
  endTime: string | null;
  modeDurations: Record<string, number>;
  actionCounts: Record<string, number>;
  logs: LogEntry[];
  finalNote: string;
}
