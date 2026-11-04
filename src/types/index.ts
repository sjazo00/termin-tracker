export interface Player {
  id: string;
  name: string;
  nickname?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Season {
  id: string;
  name: string;
  is_current: boolean;
  created_at?: string;
}

export interface MatchPlayer {
  id?: string;
  match_id?: string;
  player_id: string;
  team: 'zeleni' | 'sareni';
  goals: number; // Ukupno postignutih golova za ekipu (uključujući penale)
  penalty_goals?: number; // Od toga golova iz penala
  own_goals?: number; // Autogolovi (koji se pribrajaju protivničkoj ekipi)
  player?: Player;
}

export interface Match {
  id: string;
  season_id: string;
  date: string;
  zeleni_score: number;
  sareni_score: number;
  mvp_player_id?: string | null;
  notes?: string | null;
  created_at?: string;
  match_players?: MatchPlayer[];
  mvp_player?: Player;
  season?: Season;
}

export interface PlayerStats {
  player: Player;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number; // percentage (0 - 100)
  goals: number;
  goalsPerMatch: number;
  mvpCount: number;
  penaltyGoals: number;
  ownGoals: number;
}

export interface MvpVote {
  id: string;
  match_id: string;
  voter_player_id: string;
  candidate_player_id: string;
  created_at?: string;
  voter_player?: Player;
  candidate_player?: Player;
}

