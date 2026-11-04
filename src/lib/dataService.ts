import { supabase } from './supabase';
import type { Player, Season, Match, PlayerStats, MvpVote } from '../types';
import { INITIAL_MATCHES, INITIAL_PLAYERS, INITIAL_SEASONS } from './mockData';

const LOCAL_STORAGE_KEYS = {
  PLAYERS: 'termin_local_players',
  SEASONS: 'termin_local_seasons',
  MATCHES: 'termin_local_matches',
  MVP_VOTES: 'termin_local_mvp_votes',
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
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.MVP_VOTES)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.MVP_VOTES, JSON.stringify([]));
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
        goals: mp.goals || 0,
        penalty_goals: mp.penalty_goals || 0,
        own_goals: mp.own_goals || 0,
        player: players.find((p) => p.id === mp.player_id),
      })),
    }));
  },

  addMatch: async (
    matchData: Omit<Match, 'id' | 'created_at' | 'match_players' | 'mvp_player' | 'season'>,
    playersData: Array<{
      player_id: string;
      team: 'zeleni' | 'sareni';
      goals: number;
      penalty_goals?: number;
      own_goals?: number;
    }>
  ): Promise<Match> => {
    if (supabase) {
      // 1. Insert match
      const { data: match, error: mErr } = await supabase
        .from('matches')
        .insert([matchData])
        .select()
        .single();
      if (mErr) throw mErr;

      // 2. Insert match_players with penalty_goals and own_goals
      const playersToInsert = playersData.map((p) => ({
        match_id: match.id,
        player_id: p.player_id,
        team: p.team,
        goals: p.goals || 0,
        penalty_goals: p.penalty_goals || 0,
        own_goals: p.own_goals || 0,
      }));

      try {
        const { error: mpErr } = await supabase.from('match_players').insert(playersToInsert);
        if (mpErr) throw mpErr;
      } catch (err: any) {
        // Fallback in case columns do not exist yet in Supabase
        console.warn('Fallback inserting match_players without extra columns:', err);
        const fallbackPlayers = playersData.map((p) => ({
          match_id: match.id,
          player_id: p.player_id,
          team: p.team,
          goals: p.goals || 0,
        }));
        const { error: fbErr } = await supabase.from('match_players').insert(fallbackPlayers);
        if (fbErr) throw fbErr;
      }

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
        goals: p.goals || 0,
        penalty_goals: p.penalty_goals || 0,
        own_goals: p.own_goals || 0,
      })),
    };

    matches.unshift(newMatch);
    localStorage.setItem(LOCAL_STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    return newMatch;
  },

  updateMatchMvp: async (matchId: string, mvpPlayerId: string | null): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('matches')
        .update({ mvp_player_id: mvpPlayerId })
        .eq('id', matchId);
      if (error) {
        console.error('Error updating match MVP in Supabase:', error);
        throw error;
      }
      return;
    }

    const matches = await dataService.getMatches();
    const idx = matches.findIndex((m) => m.id === matchId);
    if (idx !== -1) {
      matches[idx].mvp_player_id = mvpPlayerId;
      localStorage.setItem(LOCAL_STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    }
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

  // 4. MVP VOTING POLL
  getMvpVotes: async (matchId: string): Promise<MvpVote[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('mvp_votes')
          .select(`
            *,
            voter_player:players!mvp_votes_voter_player_id_fkey(*),
            candidate_player:players!mvp_votes_candidate_player_id_fkey(*)
          `)
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase mvp_votes query failed, checking fallback:', err);
      }
    }

    // Local storage fallback
    initLocalStorage();
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.MVP_VOTES);
    const allVotes: MvpVote[] = raw ? JSON.parse(raw) : [];
    const matchVotes = allVotes.filter((v) => v.match_id === matchId);
    const players = await dataService.getPlayers();

    return matchVotes.map((v) => ({
      ...v,
      voter_player: players.find((p) => p.id === v.voter_player_id),
      candidate_player: players.find((p) => p.id === v.candidate_player_id),
    }));
  },

  addMvpVote: async (
    matchId: string,
    voterPlayerId: string,
    candidatePlayerId: string
  ): Promise<MvpVote> => {
    if (voterPlayerId === candidatePlayerId) {
      throw new Error('Igrač ne može glasati za samoga sebe!');
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('mvp_votes')
          .insert([
            {
              match_id: matchId,
              voter_player_id: voterPlayerId,
              candidate_player_id: candidatePlayerId,
            },
          ])
          .select(`
            *,
            voter_player:players!mvp_votes_voter_player_id_fkey(*),
            candidate_player:players!mvp_votes_candidate_player_id_fkey(*)
          `)
          .single();

        if (error) {
          if (error.code === '23505') {
            throw new Error('Ovaj igrač je već glasao za ovu utakmicu!');
          }
          throw error;
        }
        return data;
      } catch (err: any) {
        console.warn('Supabase insert vote fallback:', err);
        if (err.message && err.message.includes('već glasao')) {
          throw err;
        }
      }
    }

    // Local storage fallback
    initLocalStorage();
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.MVP_VOTES);
    const allVotes: MvpVote[] = raw ? JSON.parse(raw) : [];

    const alreadyVoted = allVotes.some(
      (v) => v.match_id === matchId && v.voter_player_id === voterPlayerId
    );
    if (alreadyVoted) {
      throw new Error('Ovaj igrač je već glasao za ovu utakmicu!');
    }

    const players = await dataService.getPlayers();
    const newVote: MvpVote = {
      id: 'vote-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      match_id: matchId,
      voter_player_id: voterPlayerId,
      candidate_player_id: candidatePlayerId,
      created_at: new Date().toISOString(),
      voter_player: players.find((p) => p.id === voterPlayerId),
      candidate_player: players.find((p) => p.id === candidatePlayerId),
    };

    allVotes.push(newVote);
    localStorage.setItem(LOCAL_STORAGE_KEYS.MVP_VOTES, JSON.stringify(allVotes));
    return newVote;
  },

  resetMvpVotes: async (matchId: string): Promise<void> => {
    if (supabase) {
      try {
        await supabase.from('mvp_votes').delete().eq('match_id', matchId);
      } catch (err) {
        console.warn('Error deleting mvp_votes from Supabase:', err);
      }
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.MVP_VOTES);
    if (raw) {
      const allVotes: MvpVote[] = JSON.parse(raw);
      const filtered = allVotes.filter((v) => v.match_id !== matchId);
      localStorage.setItem(LOCAL_STORAGE_KEYS.MVP_VOTES, JSON.stringify(filtered));
    }
  },

  calculateMvpWinner: (
    match: Match,
    votes: MvpVote[]
  ): {
    winner: Player | null;
    tieBreakReason?: string;
    isTieBroken: boolean;
    voteTally: Array<{
      player: Player;
      team: 'zeleni' | 'sareni';
      votesCount: number;
      isWinnerTeam: boolean;
      goalsInMatch: number;
    }>;
  } => {
    const matchPlayers = match.match_players || [];
    if (matchPlayers.length === 0 || votes.length === 0) {
      return { winner: null, isTieBroken: false, voteTally: [] };
    }

    // Build vote count map
    const votesByCandidate: Record<string, number> = {};
    votes.forEach((v) => {
      votesByCandidate[v.candidate_player_id] = (votesByCandidate[v.candidate_player_id] || 0) + 1;
    });

    const isZeleniWinner = match.zeleni_score > match.sareni_score;
    const isSareniWinner = match.sareni_score > match.zeleni_score;

    // Create candidate items
    const candidates = matchPlayers
      .map((mp) => {
        const isWinnerTeam =
          (mp.team === 'zeleni' && isZeleniWinner) ||
          (mp.team === 'sareni' && isSareniWinner);

        return {
          player: mp.player || { id: mp.player_id, name: 'Igrač', is_active: true },
          team: mp.team,
          votesCount: votesByCandidate[mp.player_id] || 0,
          isWinnerTeam,
          goalsInMatch: mp.goals || 0,
        };
      })
      .sort((a, b) => {
        // 1. Most votes
        if (b.votesCount !== a.votesCount) {
          return b.votesCount - a.votesCount;
        }
        // 2. Tie-break: Team victory (Pobjeda)
        if (a.isWinnerTeam !== b.isWinnerTeam) {
          return a.isWinnerTeam ? -1 : 1;
        }
        // 3. Tie-break: Goals scored in this match (Broj golova)
        if (b.goalsInMatch !== a.goalsInMatch) {
          return b.goalsInMatch - a.goalsInMatch;
        }
        return a.player.name.localeCompare(b.player.name);
      });

    const topCandidate = candidates[0];
    if (!topCandidate || topCandidate.votesCount === 0) {
      return { winner: null, isTieBroken: false, voteTally: candidates };
    }

    // Check if there was a tie with 2nd candidate in votes
    const secondCandidate = candidates[1];
    let tieBreakReason: string | undefined;
    let isTieBroken = false;

    if (secondCandidate && secondCandidate.votesCount === topCandidate.votesCount) {
      isTieBroken = true;
      if (topCandidate.isWinnerTeam && !secondCandidate.isWinnerTeam) {
        tieBreakReason = `Izjednačenje (${topCandidate.votesCount} glasova) - 1. kriterij: Pobjeda u utakmici (${topCandidate.team === 'zeleni' ? 'Zeleni' : 'Šareni'})!`;
      } else if (topCandidate.goalsInMatch > secondCandidate.goalsInMatch) {
        tieBreakReason = `Izjednačenje (${topCandidate.votesCount} glasova) - 2. kriterij: Više golova na terminu (${topCandidate.goalsInMatch} vs ${secondCandidate.goalsInMatch} golova)!`;
      } else {
        tieBreakReason = `Izjednačenje (${topCandidate.votesCount} glasova, jednaka pobjeda i golovi) - MVP potvrđen.`;
      }
    }

    return {
      winner: topCandidate.player,
      tieBreakReason,
      isTieBroken,
      voteTally: candidates,
    };
  },

  // 5. STATS CALCULATION
  calculateStats: (players: Player[], matches: Match[], seasonId?: string): PlayerStats[] => {
    const filteredMatches =
      seasonId && seasonId !== 'all'
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
        penaltyGoals: 0,
        ownGoals: 0,
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
        pStats.penaltyGoals += mp.penalty_goals || 0;
        pStats.ownGoals += mp.own_goals || 0;

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

