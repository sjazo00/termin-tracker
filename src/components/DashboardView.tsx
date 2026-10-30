import React from 'react';
import { Trophy, Award, Flame, Calendar, ArrowRight, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import type { Match, PlayerStats, Season } from '../types';

interface DashboardViewProps {
  latestMatch?: Match;
  stats: PlayerStats[];
  seasons: Season[];
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'leaderboard' | 'mvp' | 'matches' | 'add-match') => void;
  onOpenSettings: () => void;
  isSupabaseConnected: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  latestMatch,
  stats,
  seasons,
  selectedSeasonId,
  setSelectedSeasonId,
  onNavigateTab,
  onOpenSettings,
  isSupabaseConnected,
}) => {
  // Highlights
  const topScorer = stats.length > 0 && stats[0].goals > 0 ? stats[0] : null;
  const topMvp = [...stats].sort((a, b) => b.mvpCount - a.mvpCount)[0];
  const topWinRate = [...stats]
    .filter((s) => s.matchesPlayed >= 2)
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins)[0];

  const currentSeason = seasons.find((s) => s.id === selectedSeasonId) || seasons[0];

  // Helper to format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('hr-HR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Cloud DB Connection Alert if in local mode */}
      {!isSupabaseConnected && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-4 rounded-r-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-amber-300 text-sm">Aplikacija trenutno radi u lokalnom načinu</h4>
              <p className="text-xs text-slate-400">
                Podaci su spremljeni u preglednik. Povežite besplatan <strong>Supabase</strong> račun kako bi svi igrači mogli pratiti rezultate sa svojih mobitela.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
          >
            Poveži Supabase
          </button>
        </div>
      )}

      {/* Hero Welcome & Season Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Svaki utorak • 5 na 5
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Zeleni <span className="text-slate-500 font-light">vs</span> Šareni
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Službeno praćenje rezultata, strijelaca i MVP nagrada.
          </p>
        </div>

        {/* Season Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400 whitespace-nowrap">Sezona:</label>
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
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

      {/* LATEST MATCH CARD */}
      {latestMatch ? (
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-800/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-semibold capitalize">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{formatDate(latestMatch.date)}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Posljednji odigrani termin
            </span>
          </div>

          {/* Big Scoreboard */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 text-center">
              
              {/* Team Zeleni */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xl mb-2 border border-emerald-500/40">
                  Z
                </div>
                <h3 className="font-extrabold text-xl text-emerald-400 tracking-wide">ZELENI</h3>
                <span className="text-xs text-slate-400 mt-1">Zeleni Markeri</span>
              </div>

              {/* Score in middle */}
              <div className="flex flex-col items-center justify-center order-first md:order-none py-2">
                <div className="flex items-center gap-4 text-5xl sm:text-6xl font-black tracking-tighter text-white font-mono">
                  <span className={latestMatch.zeleni_score > latestMatch.sareni_score ? 'text-emerald-400' : 'text-slate-200'}>
                    {latestMatch.zeleni_score}
                  </span>
                  <span className="text-slate-600">:</span>
                  <span className={latestMatch.sareni_score > latestMatch.zeleni_score ? 'text-amber-400' : 'text-slate-200'}>
                    {latestMatch.sareni_score}
                  </span>
                </div>
                <div className="mt-2 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider bg-slate-800 text-slate-300">
                  {latestMatch.zeleni_score > latestMatch.sareni_score
                    ? 'Pobjeda Zelenih'
                    : latestMatch.sareni_score > latestMatch.zeleni_score
                    ? 'Pobjeda Šarenih'
                    : 'Neriješeno'}
                </div>
              </div>

              {/* Team Šareni */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl mb-2 border border-amber-500/40">
                  Š
                </div>
                <h3 className="font-extrabold text-xl text-amber-400 tracking-wide">ŠARENI</h3>
                <span className="text-xs text-slate-400 mt-1">Bez Markera</span>
              </div>

            </div>

            {/* Scorers Breakdown */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Scorers Zeleni */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Strijelci Zelenih:
                </div>
                <div className="space-y-1">
                  {latestMatch.match_players?.filter((mp) => mp.team === 'zeleni' && mp.goals > 0).length ? (
                    latestMatch.match_players
                      ?.filter((mp) => mp.team === 'zeleni' && mp.goals > 0)
                      .map((mp) => (
                        <div
                          key={mp.player_id}
                          className="flex items-center justify-between text-sm py-1 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800"
                        >
                          <span className="text-slate-200 font-medium">
                            {mp.player?.name} {mp.player?.nickname ? `(${mp.player.nickname})` : ''}
                          </span>
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            ⚽ {mp.goals}
                          </span>
                        </div>
                      ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Nema zabijenih golova</span>
                  )}
                </div>
              </div>

              {/* Scorers Šareni */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Strijelci Šarenih:
                </div>
                <div className="space-y-1">
                  {latestMatch.match_players?.filter((mp) => mp.team === 'sareni' && mp.goals > 0).length ? (
                    latestMatch.match_players
                      ?.filter((mp) => mp.team === 'sareni' && mp.goals > 0)
                      .map((mp) => (
                        <div
                          key={mp.player_id}
                          className="flex items-center justify-between text-sm py-1 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800"
                        >
                          <span className="text-slate-200 font-medium">
                            {mp.player?.name} {mp.player?.nickname ? `(${mp.player.nickname})` : ''}
                          </span>
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            ⚽ {mp.goals}
                          </span>
                        </div>
                      ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Nema zabijenih golova</span>
                  )}
                </div>
              </div>

            </div>

            {/* MVP Badge */}
            {latestMatch.mvp_player && (
              <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-purple-900/40 border border-purple-500/30 text-purple-200 shadow-lg">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                    <Award className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                      MVP Utakmice
                    </div>
                    <div className="font-extrabold text-sm sm:text-base text-white">
                      {latestMatch.mvp_player.name}{' '}
                      {latestMatch.mvp_player.nickname ? `(${latestMatch.mvp_player.nickname})` : ''}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes if present */}
            {latestMatch.notes && (
              <p className="mt-4 text-center text-xs text-slate-400 italic">
                "{latestMatch.notes}"
              </p>
            )}

          </div>
        </div>
      ) : (
        <div className="text-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Nema unesenih utakmica</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            Još nema zabilježenih rezultata za odabranu sezonu. Kliknite ispod za unos prve utakmice!
          </p>
          <button
            onClick={() => onNavigateTab('add-match')}
            className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors"
          >
            Unesi prvi termin
          </button>
        </div>
      )}

      {/* TOP LEADERS & STAT HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Top Scorer Card */}
        <div
          onClick={() => onNavigateTab('leaderboard')}
          className="group cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
              Ljestvica <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Zlatna Kopačka
          </span>
          <div className="mt-1">
            <h4 className="text-xl font-black text-white">
              {topScorer ? topScorer.player.name : '—'}
            </h4>
            <p className="text-xs text-slate-400">
              {topScorer?.player.nickname ? `"${topScorer.player.nickname}"` : ''}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Ukupno golova:</span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {topScorer ? topScorer.goals : 0} ⚽
            </span>
          </div>
        </div>

        {/* Top MVP Card */}
        <div
          onClick={() => onNavigateTab('mvp')}
          className="group cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/40 transition-all hover:shadow-xl hover:shadow-purple-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
              MVP poredak <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            MVP Vladar
          </span>
          <div className="mt-1">
            <h4 className="text-xl font-black text-white">
              {topMvp && topMvp.mvpCount > 0 ? topMvp.player.name : '—'}
            </h4>
            <p className="text-xs text-slate-400">
              {topMvp?.player.nickname ? `"${topMvp.player.nickname}"` : ''}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Osvojeni MVP:</span>
            <span className="text-2xl font-black text-purple-400 font-mono">
              {topMvp ? topMvp.mvpCount : 0} 🏆
            </span>
          </div>
        </div>

        {/* Best Win Rate Card */}
        <div
          onClick={() => onNavigateTab('leaderboard')}
          className="group cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Flame className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              Postotak <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Talisman Pobjeda
          </span>
          <div className="mt-1">
            <h4 className="text-xl font-black text-white">
              {topWinRate ? topWinRate.player.name : '—'}
            </h4>
            <p className="text-xs text-slate-400">
              {topWinRate ? `${topWinRate.wins} pobjeda u ${topWinRate.matchesPlayed} tekmi` : ''}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Postotak pobjeda:</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {topWinRate ? `${topWinRate.winRate}%` : '0%'}
            </span>
          </div>
        </div>

      </div>

      {/* Quick Action Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚽ Odigran je novi termin u utorak?</span>
          </h3>
          <p className="text-slate-400 text-sm mt-0.5">
            Zabilježite rezultat, golove po igraču i proglasite novog MVP igrača.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('add-match')}
          className="px-5 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 whitespace-nowrap"
        >
          <span>Unesi Rezultat</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
