export interface Player {
  id: number;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  totalHours: number;
  sessions: Session[];
  dailyStats: Record<string, DailyStats>;
  promotionHistory: Record<string, PromotionHistoryEntry>;
  achievements: Achievement[];
  lastPlayed?: string | null;
  lastSessionDuration?: number;
  totalSessions?: number;
}

export interface Session {
  id: number;
  player_id: number;
  player_name: string;
  date: string;
  date_string: string;
  seat_in_time: string;
  seat_out_time: string;
  duration: number;
  day_of_week: number;
  week_number: number;
  month: number;
  year: number;
}

export interface Promotion {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  active: boolean;
  deleted: boolean;
  created_at: string;
  updated_at?: string;
  leaderboardHistory?: LeaderboardEntry[];
  finalLeaderboard?: LeaderboardEntry[] | null;
  totalHoursPlayed: number;
  totalSessions: number;
  uniquePlayers: number;
  currentLeaderboard?: LeaderboardEntry[];
}

export interface Achievement {
  id: number;
  promotionId: number;
  promotionName: string;
  position: number;
  medal: string;
  date: string;
  hours: number;
}

export interface ActiveTable {
  id: number;
  player: Player;
  seatTime: Date;
}

export interface Penalty {
  id: number;
  player_id: number;
  player_name: string;
  penalty_minutes: number;
  reason: string;
  reason_type: 'floor_mistake' | 'dinner_break' | 'short_pause' | 'other';
  applied_by?: string;
  date_applied: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Addon {
  id: number;
  player_id: number;
  player_name: string;
  bonus_minutes: number;
  reason: string;
  reason_type: 'late_registration' | 'high_stakes_bonus' | 'compensation' | 'promotional' | 'other';
  applied_by?: string;
  date_applied: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClubSettings {
  clubName: string;
  location: string;
  stakes: string;
  tableLimit: string;
  currency: string;
  timezone: string;
}

export interface DailyStats {
  date: string;
  hours: number;
  sessions: number;
  averageSessionLength: number;
}

export interface PromotionHistoryEntry {
  promotionId: number;
  promotionName: string;
  position: number;
  hours: number;
  sessions: number;
  medal: string;
  date: string;
}

export interface LeaderboardEntry {
  position: number;
  player: Player;
  hours: number;
  sessions: number;
  medal?: string;
}

export interface PlayerStats {
  playerId: number;
  playerName: string;
  totalHours: number;
  totalSessions: number;
  averageSessionLength: number;
  lastPlayed?: string;
}

export interface BackupData {
  players: Player[];
  sessions: Session[];
  promotions: Promotion[];
  achievements: Achievement[];
  penalties?: Penalty[];
  addons?: Addon[];
  clubSettings?: ClubSettings;
  timestamp: string;
  version: string;
}
