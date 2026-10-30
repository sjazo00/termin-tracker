import React, { useState } from 'react';
import { Trophy, Award, Flame, Search, Medal, Target } from 'lucide-react';
import type { PlayerStats, Season } from '../types';

interface LeaderboardViewProps {
  stats: PlayerStats[];
  seasons: Season[];
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  initialMode?: 'goals' | 'mvp' | 'winrate';
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  stats,
  seasons,
  selectedSeasonId,
  setSelectedSeasonId,
  initialMode = 'goals',
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'mvp' | 'winrate'>(initialMode);
  const [search, setSearch] = useState('');

  // Sorting based on active tab
  const sortedStats = [...stats]
    .filter((s) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.player.name.toLowerCase().includes(q) ||
        (s.player.nickname && s.player.nickname.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (activeTab === 'goals') {
        return b.goals - a.goals || b.goalsPerMatch - a.goalsPerMatch || b.matchesPlayed - a.matchesPlayed;
      }
      if (activeTab === 'mvp') {
        return b.mvpCount - a.mvpCount || b.goals - a.goals || b.winRate - a.winRate;
      }
      // winrate
      return b.winRate - a.winRate || b.wins - a.wins || b.matchesPlayed - a.matchesPlayed;
    });

  // Podium top 3
  const top3 = sortedStats.slice(0, 3);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            {activeTab === 'goals' && <Trophy className="w-7 h-7 text-amber-400" />}
            {activeTab === 'mvp' && <Award className="w-7 h-7 text-purple-400" />}
            {activeTab === 'winrate' && <Flame className="w-7 h-7 text-emerald-400" />}
            <span>
              {activeTab === 'goals'
                ? 'Ljestvica Strijelaca'
                : activeTab === 'mvp'
                ? 'MVP Poredak'
                : 'Pobjednički Omjer'}
            </span>
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Statistika i poredak svih igrača kroz odigrane termine.
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
            <option value="all">Sve sezone (Ukupno)</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.is_current ? '⭐ (Aktivna)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        
        {/* Pill Tabs */}
        <div className="flex items-center p-1 bg-slate-950/70 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'goals'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Strijelci</span>
          </button>

          <button
            onClick={() => setActiveTab('mvp')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'mvp'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>MVP Nagrade</span>
          </button>

          <button
            onClick={() => setActiveTab('winrate')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'winrate'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Win %</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pretraži igrača..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-60 pl-9 pr-3 py-1.5 text-sm bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

      </div>

      {/* TOP 3 PODIUM (Visible on desktop & tablets when at least 3 players exist) */}
      {top3.length >= 3 && !search && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 pb-2 items-end max-w-2xl mx-auto">
          
          {/* 2nd place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center font-bold text-slate-300 text-lg shadow-lg relative">
              <span className="text-xl sm:text-2xl">🥈</span>
            </div>
            <div className="text-center mt-2">
              <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[120px]">
                {top3[1].player.name}
              </div>
            </div>
            <div className="w-full mt-2 bg-gradient-to-t from-slate-900 to-slate-800/90 border border-slate-700/60 rounded-t-xl p-3 text-center h-24 sm:h-28 flex flex-col justify-center">
              <span className="text-lg sm:text-xl font-black text-slate-200 font-mono">
                {activeTab === 'goals'
                  ? `${top3[1].goals} ⚽`
                  : activeTab === 'mvp'
                  ? `${top3[1].mvpCount} 🏆`
                  : `${top3[1].winRate}%`}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">2. Mjesto</span>
            </div>
          </div>

          {/* 1st place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center font-black text-amber-400 text-2xl shadow-xl shadow-amber-500/10 relative -mb-2 z-10">
              <span className="text-2xl sm:text-3xl">🥇</span>
            </div>
            <div className="text-center mt-3">
              <div className="text-sm sm:text-base font-black text-amber-300 truncate max-w-[100px] sm:max-w-[140px]">
                {top3[0].player.name}
              </div>
            </div>
            <div className="w-full mt-2 bg-gradient-to-t from-amber-950/40 via-slate-900 to-slate-800 border-2 border-amber-500/40 rounded-t-2xl p-4 text-center h-32 sm:h-36 flex flex-col justify-center shadow-lg shadow-amber-500/10">
              <span className="text-xl sm:text-3xl font-black text-amber-300 font-mono">
                {activeTab === 'goals'
                  ? `${top3[0].goals} ⚽`
                  : activeTab === 'mvp'
                  ? `${top3[0].mvpCount} 🏆`
                  : `${top3[0].winRate}%`}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-extrabold text-amber-400 tracking-wider mt-1">
                {activeTab === 'goals' ? 'ZLATNA KOPAČKA' : activeTab === 'mvp' ? 'MVP ŠAMPION' : 'VLADAR POBJEDA'}
              </span>
            </div>
          </div>

          {/* 3rd place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-bold text-amber-600 text-lg shadow-lg relative">
              <span className="text-xl sm:text-2xl">🥉</span>
            </div>
            <div className="text-center mt-2">
              <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[120px]">
                {top3[2].player.name}
              </div>
            </div>
            <div className="w-full mt-2 bg-gradient-to-t from-slate-900 to-slate-800/90 border border-slate-700/60 rounded-t-xl p-3 text-center h-20 sm:h-24 flex flex-col justify-center">
              <span className="text-lg sm:text-xl font-black text-amber-600 font-mono">
                {activeTab === 'goals'
                  ? `${top3[2].goals} ⚽`
                  : activeTab === 'mvp'
                  ? `${top3[2].mvpCount} 🏆`
                  : `${top3[2].winRate}%`}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">3. Mjesto</span>
            </div>
          </div>

        </div>
      )}

      {/* FULL LEADERBOARD TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th scope="col" className="px-4 py-3.5 w-12 text-center">#</th>
              <th scope="col" className="px-4 py-3.5">Igrač</th>
              <th scope="col" className="px-4 py-3.5 text-center" title="Odigrane utakmice">OU</th>
              <th scope="col" className="px-4 py-3.5 text-center hidden sm:table-cell" title="Pobjede / Remiji / Porazi">P - N - I</th>
              <th scope="col" className="px-4 py-3.5 text-center font-bold text-emerald-400">Win %</th>
              <th scope="col" className="px-4 py-3.5 text-center font-bold text-amber-400">Golovi</th>
              <th scope="col" className="px-4 py-3.5 text-center hidden md:table-cell">G / U</th>
              <th scope="col" className="px-4 py-3.5 text-center font-bold text-purple-400">MVP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedStats.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Nema pronađenih igrača za odabrane kriterije.
                </td>
              </tr>
            ) : (
              sortedStats.map((stat, idx) => {
                const rank = idx + 1;
                return (
                  <tr
                    key={stat.player.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      rank === 1 ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3.5 text-center">
                      {rank === 1 ? (
                        <span className="text-lg">🥇</span>
                      ) : rank === 2 ? (
                        <span className="text-lg">🥈</span>
                      ) : rank === 3 ? (
                        <span className="text-lg">🥉</span>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">{rank}</span>
                      )}
                    </td>

                    {/* Player Name */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{stat.player.name}</span>
                        {!stat.player.is_active && (
                          <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                            Neaktivan
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Matches Played */}
                    <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-300">
                      {stat.matchesPlayed}
                    </td>

                    {/* W - D - L */}
                    <td className="px-4 py-3.5 text-center hidden sm:table-cell text-xs font-mono text-slate-400">
                      <span className="text-emerald-400 font-bold">{stat.wins}</span>
                      <span> - </span>
                      <span className="text-slate-400">{stat.draws}</span>
                      <span> - </span>
                      <span className="text-rose-400">{stat.losses}</span>
                    </td>

                    {/* Win % */}
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-400">
                      {stat.winRate}%
                    </td>

                    {/* Goals */}
                    <td className="px-4 py-3.5 text-center font-mono font-extrabold text-amber-300 text-base">
                      {stat.goals}
                    </td>

                    {/* Goals per match */}
                    <td className="px-4 py-3.5 text-center hidden md:table-cell font-mono text-xs text-slate-400">
                      {stat.goalsPerMatch}
                    </td>

                    {/* MVP */}
                    <td className="px-4 py-3.5 text-center font-mono font-extrabold text-purple-400">
                      {stat.mvpCount > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-purple-950/60 border border-purple-800/80 px-2 py-0.5 rounded-full text-xs">
                          🏆 {stat.mvpCount}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">0</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
        <span>* <strong>OU</strong>: Odigrane utakmice</span>
        <span>* <strong>P-N-I</strong>: Pobjede - Neriješeno - Izgubljeno</span>
        <span>* <strong>Win %</strong>: Postotak pobjeda</span>
        <span>* <strong>G/U</strong>: Prosjek golova po utakmici</span>
        <span>* <strong>MVP</strong>: Priznanja za igrača utakmice</span>
      </div>
    </div>
  );
};
