import React, { useState } from 'react';
import { Trophy, Award, Flame, Calendar, ArrowRight, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { SoccerPitch } from './SoccerPitch';
import type { Match, PlayerStats, Season } from '../types';

interface DashboardViewProps {
  latestMatch?: Match;
  stats: PlayerStats[];
  seasons: Season[];
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'stats' | 'players' | 'matches' | 'add-match', mode?: string) => void;
  onOpenSettings: () => void;
  isSupabaseConnected: boolean;
  onSelectPlayer?: (playerId: string) => void;
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
  onSelectPlayer,
}) => {
  const [showPitch, setShowPitch] = useState(true);

  // Highlights
  const topScorer = stats.length > 0 && stats[0].goals > 0 ? stats[0] : null;
  const topMvp = [...stats].sort((a, b) => b.mvpCount - a.mvpCount)[0];
  const topWinRate = [...stats]
    .filter((s) => s.matchesPlayed >= 2)
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins)[0];

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

  // Scorers sorted strictly descending
  const latestZeleniScorers = latestMatch?.match_players
    ?.filter((mp) => mp.team === 'zeleni' && (mp.goals || 0) > 0)
    .sort((a, b) => b.goals - a.goals || (a.player?.name || '').localeCompare(b.player?.name || '')) || [];

  const latestSareniScorers = latestMatch?.match_players
    ?.filter((mp) => mp.team === 'sareni' && (mp.goals || 0) > 0)
    .sort((a, b) => b.goals - a.goals || (a.player?.name || '').localeCompare(b.player?.name || '')) || [];

  const allLatestScorers = [
    ...(latestMatch?.match_players?.filter((mp) => (mp.goals || 0) > 0) || []),
  ].sort((a, b) => b.goals - a.goals || (a.player?.name || '').localeCompare(b.player?.name || ''));

  return (
    <div className="space-y-8 pb-14">
      {/* Cloud DB Connection Alert if in local mode */}
      {!isSupabaseConnected && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-4 rounded-r-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0f1712]">
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
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
          >
            Poveži Supabase
          </button>
        </div>
      )}

      {/* Hero Welcome & Season Selector (Clean Football Styling: Green / Black / White) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f1712] p-6 rounded-3xl border-2 border-[#1e3828] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Svaki utorak • Termin 5 na 5
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Zeleni <span className="text-slate-500 font-light">vs</span> Šareni
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Službeni centar rezultata, strijelaca, taktičkog prikaza terena i statistike igrača.
          </p>
        </div>

        {/* Season Filter Dropdown */}
        <div className="flex items-center gap-2 relative z-10">
          <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">Sezona:</label>
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="bg-[#14231a] border border-[#264431] text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
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

      {/* LATEST MATCH CARD WITH SCOREBOARD & SOCCER PITCH */}
      {latestMatch ? (
        <div className="relative overflow-hidden rounded-3xl border-2 border-[#1e3828] bg-[#0f1712] shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 bg-[#090e0b] border-b border-[#1b2f21] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-white text-xs sm:text-sm font-extrabold capitalize">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{formatDate(latestMatch.date)}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Posljednji odigrani termin
              </span>
              <button
                onClick={() => setShowPitch(!showPitch)}
                className="px-3 py-1 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#16271c] border border-[#264431] flex items-center gap-1.5 transition-colors"
              >
                {showPitch ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
                <span>{showPitch ? 'Prikaz strijelaca' : 'Prikaz terena'}</span>
              </button>
            </div>
          </div>

          {/* Big Scoreboard */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 text-center">
              
              {/* Team Zeleni */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl mb-2 border-2 border-white shadow-lg">
                  Z
                </div>
                <h3 className="font-extrabold text-xl text-emerald-400 tracking-wide">ZELENI</h3>
                <span className="text-xs text-slate-400 mt-1">Zeleni Markeri</span>
              </div>

              {/* Score in middle */}
              <div className="flex flex-col items-center justify-center order-first md:order-none py-2">
                <div className="flex items-center gap-4 text-5xl sm:text-6xl font-black tracking-tighter text-white font-mono">
                  <span className={latestMatch.zeleni_score > latestMatch.sareni_score ? 'text-emerald-400' : 'text-white'}>
                    {latestMatch.zeleni_score}
                  </span>
                  <span className="text-slate-600">:</span>
                  <span className={latestMatch.sareni_score > latestMatch.zeleni_score ? 'text-amber-400' : 'text-white'}>
                    {latestMatch.sareni_score}
                  </span>
                </div>
                <div className="mt-2 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider bg-[#16271c] text-white border border-[#25422e]">
                  {latestMatch.zeleni_score > latestMatch.sareni_score
                    ? 'Pobjeda Zelenih'
                    : latestMatch.sareni_score > latestMatch.zeleni_score
                    ? 'Pobjeda Šarenih'
                    : 'Neriješeno'}
                </div>
              </div>

              {/* Team Šareni */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40">
                <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl mb-2 border-2 border-white shadow-lg">
                  Š
                </div>
                <h3 className="font-extrabold text-xl text-amber-400 tracking-wide">ŠARENI</h3>
                <span className="text-xs text-slate-400 mt-1">Bez Markera</span>
              </div>

            </div>

            {/* VISUAL SOCCER PITCH FOR LATEST MATCH */}
            {showPitch && (
              <div className="mt-8 pt-6 border-t border-[#1b2f21]">
                <div className="max-w-2xl mx-auto">
                  <SoccerPitch match={latestMatch} onSelectPlayer={onSelectPlayer} />
                </div>
              </div>
            )}

            {/* ALL SCORERS SORTED DESCENDING */}
            <div className="mt-8 pt-6 border-t border-[#1b2f21]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <span>⚽</span> Strijelci termina (poredani od najviše do najmanje golova):
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {allLatestScorers.reduce((acc, s) => acc + s.goals, 0)} golova
                </span>
              </div>

              {allLatestScorers.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">
                  Nema golova u ovoj utakmici.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {allLatestScorers.map((scorer, idx) => {
                    const isZeleni = scorer.team === 'zeleni';
                    return (
                      <div
                        key={scorer.player_id}
                        onClick={() => onSelectPlayer && onSelectPlayer(scorer.player_id)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                          onSelectPlayer ? 'cursor-pointer hover:scale-105' : ''
                        } ${
                          isZeleni
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        }`}
                      >
                        <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                        <span className="font-bold text-sm text-white">{scorer.player?.name}</span>
                        <span
                          className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded ${
                            isZeleni ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {isZeleni ? 'Zeleni' : 'Šareni'}
                        </span>
                        <span className="font-mono font-black text-sm text-white bg-black/60 px-2 py-0.5 rounded-md border border-white/20">
                          ⚽ {scorer.goals}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scorers per Team (Sorted descending) */}
            <div className="mt-6 pt-6 border-t border-[#1b2f21] grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Scorers Zeleni */}
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Strijelci Zelenih:
                </div>
                <div className="space-y-1">
                  {latestZeleniScorers.length ? (
                    latestZeleniScorers.map((mp) => (
                      <div
                        key={mp.player_id}
                        onClick={() => onSelectPlayer && onSelectPlayer(mp.player_id)}
                        className={`flex items-center justify-between text-sm py-1.5 px-3 rounded-xl bg-[#0d1610] border border-[#1e3425] ${
                          onSelectPlayer ? 'cursor-pointer hover:bg-[#14231a]' : ''
                        }`}
                      >
                        <span className="text-white font-medium">{mp.player?.name}</span>
                        <span className="font-bold text-emerald-400 font-mono">⚽ {mp.goals}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Nema zabijenih golova</span>
                  )}
                </div>
              </div>

              {/* Scorers Šareni */}
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Strijelci Šarenih:
                </div>
                <div className="space-y-1">
                  {latestSareniScorers.length ? (
                    latestSareniScorers.map((mp) => (
                      <div
                        key={mp.player_id}
                        onClick={() => onSelectPlayer && onSelectPlayer(mp.player_id)}
                        className={`flex items-center justify-between text-sm py-1.5 px-3 rounded-xl bg-[#0d1610] border border-[#1e3425] ${
                          onSelectPlayer ? 'cursor-pointer hover:bg-[#14231a]' : ''
                        }`}
                      >
                        <span className="text-white font-medium">{mp.player?.name}</span>
                        <span className="font-bold text-amber-400 font-mono">⚽ {mp.goals}</span>
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
              <div className="mt-6 pt-5 border-t border-[#1b2f21] flex items-center justify-center">
                <div
                  onClick={() => onSelectPlayer && onSelectPlayer(latestMatch.mvp_player_id!)}
                  className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-purple-900/40 to-purple-950/60 border border-purple-500/40 text-purple-200 shadow-xl ${
                    onSelectPlayer ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                    <Award className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                      MVP Utakmice
                    </div>
                    <div className="font-extrabold text-sm sm:text-base text-white">
                      {latestMatch.mvp_player.name}
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
        <div className="text-center p-12 bg-[#0f1712] rounded-3xl border border-[#1e3326]">
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
        
        {/* Top Scorer Card -> Navigates to Stats (Strijelci) */}
        <div
          onClick={() => onNavigateTab('stats', 'goals')}
          className="group cursor-pointer p-6 rounded-3xl bg-[#0f1712] border-2 border-[#1e3828] hover:border-emerald-500/60 transition-all hover:shadow-xl hover:shadow-emerald-500/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              Statistika <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Zlatna Kopačka
          </span>
          <div className="mt-1">
            <h4 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
              {topScorer ? topScorer.player.name : '—'}
            </h4>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1b2f21] flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Ukupno golova:</span>
            <span className="text-2xl font-black text-white font-mono">
              {topScorer ? topScorer.goals : 0} ⚽
            </span>
          </div>
        </div>

        {/* Top MVP Card -> Navigates to Stats (MVP) */}
        <div
          onClick={() => onNavigateTab('stats', 'mvp')}
          className="group cursor-pointer p-6 rounded-3xl bg-[#0f1712] border-2 border-[#1e3828] hover:border-purple-500/60 transition-all hover:shadow-xl hover:shadow-purple-500/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
              MVP poredak <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            MVP Vladar
          </span>
          <div className="mt-1">
            <h4 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors">
              {topMvp && topMvp.mvpCount > 0 ? topMvp.player.name : '—'}
            </h4>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1b2f21] flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Osvojeni MVP:</span>
            <span className="text-2xl font-black text-purple-300 font-mono">
              {topMvp ? topMvp.mvpCount : 0} 🏆
            </span>
          </div>
        </div>

        {/* Best Win Rate Card -> Navigates to Stats (Win rate) */}
        <div
          onClick={() => onNavigateTab('stats', 'winrate')}
          className="group cursor-pointer p-6 rounded-3xl bg-[#0f1712] border-2 border-[#1e3828] hover:border-emerald-500/60 transition-all hover:shadow-xl hover:shadow-emerald-500/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Flame className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              Postotak <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Talisman Pobjeda
          </span>
          <div className="mt-1">
            <h4 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
              {topWinRate ? topWinRate.player.name : '—'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {topWinRate ? `${topWinRate.wins} pobjeda u ${topWinRate.matchesPlayed} tekmi` : ''}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1b2f21] flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Postotak pobjeda:</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {topWinRate ? `${topWinRate.winRate}%` : '0%'}
            </span>
          </div>
        </div>

      </div>

      {/* Quick Action Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#102417] to-[#0f1c13] border-2 border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span>⚽ Odigran je novi utorak termin?</span>
          </h3>
          <p className="text-slate-300 text-sm mt-0.5">
            Zabilježite rezultat, golove po igraču i proglasite novog MVP igrača uz automatsko osvježavanje ljestvica.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('add-match')}
          className="px-6 py-3 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 whitespace-nowrap active:scale-95"
        >
          <span>Unesi Rezultat</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
