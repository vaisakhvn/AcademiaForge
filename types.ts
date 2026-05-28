
export interface StudyLog {
  id: string;
  date: string;
  subject: string;
  durationMinutes: number;
  mood: number; // 1-5
  focus: number; // 1-5
  score?: number; // 0-100
  notes?: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface User {
  email: string;
  displayName: string;
  isVerified: boolean;
  avatarSeed: string;
  avatarUrl?: string; // Base64 or URL for custom avatar
}

export interface PredictionResult {
  predictedScore: number;
  confidence: number;
  recommendation: string;
  reasoning: string;
}

export interface DailyPlanItem {
  subject: string;
  startTime: string;
  duration: number;
  strategy: string;
}

export interface DailyInsight {
  title: string;
  content: string;
  type: 'success' | 'warning' | 'tip';
}
