import React from 'react';
import { Trophy, Award } from 'lucide-react';
import type { Match, MatchPlayer } from '../types';

interface SoccerPitchProps {
  match: Match;
  onSelectPlayer?: (playerId: string) => void;
  className?: string;
  showTitle?: boolean;
}

export const SoccerPitch: React.FC<SoccerPitchProps> = ({
  match,
  onSelectPlayer,
  className = '',
  showTitle = true,
}) => {
  const zeleniPlayers = match.match_players?.filter((mp) => mp.team === 'zeleni') || [];
  const sareniPlayers = match.match_players?.filter((mp) => mp.team === 'sareni') || [];

  // Sort players for formation: defenders first, attackers last, or by goals
  // For balanced tactical display on pitch, distribute players into lines
  const distributeIntoLines = (players: MatchPlayer[]) => {
    const total = players.length;
    if (total === 0) return [];
    if (total <= 3) return [players];
    if (total === 4) {
      return [players.slice(0, 2), players.slice(2, 4)];
    }
    if (total === 5) {
      // 1 GK/defense, 2 midfield, 2 attack
      return [players.slice(0, 1), players.slice(1, 3), players.slice(3, 5)];
    }
    if (total === 6) {
      return [players.slice(0, 2), players.slice(2, 4), players.slice(4, 6)];
    }
    // 7+
    return [players.slice(0, 2), players.slice(2, 5), players.slice(5)];
  };

  const zeleniLines = distributeIntoLines(zeleniPlayers);
  const sareniLines = distributeIntoLines(sareniPlayers);

  const renderPlayer = (mp: MatchPlayer, team: 'zeleni' | 'sareni') => {
    const isMvp = match.mvp_player_id === mp.player_id;
    const goals = mp.goals || 0;
    const playerName = mp.player?.name || 'Igrač';
    const initial = playerName.charAt(0).toUpperCase();

    return (
      <div
        key={mp.player_id}
        onClick={() => onSelectPlayer && onSelectPlayer(mp.player_id)}
        className={`group flex flex-col items-center transition-all duration-200 ${
          onSelectPlayer ? 'cursor-pointer hover:scale-110 active:scale-95' : ''
        }`}
        title={`${playerName} (${team === 'zeleni' ? 'Zeleni' : 'Šareni'})${
          goals > 0 ? ` • ⚽ ${goals}` : ''
        }${isMvp ? ' • 🏆 MVP' : ''}`}
      >
        {/* Player Avatar / Jersey */}
        <div className="relative">
          {team === 'zeleni' ? (
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-800 border-2 border-white text-white flex items-center justify-center font-black text-sm sm:text-base shadow-lg shadow-black/50 group-hover:ring-2 group-hover:ring-emerald-300">
              {initial}
            </div>
          ) : (
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 border-2 border-white text-slate-950 flex items-center justify-center font-black text-sm sm:text-base shadow-lg shadow-black/50 group-hover:ring-2 group-hover:ring-amber-200">
              {initial}
            </div>
          )}

          {/* Goal Badge */}
          {goals > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-white text-slate-950 text-[10px] sm:text-xs font-black px-1.5 py-0.2 rounded-full border border-black/30 shadow-md flex items-center gap-0.5 leading-tight">
              ⚽<span className="font-mono">{goals}{mp.penalty_goals ? `(${mp.penalty_goals}p)` : ''}</span>
            </span>
          )}

          {/* Own Goal Badge */}
          {(mp.own_goals || 0) > 0 && (
            <span
              className="absolute -top-1.5 -left-2 bg-rose-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full border border-rose-300 shadow-md flex items-center gap-0.5 leading-tight"
              title={`${mp.own_goals} autogol`}
            >
              ⚠️<span className="font-mono">{mp.own_goals}AG</span>
            </span>
          )}

          {/* MVP Badge */}
          {isMvp && (
            <span
              className="absolute -bottom-1 -left-1.5 bg-purple-600 text-yellow-300 text-[10px] p-0.5 rounded-full border border-yellow-300 shadow-md animate-bounce"
              title="Igrač utakmice (MVP)"
            >
              <Award className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Player Name Pill */}
        <div className="mt-1 max-w-[70px] sm:max-w-[85px] truncate">
          <span className="inline-block text-[10px] sm:text-[11px] font-bold text-white bg-black/80 px-2 py-0.5 rounded-full border border-white/20 truncate backdrop-blur-xs shadow">
            {playerName}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-wider">
              Zeleni ({zeleniPlayers.length})
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-400">Taktički prikaz terena</span>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider">
              Šareni ({sareniPlayers.length})
            </span>
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-sm"></span>
          </div>
        </div>
      )}

      {/* FOOTBALL PITCH CONTAINER */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-[#22452e] shadow-2xl bg-[#0e3b1f]">
        
        {/* Realistic grass turf pattern */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0px, rgba(0, 0, 0, 0.12) 28px, transparent 28px, transparent 56px)',
          }}
        />

        {/* Pitch Boundary Chalk Lines */}
        <div className="absolute inset-2.5 sm:inset-3 border-2 border-white/60 rounded-xl pointer-events-none">
          {/* Halfway Line */}
          <div className="absolute top-1/2 left-0 right-0 border-t-2 border-white/60 -translate-y-1/2" />

          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-28 sm:h-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60 pointer-events-none flex items-center justify-center">
            {/* Center Dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
          </div>

          {/* Top Penalty Area (Zeleni Goal) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 sm:w-56 h-16 sm:h-20 border-b-2 border-x-2 border-white/60 rounded-b-lg">
            {/* Penalty spot */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />
          </div>

          {/* Top Goal Box */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-2.5 border-2 border-white/90 bg-white/20 rounded-t" />

          {/* Bottom Penalty Area (Šareni Goal) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 sm:w-56 h-16 sm:h-20 border-t-2 border-x-2 border-white/60 rounded-t-lg">
            {/* Penalty spot */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />
          </div>

          {/* Bottom Goal Box */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-2.5 border-2 border-white/90 bg-white/20 rounded-b" />

          {/* Corner Arcs */}
          <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-white/60 rounded-br-full" />
          <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-white/60 rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-white/60 rounded-tr-full" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-white/60 rounded-tl-full" />
        </div>

        {/* INTERACTIVE PLAYERS LAYER (Vertical 2 Halves) */}
        <div className="relative z-10 py-4 px-4 sm:px-6 flex flex-col justify-between min-h-[440px] sm:min-h-[500px]">
          
          {/* TOP HALF: TEAM ZELENI */}
          <div className="flex-1 flex flex-col justify-around pb-2">
            {/* Team Label at Top Goal */}
            <div className="flex items-center justify-between text-xs font-black text-emerald-300 drop-shadow px-2 pt-0.5">
              <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                ZELENI (Markeri)
              </span>
              <span className="font-mono text-sm sm:text-base font-black bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/50 text-white">
                {match.zeleni_score} golova
              </span>
            </div>

            {/* Zeleni Lines (GK/Def -> Mid -> Att) */}
            <div className="flex-1 flex flex-col justify-evenly py-2 gap-2">
              {zeleniLines.length === 0 ? (
                <div className="text-center text-xs text-white/70 italic py-6">
                  Nema zabilježenog sastava za Zelene
                </div>
              ) : (
                zeleniLines.map((line, lIdx) => (
                  <div key={lIdx} className="flex items-center justify-around w-full">
                    {line.map((mp) => renderPlayer(mp, 'zeleni'))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CENTER DIVIDER INFO: RESULT & STATUS */}
          <div className="relative py-2 my-1 flex items-center justify-center">
            <div className="bg-black/90 backdrop-blur-md px-4 py-1.5 rounded-full border-2 border-white/30 text-white flex items-center gap-3 shadow-2xl z-20">
              <span
                className={`font-mono text-base sm:text-lg font-black ${
                  match.zeleni_score > match.sareni_score ? 'text-emerald-400' : 'text-white'
                }`}
              >
                {match.zeleni_score}
              </span>
              <span className="text-slate-400 font-bold text-xs">:</span>
              <span
                className={`font-mono text-base sm:text-lg font-black ${
                  match.sareni_score > match.zeleni_score ? 'text-amber-400' : 'text-white'
                }`}
              >
                {match.sareni_score}
              </span>
              {match.mvp_player && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 border-l border-white/20 pl-2">
                  <Trophy className="w-3 h-3 text-purple-400" />
                  MVP: {match.mvp_player.name}
                </span>
              )}
            </div>
          </div>

          {/* BOTTOM HALF: TEAM ŠARENI */}
          <div className="flex-1 flex flex-col justify-around pt-2">
            {/* Sareni Lines (Att -> Mid -> Def/GK reversed so forward is close to center) */}
            <div className="flex-1 flex flex-col justify-evenly py-2 gap-2">
              {sareniLines.length === 0 ? (
                <div className="text-center text-xs text-white/70 italic py-6">
                  Nema zabilježenog sastava za Šarene
                </div>
              ) : (
                [...sareniLines].reverse().map((line, lIdx) => (
                  <div key={lIdx} className="flex items-center justify-around w-full">
                    {line.map((mp) => renderPlayer(mp, 'sareni'))}
                  </div>
                ))
              )}
            </div>

            {/* Team Label at Bottom Goal */}
            <div className="flex items-center justify-between text-xs font-black text-amber-300 drop-shadow px-2 pb-0.5">
              <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-amber-500/40">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                ŠARENI (Bez markera)
              </span>
              <span className="font-mono text-sm sm:text-base font-black bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-500/50 text-white">
                {match.sareni_score} golova
              </span>
            </div>
          </div>

        </div>

      </div>

      {onSelectPlayer && (
        <p className="text-[11px] text-slate-400 text-center mt-2">
          💡 Kliknite na igrača za otvaranje njegovog profila i statistike
        </p>
      )}
    </div>
  );
};
