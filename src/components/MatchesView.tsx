import React, { useState } from 'react';
import { Calendar, Trash2, Award, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';
import { SoccerPitch } from './SoccerPitch';
import type { Match, Season } from '../types';

interface MatchesViewProps {
  matches: Match[];
  seasons: Season[];
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  onDeleteMatch: (id: string) => void;
  adminPin: string;
  onSelectPlayer?: (playerId: string) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  seasons,
  selectedSeasonId,
  setSelectedSeasonId,
  onDeleteMatch,
  adminPin,
  onSelectPlayer,
}) => {
  // Track expanded cards and which view mode ('pitch' | 'list') for each card
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(matches[0]?.id || null);
  const [matchViewModes, setMatchViewModes] = useState<Record<string, 'pitch' | 'list'>>({});

  // Filter matches by season
  const filteredMatches =
    selectedSeasonId && selectedSeasonId !== 'all'
      ? matches.filter((m) => m.season_id === selectedSeasonId)
      : matches;

  const formatDate = (dateStr: string) => {
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

  const handleDelete = (match: Match) => {
    const inputPin = prompt('Unesite Admin PIN za brisanje ove utakmice:');
    if (inputPin === adminPin) {
      if (confirm(`Jeste li sigurni da želite obrisati utakmicu od ${match.date}?`)) {
        onDeleteMatch(match.id);
      }
    } else if (inputPin !== null) {
      alert('Pogrešan PIN kod!');
    }
  };

  const getViewMode = (matchId: string): 'pitch' | 'list' => {
    return matchViewModes[matchId] || 'pitch';
  };

  const setViewMode = (matchId: string, mode: 'pitch' | 'list') => {
    setMatchViewModes((prev) => ({ ...prev, [matchId]: mode }));
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Header & Season Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-emerald-400" />
            <span>Povijest Utakmica</span>
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Arhiva svih termina s taktičkim prikazom terena, bojama timova i strijelcima poredanim po broju golova.
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
            <option value="all">Sve sezone ({matches.length})</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.is_current ? '⭐ (Aktivna)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="text-center p-12 bg-[#0f1712] rounded-3xl border border-[#1e3326]">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-white">Nema odigranih utakmica</h4>
          <p className="text-slate-400 text-sm mt-1">
            U odabranoj sezoni još nema zabilježenih rezultata.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMatches.map((match) => {
            const isExpanded = expandedMatchId === match.id;
            const viewMode = getViewMode(match.id);

            // Filter and sort players by goals descending
            const zeleniPlayers = [
              ...(match.match_players?.filter((mp) => mp.team === 'zeleni') || []),
            ].sort((a, b) => b.goals - a.goals || (a.player?.name || '').localeCompare(b.player?.name || ''));

            const sareniPlayers = [
              ...(match.match_players?.filter((mp) => mp.team === 'sareni') || []),
            ].sort((a, b) => b.goals - a.goals || (a.player?.name || '').localeCompare(b.player?.name || ''));

            // All match goalscorers sorted strictly descending: highest to lowest
            const allScorers = [
              ...(match.match_players?.filter((mp) => (mp.goals || 0) > 0) || []),
            ].sort((a, b) => b.goals - a.goals || (a.player?.name || '').localeCompare(b.player?.name || ''));

            const isZeleniWinner = match.zeleni_score > match.sareni_score;
            const isSareniWinner = match.sareni_score > match.zeleni_score;

            return (
              <div
                key={match.id}
                className="bg-[#0f1712] border-2 border-[#1e3828] hover:border-emerald-500/50 rounded-3xl overflow-hidden transition-all shadow-xl"
              >
                {/* Match Header Bar */}
                <div className="px-5 py-3.5 bg-[#090e0b] border-b border-[#1b2f21] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm"></span>
                    <span className="text-xs sm:text-sm font-extrabold text-white capitalize">
                      {formatDate(match.date)}
                    </span>
                    {match.season && (
                      <span className="text-[11px] font-semibold text-slate-300 bg-[#16271c] px-2 py-0.5 rounded-md border border-[#264431]">
                        {match.season.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {match.mvp_player && (
                      <span
                        onClick={() => onSelectPlayer && onSelectPlayer(match.mvp_player_id!)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold text-purple-200 bg-purple-950/70 border border-purple-500/50 px-3 py-1 rounded-full shadow-sm ${
                          onSelectPlayer ? 'cursor-pointer hover:bg-purple-900/80' : ''
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-purple-300" />
                        <span>MVP: {match.mvp_player.name}</span>
                      </span>
                    )}

                    <button
                      onClick={() => handleDelete(match)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Obriši utakmicu (Admin PIN)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Scoreboard Bar */}
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-3 items-center text-center">
                    {/* Team Zeleni */}
                    <div className="text-right sm:text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="hidden sm:inline-block w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" />
                        <span
                          className={`font-black text-base sm:text-2xl tracking-wide ${
                            isZeleniWinner ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          ZELENI
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-emerald-300/80">Markeri ({zeleniPlayers.length})</div>
                    </div>

                    {/* Final Score */}
                    <div className="flex flex-col items-center">
                      <div className="text-3xl sm:text-5xl font-mono font-black tracking-tight text-white flex items-center gap-2 sm:gap-4">
                        <span className={isZeleniWinner ? 'text-emerald-400' : 'text-white'}>
                          {match.zeleni_score}
                        </span>
                        <span className="text-slate-600">:</span>
                        <span className={isSareniWinner ? 'text-amber-400' : 'text-white'}>
                          {match.sareni_score}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 mt-1 px-2.5 py-0.5 rounded-full bg-[#16271c] border border-[#25422e]">
                        {isZeleniWinner
                          ? 'Pobjeda Zelenih'
                          : isSareniWinner
                          ? 'Pobjeda Šarenih'
                          : 'Neriješeno'}
                      </span>
                    </div>

                    {/* Team Sareni */}
                    <div className="text-left sm:text-center">
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={`font-black text-base sm:text-2xl tracking-wide ${
                            isSareniWinner ? 'text-amber-400' : 'text-white'
                          }`}
                        >
                          ŠARENI
                        </span>
                        <span className="hidden sm:inline-block w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm" />
                      </div>
                      <div className="text-[11px] font-medium text-amber-300/80">Bez markera ({sareniPlayers.length})</div>
                    </div>
                  </div>

                  {/* Notes */}
                  {match.notes && (
                    <p className="text-center text-xs text-slate-400 italic mt-3 bg-[#131f17] py-1.5 px-3 rounded-xl border border-[#203627] max-w-lg mx-auto">
                      "{match.notes}"
                    </p>
                  )}

                  {/* TOP STRIJELCI NA TERMINU (SORTED FROM MOST GOALS TO LEAST GOALS) */}
                  <div className="mt-5 pt-4 border-t border-[#1a2d21]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <span>⚽</span> Popis strijelaca na terminu (od najviše prema najmanje):
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        {allScorers.reduce((sum, s) => sum + s.goals, 0)} ukupno golova
                      </span>
                    </div>

                    {allScorers.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-1 px-2 bg-[#121c15] rounded-lg">
                        Nema zabilježenih strijelaca za ovu utakmicu (0:0).
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {allScorers.map((scorer, sIdx) => {
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
                              <span className="text-xs font-mono font-bold text-slate-400">
                                #{sIdx + 1}
                              </span>
                              <span className="font-bold text-xs sm:text-sm text-white">
                                {scorer.player?.name}
                              </span>
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

                  {/* Toggle details and view modes */}
                  <div className="mt-5 pt-3 border-t border-[#1a2d21] flex flex-wrap items-center justify-between gap-2">
                    {/* View Switcher: Pitch vs List */}
                    {isExpanded && (
                      <div className="flex items-center gap-1 bg-[#0a0f0c] p-1 rounded-xl border border-[#1b2f21]">
                        <button
                          onClick={() => setViewMode(match.id, 'pitch')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            viewMode === 'pitch'
                              ? 'bg-emerald-500 text-slate-950 shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>Prikaz Terena</span>
                        </button>
                        <button
                          onClick={() => setViewMode(match.id, 'list')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            viewMode === 'list'
                              ? 'bg-emerald-500 text-slate-950 shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <List className="w-3.5 h-3.5" />
                          <span>Popis Sastava</span>
                        </button>
                      </div>
                    )}

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                      className="ml-auto text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5 transition-colors bg-[#14231a] px-3 py-1.5 rounded-xl border border-[#23422e]"
                    >
                      <span>{isExpanded ? 'Sakrij teren i sastave' : 'Prikaži teren i sastave'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* EXPANDED CONTENT: PITCH OR DETAILED ROSTER */}
                  {isExpanded && (
                    <div className="mt-5 pt-4 border-t border-[#1b2f21]">
                      {viewMode === 'pitch' ? (
                        <div className="max-w-2xl mx-auto">
                          <SoccerPitch match={match} onSelectPlayer={onSelectPlayer} />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                          {/* Zeleni team roster (Sorted by goals descending) */}
                          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-4">
                            <div className="font-extrabold text-emerald-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                Sastav Zelenih ({zeleniPlayers.length}):
                              </span>
                              <span>Golovi</span>
                            </div>
                            <div className="space-y-1.5">
                              {zeleniPlayers.length > 0 ? (
                                zeleniPlayers.map((mp) => (
                                  <div
                                    key={mp.player_id}
                                    onClick={() => onSelectPlayer && onSelectPlayer(mp.player_id)}
                                    className={`flex items-center justify-between py-1.5 px-3 rounded-xl bg-[#0d1610] border border-[#1e3425] ${
                                      onSelectPlayer ? 'cursor-pointer hover:bg-[#15241b]' : ''
                                    }`}
                                  >
                                    <span className="text-white font-medium flex items-center gap-1.5">
                                      {mp.player?.name}
                                      {match.mvp_player_id === mp.player_id && (
                                        <span className="text-purple-400 text-xs font-bold" title="MVP Utakmice">
                                          🏆 MVP
                                        </span>
                                      )}
                                    </span>
                                    <span
                                      className={`font-mono font-bold ${
                                        mp.goals > 0 ? 'text-emerald-400 text-sm' : 'text-slate-500 text-xs'
                                      }`}
                                    >
                                      {mp.goals > 0 ? `⚽ ${mp.goals}` : '0'}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-500 italic">Nema zabilježenog sastava</span>
                              )}
                            </div>
                          </div>

                          {/* Sareni team roster (Sorted by goals descending) */}
                          <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-4">
                            <div className="font-extrabold text-amber-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                Sastav Šarenih ({sareniPlayers.length}):
                              </span>
                              <span>Golovi</span>
                            </div>
                            <div className="space-y-1.5">
                              {sareniPlayers.length > 0 ? (
                                sareniPlayers.map((mp) => (
                                  <div
                                    key={mp.player_id}
                                    onClick={() => onSelectPlayer && onSelectPlayer(mp.player_id)}
                                    className={`flex items-center justify-between py-1.5 px-3 rounded-xl bg-[#0d1610] border border-[#1e3425] ${
                                      onSelectPlayer ? 'cursor-pointer hover:bg-[#15241b]' : ''
                                    }`}
                                  >
                                    <span className="text-white font-medium flex items-center gap-1.5">
                                      {mp.player?.name}
                                      {match.mvp_player_id === mp.player_id && (
                                        <span className="text-purple-400 text-xs font-bold" title="MVP Utakmice">
                                          🏆 MVP
                                        </span>
                                      )}
                                    </span>
                                    <span
                                      className={`font-mono font-bold ${
                                        mp.goals > 0 ? 'text-amber-400 text-sm' : 'text-slate-500 text-xs'
                                      }`}
                                    >
                                      {mp.goals > 0 ? `⚽ ${mp.goals}` : '0'}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-500 italic">Nema zabilježenog sastava</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
