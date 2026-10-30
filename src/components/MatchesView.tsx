import React, { useState } from 'react';
import { Calendar, Trash2, Award, ChevronDown, ChevronUp } from 'lucide-react';
import type { Match, Season } from '../types';

interface MatchesViewProps {
  matches: Match[];
  seasons: Season[];
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  onDeleteMatch: (id: string) => void;
  adminPin: string;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  seasons,
  selectedSeasonId,
  setSelectedSeasonId,
  onDeleteMatch,
  adminPin,
}) => {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Season Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-blue-400" />
            <span>Povijest Utakmica</span>
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Arhiva svih odigranih utoraka sa sastavima i strijelcima.
          </p>
        </div>

        {/* Season Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400">Sezona:</label>
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
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
        <div className="text-center p-12 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-white">Nema odigranih utakmica</h4>
          <p className="text-slate-400 text-sm mt-1">
            U odabranoj sezoni još nema zabilježenih rezultata.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const isExpanded = expandedMatchId === match.id;
            const zeleniPlayers = match.match_players?.filter((mp) => mp.team === 'zeleni') || [];
            const sareniPlayers = match.match_players?.filter((mp) => mp.team === 'sareni') || [];

            const isZeleniWinner = match.zeleni_score > match.sareni_score;
            const isSareniWinner = match.sareni_score > match.zeleni_score;

            return (
              <div
                key={match.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all shadow-md"
              >
                {/* Match Header Bar */}
                <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="text-xs sm:text-sm font-bold text-white capitalize">
                      {formatDate(match.date)}
                    </span>
                    {match.season && (
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        {match.season.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {match.mvp_player && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 bg-purple-950/70 border border-purple-800/80 px-2.5 py-1 rounded-full">
                        <Award className="w-3.5 h-3.5 text-purple-400" />
                        MVP: {match.mvp_player.name}
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

                {/* Score Section */}
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-3 items-center text-center">
                    {/* Zeleni */}
                    <div className="text-right sm:text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="hidden sm:inline-block w-3 h-3 rounded-full bg-emerald-500" />
                        <span
                          className={`font-black text-base sm:text-xl tracking-wide ${
                            isZeleniWinner ? 'text-emerald-400' : 'text-slate-300'
                          }`}
                        >
                          ZELENI
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">Markeri</div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center">
                      <div className="text-3xl sm:text-5xl font-mono font-black tracking-tight text-white flex items-center gap-2 sm:gap-3">
                        <span className={isZeleniWinner ? 'text-emerald-400' : 'text-slate-200'}>
                          {match.zeleni_score}
                        </span>
                        <span className="text-slate-600">:</span>
                        <span className={isSareniWinner ? 'text-amber-400' : 'text-slate-200'}>
                          {match.sareni_score}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1">
                        {isZeleniWinner
                          ? 'Pobjeda Zelenih'
                          : isSareniWinner
                          ? 'Pobjeda Šarenih'
                          : 'Neriješeno'}
                      </span>
                    </div>

                    {/* Sareni */}
                    <div className="text-left sm:text-center">
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={`font-black text-base sm:text-xl tracking-wide ${
                            isSareniWinner ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          ŠARENI
                        </span>
                        <span className="hidden sm:inline-block w-3 h-3 rounded-full bg-amber-400" />
                      </div>
                      <div className="text-[11px] text-slate-400">Bez markera</div>
                    </div>
                  </div>

                  {/* Notes */}
                  {match.notes && (
                    <p className="text-center text-xs text-slate-400 italic mt-3">
                      "{match.notes}"
                    </p>
                  )}

                  {/* Toggle details button */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
                    <button
                      onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Sakrij sastave i strijelce' : 'Prikaži sastave i strijelce'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Rosters and Scorers details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm animate-fadeIn">
                      
                      {/* Zeleni team roster */}
                      <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3">
                        <div className="font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Sastav Zelenih:</span>
                          <span>Golovi</span>
                        </div>
                        <div className="space-y-1.5">
                          {zeleniPlayers.length > 0 ? (
                            zeleniPlayers.map((mp) => (
                              <div
                                key={mp.player_id}
                                className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-900/60"
                              >
                                <span className="text-slate-200">
                                  {mp.player?.name} {mp.player?.nickname ? `(${mp.player.nickname})` : ''}
                                  {match.mvp_player_id === mp.player_id && ' 🏆'}
                                </span>
                                <span className="font-bold text-emerald-400">
                                  {mp.goals > 0 ? `⚽ ${mp.goals}` : '—'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">Nema zabilježenog sastava</span>
                          )}
                        </div>
                      </div>

                      {/* Sareni team roster */}
                      <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3">
                        <div className="font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Sastav Šarenih:</span>
                          <span>Golovi</span>
                        </div>
                        <div className="space-y-1.5">
                          {sareniPlayers.length > 0 ? (
                            sareniPlayers.map((mp) => (
                              <div
                                key={mp.player_id}
                                className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-900/60"
                              >
                                <span className="text-slate-200">
                                  {mp.player?.name} {mp.player?.nickname ? `(${mp.player.nickname})` : ''}
                                  {match.mvp_player_id === mp.player_id && ' 🏆'}
                                </span>
                                <span className="font-bold text-amber-400">
                                  {mp.goals > 0 ? `⚽ ${mp.goals}` : '—'}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
