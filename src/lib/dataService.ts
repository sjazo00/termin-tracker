import { supabase } from './supabase';
import type { Player, Season, Match, PlayerStats } from '../types';
import { INITIAL_MATCHES, INITIAL_PLAYERS, INITIAL_SEASONS } from './mockData';

const LOCAL_STORAGE_KEYS = {
  PLAYERS: 'termin_local_players',
  SEASONS: 'termin_local_seasons',
  MATCHES: 'termin_local_matches',
};

// Initialize localStorage fallback if empty
const initLocalStorage = () => {
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.PLAYERS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PLAYERS, JSON.stringify(INITIAL_PLAYERS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.SEASONS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SEASONS, JSON.stringify(INITIAL_SEASONS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.MATCHES)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.MATCHES, JSON.stringify(INITIAL_MATCHES));
  }
};

export const dataService = {
  isSupabaseConnected: () => !!supabase,

  // 1. SEASONS
  getSeasons: async (): Promise<Season[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching seasons from Supabase:', error);
        throw error;
      }
      return data || [];
    }
    initLocalStorage();
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.SEASONS);
    return raw ? JSON.parse(raw) : INITIAL_SEASONS;
  },

  addSeason: async (name: string, isCurrent: boolean): Promise<Season> => {
    if (supabase) {
      if (isCurrent) {
        // unset other current seasons
        await supabase.from('seasons').update({ is_current: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { data, error } = await supabase
        .from('seasons')
        .insert([{ name, is_current: isCurrent }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const seasons = await dataService.getSeasons();
    if (isCurrent) {
      seasons.forEach((s) => (s.is_current = false));
    }
    const newSeason: Season = {
      id: 's-' + Date.now(),
      name,
      is_current: isCurrent,
      created_at: new Date().toISOString(),
    };
    seasons.unshift(newSeason);
    localStorage.setItem(LOCAL_STORAGE_KEYS.SEASONS, JSON.stringify(seasons));
    return newSeason;
  },

  // 2. PLAYERS
  getPlayers: async (): Promise<Player[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        console.error('Error fetching players from Supabase:', error);
        throw error;
      }
      return data || [];
    }
    initLocalStorage();
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.PLAYERS);
    return raw ? JSON.parse(raw) : INITIAL_PLAYERS;
  },

  addPlayer: async (name: string, nickname?: string): Promise<Player> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('players')
        .insert([{ name, nickname: nickname || null, is_active: true }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const players = await dataService.getPlayers();
    const newPlayer: Player = {
      id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name,
      nickname,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    players.push(newPlayer);
    localStorage.setItem(LOCAL_STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    return newPlayer;
  },

  updatePlayer: async (id: string, updates: Partial<Player>): Promise<void> => {
    if (supabase) {
      const { error } = await supabase.from('players').update(updates).eq('id', id);
      if (error) throw error;
      return;
    }
    const players = await dataService.getPlayers();
    const idx = players.findIndex((p) => p.id === id);
    if (idx !== -1) {
      players[idx] = { ...players[idx], ...updates };
      localStorage.setItem(LOCAL_STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    }
  },

  // 3. MATCHES
  getMatches: async (): Promise<Match[]> => {
    if (supabase) {
      const { data: matches, error: mError } = await supabase
        .from('matches')
        .select(`
          *,
          season:seasons(*),
          mvp_player:players!matches_mvp_player_id_fkey(*),
          match_players(
            *,
            player:players(*)
          )
        `)
        .order('date', { ascending: false });

      if (mError) {
        console.error('Error fetching matches from Supabase:', mError);
        throw mError;
      }

      return matches || [];
    }

    initLocalStorage();
    const rawMatches = localStorage.getItem(LOCAL_STORAGE_KEYS.MATCHES);
    const matches: Match[] = rawMatches ? JSON.parse(rawMatches) : INITIAL_MATCHES;
    const players = await dataService.getPlayers();
    const seasons = await dataService.getSeasons();

    // Hydrate local matches with player and season objects
    return matches.map((m) => ({
      ...m,
      season: seasons.find((s) => s.id === m.season_id),
      mvp_player: players.find((p) => p.id === m.mvp_player_id),
      match_players: (m.match_players || []).map((mp) => ({
        ...mp,
        player: players.find((p) => p.id === mp.player_id),
      })),
    }));
  },

  addMatch: async (
    matchData: Omit<Match, 'id' | 'created_at' | 'match_players' | 'mvp_player' | 'season'>,
    playersData: Array<{ player_id: string; team: 'zeleni' | 'sareni'; goals: number }>
  ): Promise<Match> => {
    if (supabase) {
      // 1. Insert match
      const { data: match, error: mErr } = await supabase
        .from('matches')
        .insert([matchData])
        .select()
        .single();
      if (mErr) throw mErr;

      // 2. Insert match_players
      const playersToInsert = playersData.map((p) => ({
        match_id: match.id,
        player_id: p.player_id,
        team: p.team,
        goals: p.goals,
      }));

      const { error: mpErr } = await supabase.from('match_players').insert(playersToInsert);
      if (mpErr) throw mpErr;

      // Return full hydrated match
      const [fullMatch] = await dataService.getMatches();
      return fullMatch;
    }

    // Local storage
    const matches = await dataService.getMatches();
    const matchId = 'm-' + Date.now();
    const newMatch: Match = {
      ...matchData,
      id: matchId,
      created_at: new Date().toISOString(),
      match_players: playersData.map((p) => ({
        id: 'mp-' + Math.random().toString(36).substr(2, 9),
        match_id: matchId,
        player_id: p.player_id,
        team: p.team,
        goals: p.goals,
      })),
    };

    matches.unshift(newMatch);
    localStorage.setItem(LOCAL_STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    return newMatch;
  },

  deleteMatch: async (id: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase.from('matches').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const matches = await dataService.getMatches();
    const filtered = matches.filter((m) => m.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEYS.MATCHES, JSON.stringify(filtered));
  },

  // 4. STATS CALCULATION
  calculateStats: (players: Player[], matches: Match[], seasonId?: string): PlayerStats[] => {
    const filteredMatches = seasonId && seasonId !== 'all'
      ? matches.filter((m) => m.season_id === seasonId)
      : matches;

    const statsMap: Record<string, PlayerStats> = {};

    players.forEach((p) => {
      statsMap[p.id] = {
        player: p,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        winRate: 0,
        goals: 0,
        goalsPerMatch: 0,
        mvpCount: 0,
      };
    });

    filteredMatches.forEach((match) => {
      // Check MVP
      if (match.mvp_player_id && statsMap[match.mvp_player_id]) {
        statsMap[match.mvp_player_id].mvpCount += 1;
      }

      // Check match players
      (match.match_players || []).forEach((mp) => {
        const pStats = statsMap[mp.player_id];
        if (!pStats) return;

        pStats.matchesPlayed += 1;
        pStats.goals += mp.goals || 0;

        // Calculate Win/Draw/Loss
        const isZeleni = mp.team === 'zeleni';
        const myScore = isZeleni ? match.zeleni_score : match.sareni_score;
        const opponentScore = isZeleni ? match.sareni_score : match.zeleni_score;

        if (myScore > opponentScore) {
          pStats.wins += 1;
        } else if (myScore === opponentScore) {
          pStats.draws += 1;
        } else {
          pStats.losses += 1;
        }
      });
    });

    return Object.values(statsMap)
      .map((stat) => ({
        ...stat,
        winRate:
          stat.matchesPlayed > 0
            ? Math.round((stat.wins / stat.matchesPlayed) * 100)
            : 0,
        goalsPerMatch:
          stat.matchesPlayed > 0
            ? Number((stat.goals / stat.matchesPlayed).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.goals - a.goals || b.mvpCount - a.mvpCount || b.winRate - a.winRate);
  },
};
