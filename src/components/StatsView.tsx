import React, { useState } from 'react';
import { Trophy, Award, Flame, Search, Table, ArrowUpDown, ChevronRight } from 'lucide-react';
import type { PlayerStats, Season } from '../types';

interface StatsViewProps {
  stats: PlayerStats[];
  seasons: Season[];
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  initialMode?: 'goals' | 'mvp' | 'winrate' | 'all';
  onSelectPlayer?: (playerId: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  stats,
  seasons,
  selectedSeasonId,
  setSelectedSeasonId,
  initialMode = 'goals',
  onSelectPlayer,
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'mvp' | 'winrate' | 'all'>(initialMode);
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
      if (activeTab === 'winrate') {
        return b.winRate - a.winRate || b.wins - a.wins || b.matchesPlayed - a.matchesPlayed;
      }
      // 'all' - sort by goals then mvp then winrate
      return b.goals - a.goals || b.mvpCount - a.mvpCount || b.winRate - a.winRate;
    });

  // Podium top 3
  const top3 = sortedStats.slice(0, 3);

  return (
    <div className="space-y-6 pb-14">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-7 h-7 text-emerald-400" />
            <span>Statistika & Poredak</span>
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Sveobuhvatne ljestvice strijelaca, MVP titula i pobjedničkog omjera kroz sve odigrane termine.
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

      {/* SUB-TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f1712] p-2 rounded-2xl border border-[#1e3326] shadow-xl">
        
        {/* Sub-tabs buttons */}
        <div className="flex items-center p-1 bg-[#090e0b] rounded-xl border border-[#1a2d21] overflow-x-auto">
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'goals'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Strijelci</span>
          </button>

          <button
            onClick={() => setActiveTab('mvp')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'mvp'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>MVP Ljestvica</span>
          </button>

          <button
            onClick={() => setActiveTab('winrate')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'winrate'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Win %</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Sveobuhvatno</span>
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
            className="w-full sm:w-60 pl-9 pr-3 py-1.5 text-sm bg-[#16221b] border border-[#264431] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

      </div>

      {/* TOP 3 PODIUM (Visible on top tabs when at least 3 players exist) */}
      {top3.length >= 3 && !search && activeTab !== 'all' && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 pb-2 items-end max-w-2xl mx-auto">
          
          {/* 2nd place */}
          <div
            onClick={() => onSelectPlayer && onSelectPlayer(top3[1].player.id)}
            className={`flex flex-col items-center ${onSelectPlayer ? 'cursor-pointer group' : ''}`}
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#15241b] border-2 border-slate-300 flex items-center justify-center font-bold text-slate-200 text-lg shadow-lg relative group-hover:scale-105 transition-transform">
              <span className="text-xl sm:text-2xl">🥈</span>
            </div>
            <div className="text-center mt-2">
              <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[120px] group-hover:text-emerald-400 transition-colors">
                {top3[1].player.name}
              </div>
            </div>
            <div className="w-full mt-2 bg-gradient-to-t from-[#0d1610] to-[#16251c] border border-[#264431] rounded-t-2xl p-3 text-center h-24 sm:h-28 flex flex-col justify-center">
              <span className="text-lg sm:text-xl font-black text-white font-mono">
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
          <div
            onClick={() => onSelectPlayer && onSelectPlayer(top3[0].player.id)}
            className={`flex flex-col items-center ${onSelectPlayer ? 'cursor-pointer group' : ''}`}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-black text-emerald-400 text-2xl shadow-xl shadow-emerald-500/20 relative -mb-2 z-10 group-hover:scale-110 transition-transform">
              <span className="text-2xl sm:text-3xl">🥇</span>
            </div>
            <div className="text-center mt-3">
              <div className="text-sm sm:text-base font-black text-white truncate max-w-[100px] sm:max-w-[140px] group-hover:text-emerald-400 transition-colors">
                {top3[0].player.name}
              </div>
            </div>
            <div className="w-full mt-2 bg-gradient-to-t from-emerald-950/40 via-[#132318] to-[#1c3324] border-2 border-emerald-500/50 rounded-t-2xl p-4 text-center h-32 sm:h-36 flex flex-col justify-center shadow-lg shadow-emerald-500/10">
              <span className="text-xl sm:text-3xl font-black text-emerald-400 font-mono">
                {activeTab === 'goals'
                  ? `${top3[0].goals} ⚽`
                  : activeTab === 'mvp'
                  ? `${top3[0].mvpCount} 🏆`
                  : `${top3[0].winRate}%`}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-black text-white tracking-wider mt-1">
                {activeTab === 'goals' ? 'ZLATNA KOPAČKA' : activeTab === 'mvp' ? 'MVP ŠAMPION' : 'VLADAR POBJEDA'}
              </span>
            </div>
          </div>

          {/* 3rd place */}
          <div
            onClick={() => onSelectPlayer && onSelectPlayer(top3[2].player.id)}
            className={`flex flex-col items-center ${onSelectPlayer ? 'cursor-pointer group' : ''}`}
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#15241b] border-2 border-amber-600 flex items-center justify-center font-bold text-amber-500 text-lg shadow-lg relative group-hover:scale-105 transition-transform">
              <span className="text-xl sm:text-2xl">🥉</span>
            </div>
            <div className="text-center mt-2">
              <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[120px] group-hover:text-emerald-400 transition-colors">
                {top3[2].player.name}
              </div>
            </div>
            <div className="w-full mt-2 bg-gradient-to-t from-[#0d1610] to-[#16251c] border border-[#264431] rounded-t-2xl p-3 text-center h-20 sm:h-24 flex flex-col justify-center">
              <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">
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

      {/* FULL LEADERBOARD TABLE (High contrast football aesthetic: green, black, white) */}
      <div className="overflow-x-auto rounded-2xl border border-[#1e3326] bg-[#0f1712] shadow-2xl">
        <table className="w-full text-left text-sm text-slate-200">
          <thead className="bg-[#090e0b] text-xs uppercase tracking-wider text-slate-400 border-b border-[#1b2f21]">
            <tr>
              <th scope="col" className="px-4 py-3.5 w-12 text-center">#</th>
              <th scope="col" className="px-4 py-3.5">Igrač</th>
              <th scope="col" className="px-4 py-3.5 text-center" title="Odigrane utakmice">OU</th>
              <th scope="col" className="px-4 py-3.5 text-center hidden sm:table-cell" title="Pobjede - Neriješeno - Izgubljeno">P - N - I</th>
              <th scope="col" className="px-4 py-3.5 text-center font-bold text-emerald-400">Win %</th>
              <th scope="col" className="px-4 py-3.5 text-center font-black text-white">Golovi</th>
              <th scope="col" className="px-4 py-3.5 text-center hidden md:table-cell">G / U</th>
              <th scope="col" className="px-4 py-3.5 text-center font-bold text-purple-400">MVP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#18291d]">
            {sortedStats.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Nema pronađenih igrača za odabrane kriterije.
                </td>
              </tr>
            ) : (
              sortedStats.map((stat, idx) => {
                const rank = idx + 1;
                return (
                  <tr
                    key={stat.player.id}
                    onClick={() => onSelectPlayer && onSelectPlayer(stat.player.id)}
                    className={`hover:bg-[#15241b] transition-colors ${
                      onSelectPlayer ? 'cursor-pointer' : ''
                    } ${rank === 1 ? 'bg-emerald-950/20' : ''}`}
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
                        <span className="text-xs font-bold text-slate-400 font-mono">{rank}</span>
                      )}
                    </td>

                    {/* Player Name */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{stat.player.name}</span>
                        {!stat.player.is_active && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
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
                    <td className="px-4 py-3.5 text-center hidden sm:table-cell text-xs font-mono text-slate-300">
                      <span className="text-emerald-400 font-bold">{stat.wins}</span>
                      <span> - </span>
                      <span className="text-slate-300">{stat.draws}</span>
                      <span> - </span>
                      <span className="text-rose-400">{stat.losses}</span>
                    </td>

                    {/* Win % */}
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-400">
                      {stat.winRate}%
                    </td>

                    {/* Goals */}
                    <td className="px-4 py-3.5 text-center font-mono font-black text-white text-base">
                      ⚽ {stat.goals}
                    </td>

                    {/* Goals per match */}
                    <td className="px-4 py-3.5 text-center hidden md:table-cell font-mono text-xs text-slate-300">
                      {stat.goalsPerMatch}
                    </td>

                    {/* MVP */}
                    <td className="px-4 py-3.5 text-center font-mono font-extrabold text-purple-300">
                      {stat.mvpCount > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-purple-950/60 border border-purple-800/80 px-2 py-0.5 rounded-full text-xs">
                          🏆 {stat.mvpCount}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">0</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-400 flex flex-wrap gap-4 pt-1">
        <span>* <strong>OU</strong>: Odigrane utakmice</span>
        <span>* <strong>P-N-I</strong>: Pobjede - Neriješeno - Porazi</span>
        <span>* <strong>Win %</strong>: Postotak pobjeda</span>
        <span>* <strong>G/U</strong>: Prosjek golova po utakmici</span>
        <span>* <strong>MVP</strong>: Igrač utakmice</span>
      </div>
    </div>
  );
};
