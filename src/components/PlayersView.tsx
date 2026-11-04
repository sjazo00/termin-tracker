import React, { useState, useMemo } from 'react';
import {
  Users,
  Trophy,
  Award,
  Search,
  CheckCircle2,
  Calendar,
  Flame,
  ArrowUpRight,
  UserCheck,
  Percent,
} from 'lucide-react';
import type { Player, Match, PlayerStats, Season } from '../types';

interface PlayersViewProps {
  players: Player[];
  matches: Match[];
  stats: PlayerStats[];
  seasons: Season[];
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  initialSelectedPlayerId?: string | null;
  onNavigateToMatch?: (matchId: string) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  players,
  matches,
  stats,
  seasons,
  selectedSeasonId,
  setSelectedSeasonId,
  initialSelectedPlayerId,
  onNavigateToMatch,
}) => {
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  // Default selection: initialSelectedPlayerId, or top scorer, or first player
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => {
    if (initialSelectedPlayerId && players.some((p) => p.id === initialSelectedPlayerId)) {
      return initialSelectedPlayerId;
    }
    if (stats.length > 0) {
      return stats[0].player.id;
    }
    return players[0]?.id || '';
  });

  // Keep selected player synced if external initial prop changes
  React.useEffect(() => {
    if (initialSelectedPlayerId && players.some((p) => p.id === initialSelectedPlayerId)) {
      setSelectedPlayerId(initialSelectedPlayerId);
    }
  }, [initialSelectedPlayerId, players]);

  // Filter matches by current season if selected
  const filteredMatches = useMemo(() => {
    return selectedSeasonId && selectedSeasonId !== 'all'
      ? matches.filter((m) => m.season_id === selectedSeasonId)
      : matches;
  }, [matches, selectedSeasonId]);

  // Recalculate or find stats for current season
  const playerStatsMap = useMemo(() => {
    const map = new Map<string, PlayerStats>();
    stats.forEach((s) => map.set(s.player.id, s));
    return map;
  }, [stats]);

  // Filter players list
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        if (activeOnly && !p.is_active) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.nickname && p.nickname.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const statsA = playerStatsMap.get(a.id);
        const statsB = playerStatsMap.get(b.id);
        const goalsA = statsA ? statsA.goals : 0;
        const goalsB = statsB ? statsB.goals : 0;
        return goalsB - goalsA || a.name.localeCompare(b.name);
      });
  }, [players, activeOnly, search, playerStatsMap]);

  // Selected player object & stats
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || filteredPlayers[0];
  const selectedStats = selectedPlayer ? playerStatsMap.get(selectedPlayer.id) : null;

  // Selected player per-match history (all matches the player played in)
  const playerMatchesHistory = useMemo(() => {
    if (!selectedPlayer) return [];

    return filteredMatches
      .filter((m) => m.match_players?.some((mp) => mp.player_id === selectedPlayer.id))
      .map((match) => {
        const mp = match.match_players?.find((p) => p.player_id === selectedPlayer.id)!;
        const isZeleni = mp.team === 'zeleni';
        const teamScore = isZeleni ? match.zeleni_score : match.sareni_score;
        const opponentScore = isZeleni ? match.sareni_score : match.zeleni_score;

        let result: 'win' | 'draw' | 'loss' = 'draw';
        if (teamScore > opponentScore) result = 'win';
        else if (teamScore < opponentScore) result = 'loss';

        const isMvp = match.mvp_player_id === selectedPlayer.id;

        return {
          match,
          mp,
          team: mp.team,
          goals: mp.goals || 0,
          result,
          teamScore,
          opponentScore,
          isMvp,
        };
      })
      .sort((a, b) => new Date(b.match.date).getTime() - new Date(a.match.date).getTime());
  }, [selectedPlayer, filteredMatches]);

  // Team breakdown stats for selected player
  const teamBreakdown = useMemo(() => {
    let zeleniCount = 0;
    let zeleniWins = 0;
    let zeleniGoals = 0;
    let sareniCount = 0;
    let sareniWins = 0;
    let sareniGoals = 0;

    playerMatchesHistory.forEach((h) => {
      if (h.team === 'zeleni') {
        zeleniCount += 1;
        if (h.result === 'win') zeleniWins += 1;
        zeleniGoals += h.goals;
      } else {
        sareniCount += 1;
        if (h.result === 'win') sareniWins += 1;
        sareniGoals += h.goals;
      }
    });

    return {
      zeleni: { count: zeleniCount, wins: zeleniWins, goals: zeleniGoals },
      sareni: { count: sareniCount, wins: sareniWins, goals: sareniGoals },
    };
  }, [playerMatchesHistory]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('hr-HR', {
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Header & Season Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-400" />
            <span>Igrači & Statistika</span>
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Odaberite igrača za pregled ukupne forme, golova, MVP naslova i detaljnog učinka po terminima.
          </p>
        </div>

        {/* Season Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">Sezona:</label>
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="bg-[#121c15] border border-[#23422e] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
          >
            <option value="all">Sve sezone (Ukupno)</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.is_current ? '⭐ (Aktivna)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PLAYER LIST & SEARCH (4 Cols on lg) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Search & Filter Bar */}
          <div className="bg-[#0f1712] border border-[#1e3326] p-3 rounded-2xl shadow-lg space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pretraži igrača..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#16221b] border border-[#264431] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
              <span>Prikazano: <strong className="text-white">{filteredPlayers.length}</strong></span>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="rounded border-[#264431] text-emerald-500 focus:ring-emerald-500"
                />
                <span>Samo aktivni</span>
              </label>
            </div>
          </div>

          {/* Players Scrollable List */}
          <div className="bg-[#0f1712] border border-[#1e3326] rounded-2xl overflow-hidden shadow-xl max-h-[620px] overflow-y-auto divide-y divide-[#182a20]">
            {filteredPlayers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nema igrača koji odgovaraju pretrazi.
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const isSelected = selectedPlayer?.id === player.id;
                const pStat = playerStatsMap.get(player.id);
                const goals = pStat ? pStat.goals : 0;
                const matchesCount = pStat ? pStat.matchesPlayed : 0;
                const mvpCount = pStat ? pStat.mvpCount : 0;
                const winRate = pStat ? pStat.winRate : 0;

                return (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    className={`w-full text-left p-3.5 transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#183121] border-l-4 border-emerald-400 text-white'
                        : 'hover:bg-[#14231a] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-extrabold shadow-md'
                            : 'bg-[#1a2d21] text-emerald-400 border-[#2b4d37]'
                        }`}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate flex items-center gap-1.5">
                          <span className={isSelected ? 'text-white font-extrabold' : 'text-slate-100'}>
                            {player.name}
                          </span>
                          {!player.is_active && (
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                              Pauza
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{matchesCount} ut.</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">{winRate}% win</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-2 shrink-0">
                      {mvpCount > 0 && (
                        <span className="text-xs font-bold text-purple-300 bg-purple-950/70 border border-purple-800/80 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          🏆 {mvpCount}
                        </span>
                      )}
                      <span className="text-xs font-mono font-black text-white bg-[#1e3828] border border-[#2a4f38] px-2 py-0.5 rounded-lg flex items-center gap-1">
                        ⚽ {goals}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: SELECTED PLAYER DETAILED PROFILE & MATCH HISTORY (8 Cols on lg) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPlayer ? (
            <>
              {/* PLAYER PROFILE HERO CARD */}
              <div className="bg-[#0f1712] border-2 border-[#1e3828] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                {/* Football pitch glow decoration */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    {/* Big Avatar */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 text-slate-950 font-black text-2xl sm:text-3xl flex items-center justify-center border-2 border-white shadow-xl shadow-emerald-950/40">
                      {selectedPlayer.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {selectedPlayer.name}
                        </h3>
                        {selectedPlayer.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Aktivan
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                            Neaktivan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Službeni profil i statistika za utorak termin 5 na 5
                      </p>
                    </div>
                  </div>

                  {/* MVP Banner if player has awards */}
                  {selectedStats && selectedStats.mvpCount > 0 && (
                    <div className="bg-gradient-to-r from-purple-900/60 to-purple-950/80 border border-purple-500/40 px-4 py-2.5 rounded-2xl text-purple-200 flex items-center gap-3 shadow-lg">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                        <Award className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-purple-300">
                          MVP Igrač
                        </div>
                        <div className="text-sm font-black text-white">
                          {selectedStats.mvpCount}x Priznanje
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* KEY STATS GRID (Human-friendly high-contrast cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1a2d21]">
                  
                  {/* Matches played */}
                  <div className="bg-[#142219] border border-[#223d2b] p-3.5 rounded-2xl">
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Odigrano termina
                    </span>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-white flex items-baseline gap-1">
                      {selectedStats?.matchesPlayed || 0}
                      <span className="text-xs font-normal text-slate-400 font-sans">utakmica</span>
                    </div>
                  </div>

                  {/* Goals */}
                  <div className="bg-[#142219] border border-[#223d2b] p-3.5 rounded-2xl">
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Ukupno golova
                    </span>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-white flex items-baseline gap-1">
                      ⚽ {selectedStats?.goals || 0}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                      <span>Prosjek: <strong>{selectedStats?.goalsPerMatch || 0}</strong> po ut.</span>
                      {(selectedStats?.penaltyGoals || 0) > 0 && (
                        <span className="text-amber-300 font-bold">
                          • 🎯 {selectedStats?.penaltyGoals}p
                        </span>
                      )}
                      {(selectedStats?.ownGoals || 0) > 0 && (
                        <span className="text-rose-400 font-bold">
                          • ⚠️ {selectedStats?.ownGoals} AG
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Win rate */}
                  <div className="bg-[#142219] border border-[#223d2b] p-3.5 rounded-2xl">
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Pobjednički omjer
                    </span>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 flex items-baseline gap-1">
                      {selectedStats?.winRate || 0}%
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {selectedStats?.wins || 0} pobjeda
                    </span>
                  </div>

                  {/* Record W-D-L */}
                  <div className="bg-[#142219] border border-[#223d2b] p-3.5 rounded-2xl">
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Omjer (P - N - I)
                    </span>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-white flex items-baseline gap-1.5 mt-1">
                      <span className="text-emerald-400 font-black">{selectedStats?.wins || 0}</span>
                      <span className="text-slate-500">-</span>
                      <span className="text-slate-300 font-black">{selectedStats?.draws || 0}</span>
                      <span className="text-slate-500">-</span>
                      <span className="text-rose-400 font-black">{selectedStats?.losses || 0}</span>
                    </div>
                  </div>

                </div>

                {/* Team performance breakdown: Zeleni vs Šareni */}
                <div className="mt-4 pt-4 border-t border-[#1a2d21] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      <span className="font-bold text-emerald-300">Kao ZELENI:</span>
                    </div>
                    <div className="text-slate-200">
                      <strong>{teamBreakdown.zeleni.count}</strong> ut. •{' '}
                      <strong>{teamBreakdown.zeleni.wins}</strong> pobjeda •{' '}
                      <span className="text-emerald-300 font-bold">⚽ {teamBreakdown.zeleni.goals}</span>
                    </div>
                  </div>

                  <div className="bg-amber-950/30 border border-amber-900/40 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span className="font-bold text-amber-300">Kao ŠARENI:</span>
                    </div>
                    <div className="text-slate-200">
                      <strong>{teamBreakdown.sareni.count}</strong> ut. •{' '}
                      <strong>{teamBreakdown.sareni.wins}</strong> pobjeda •{' '}
                      <span className="text-amber-300 font-bold">⚽ {teamBreakdown.sareni.goals}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* PER-TERMIN BREAKDOWN: "ŠTO JE NAPRAVIO NA POJEDINOM TERMINU" */}
              <div className="bg-[#0f1712] border border-[#1e3326] rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-black text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                      <span>Učinak po pojedinim terminima</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kronološki pregled svih odigranih utakmica igrača s postignutim golovima i ishodom.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                    {playerMatchesHistory.length} zabilježenih nastupa
                  </span>
                </div>

                {playerMatchesHistory.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#23422e] rounded-2xl bg-[#121c15]">
                    <Users className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <p className="text-white font-bold text-sm">Nema odigranih termina</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Igrač još nije zabilježen u sastavu niti jedne utakmice za odabranu sezonu.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {playerMatchesHistory.map((item) => {
                      const { match, team, goals, result, isMvp } = item;
                      const isZeleni = team === 'zeleni';

                      return (
                        <div
                          key={match.id}
                          className="bg-[#142219] hover:bg-[#18291e] border border-[#233d2b] hover:border-emerald-500/40 rounded-2xl p-4 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          {/* Left: Date & Team */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white capitalize">
                                {formatDate(match.date)}
                              </span>
                              {match.season && (
                                <span className="text-[10px] font-semibold text-slate-400 bg-[#1b2f22] px-2 py-0.5 rounded border border-[#2a4d36]">
                                  {match.season.name}
                                </span>
                              )}
                              {isMvp && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-purple-200 bg-purple-950/80 border border-purple-500/50 px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                  🏆 MVP Utakmice
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-400">Igrao za:</span>
                              {isZeleni ? (
                                <span className="inline-flex items-center gap-1 font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  ZELENI
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-extrabold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  ŠARENI
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle: Match Result Score */}
                          <div className="flex items-center justify-between sm:justify-center gap-4 bg-[#0d1610] px-4 py-2 rounded-xl border border-[#1e3425]">
                            <div className="text-right">
                              <span
                                className={`text-xs font-black uppercase ${
                                  isZeleni ? 'text-emerald-400 underline underline-offset-2' : 'text-slate-400'
                                }`}
                              >
                                Zeleni
                              </span>
                            </div>

                            <div className="text-base sm:text-lg font-mono font-black text-white flex items-center gap-1.5">
                              <span className={match.zeleni_score > match.sareni_score ? 'text-emerald-400' : 'text-white'}>
                                {match.zeleni_score}
                              </span>
                              <span className="text-slate-500">:</span>
                              <span className={match.sareni_score > match.zeleni_score ? 'text-amber-400' : 'text-white'}>
                                {match.sareni_score}
                              </span>
                            </div>

                            <div className="text-left">
                              <span
                                className={`text-xs font-black uppercase ${
                                  !isZeleni ? 'text-amber-400 underline underline-offset-2' : 'text-slate-400'
                                }`}
                              >
                                Šareni
                              </span>
                            </div>

                            {/* Result Badge */}
                            <div className="ml-2">
                              {result === 'win' ? (
                                <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  Pobjeda
                                </span>
                              ) : result === 'draw' ? (
                                <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-700/40 text-slate-300 border border-slate-600">
                                  Remi
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                  Poraz
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Goals Scored by Player */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 min-w-[130px]">
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Učinak na terminu:
                              </span>
                              <span
                                className={`text-sm font-black font-mono flex items-center justify-end gap-1 ${
                                  goals > 0 ? 'text-white' : 'text-slate-400'
                                }`}
                              >
                                {goals > 0 ? (
                                  <>
                                    <span>⚽</span>
                                    <span className="text-emerald-300 font-extrabold">
                                      {goals} {goals === 1 ? 'gol' : goals < 5 ? 'gola' : 'golova'}
                                    </span>
                                    {item.mp.penalty_goals ? (
                                      <span className="text-amber-300 text-xs font-bold">
                                        ({item.mp.penalty_goals}p)
                                      </span>
                                    ) : null}
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Bez gola (0)</span>
                                )}
                              </span>
                              {(item.mp.own_goals || 0) > 0 && (
                                <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800/50 block text-right mt-0.5">
                                  ⚠️ {item.mp.own_goals} autogol
                                </span>
                              )}
                            </div>

                            {onNavigateToMatch && (
                              <button
                                onClick={() => onNavigateToMatch(match.id)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-[#1f3627] rounded-lg transition-colors border border-[#264431]"
                                title="Prikaži utakmicu"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-[#0f1712] border border-[#1e3326] rounded-3xl">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Nije odabran igrač</h3>
              <p className="text-slate-400 text-sm mt-1">
                Odaberite igrača s lijeve strane za prikaz detaljne statistike i povijesti termina.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
