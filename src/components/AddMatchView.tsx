import React, { useState } from 'react';
import {
  Calendar,
  PlusCircle,
  Trash2,
  Award,
  Lock,
  Unlock,
  AlertCircle,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Player, Season, Match } from '../types';

interface AddMatchViewProps {
  players: Player[];
  seasons: Season[];
  onAddMatch: (
    matchData: Omit<Match, 'id' | 'created_at' | 'match_players' | 'mvp_player' | 'season'>,
    playersData: Array<{
      player_id: string;
      team: 'zeleni' | 'sareni';
      goals: number;
      penalty_goals?: number;
      own_goals?: number;
    }>
  ) => Promise<void>;
  onAddPlayer: (name: string) => Promise<Player>;
  onMatchSaved: () => void;
  adminPin: string;
}

interface LineupPlayer {
  playerId: string;
  regularGoals: number; // Golovi iz igre
  penaltyGoals: number; // Golovi iz penala
  ownGoals: number; // Autogolovi (pribrajaju se protivničkoj ekipi)
}

export const AddMatchView: React.FC<AddMatchViewProps> = ({
  players,
  seasons,
  onAddMatch,
  onAddPlayer,
  onMatchSaved,
  adminPin,
}) => {
  // Security PIN lock
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Form State
  const activeSeason = seasons.find((s) => s.is_current) || seasons[0];
  const [seasonId, setSeasonId] = useState(activeSeason?.id || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [mvpPlayerId, setMvpPlayerId] = useState('');

  // Lineups with regular goals, penalties, and own goals
  const [zeleniLineup, setZeleniLineup] = useState<LineupPlayer[]>([]);
  const [sareniLineup, setSareniLineup] = useState<LineupPlayer[]>([]);

  // Manual score overrides
  const [manualZeleniScore, setManualZeleniScore] = useState<number | null>(null);
  const [manualSareniScore, setManualSareniScore] = useState<number | null>(null);

  // Quick Add Player
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === adminPin) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Calculate scores:
  // Zeleni score = Zeleni scored (regular + penalty) + Šareni own goals
  const zeleniTeamScored = zeleniLineup.reduce(
    (acc, p) => acc + p.regularGoals + p.penaltyGoals,
    0
  );
  const sareniOwnGoalsToZeleni = sareniLineup.reduce((acc, p) => acc + p.ownGoals, 0);
  const calculatedZeleniScore = zeleniTeamScored + sareniOwnGoalsToZeleni;

  // Šareni score = Šareni scored (regular + penalty) + Zeleni own goals
  const sareniTeamScored = sareniLineup.reduce(
    (acc, p) => acc + p.regularGoals + p.penaltyGoals,
    0
  );
  const zeleniOwnGoalsToSareni = zeleniLineup.reduce((acc, p) => acc + p.ownGoals, 0);
  const calculatedSareniScore = sareniTeamScored + zeleniOwnGoalsToSareni;

  const finalZeleniScore = manualZeleniScore !== null ? manualZeleniScore : calculatedZeleniScore;
  const finalSareniScore = manualSareniScore !== null ? manualSareniScore : calculatedSareniScore;

  // Available players (not yet assigned)
  const assignedPlayerIds = new Set([
    ...zeleniLineup.map((p) => p.playerId),
    ...sareniLineup.map((p) => p.playerId),
  ]);
  const availablePlayers = players.filter(
    (p) => p.is_active && !assignedPlayerIds.has(p.id)
  );

  const assignPlayer = (playerId: string, team: 'zeleni' | 'sareni') => {
    const newItem: LineupPlayer = {
      playerId,
      regularGoals: 0,
      penaltyGoals: 0,
      ownGoals: 0,
    };
    if (team === 'zeleni') {
      setZeleniLineup((prev) => [...prev, newItem]);
    } else {
      setSareniLineup((prev) => [...prev, newItem]);
    }
  };

  const removePlayer = (playerId: string, team: 'zeleni' | 'sareni') => {
    if (team === 'zeleni') {
      setZeleniLineup((prev) => prev.filter((p) => p.playerId !== playerId));
    } else {
      setSareniLineup((prev) => prev.filter((p) => p.playerId !== playerId));
    }
    if (mvpPlayerId === playerId) {
      setMvpPlayerId('');
    }
  };

  const updateRegularGoals = (playerId: string, team: 'zeleni' | 'sareni', delta: number) => {
    const updater = (list: LineupPlayer[]) =>
      list.map((p) =>
        p.playerId === playerId
          ? { ...p, regularGoals: Math.max(0, p.regularGoals + delta) }
          : p
      );
    if (team === 'zeleni') setZeleniLineup(updater);
    else setSareniLineup(updater);
  };

  const updatePenaltyGoals = (playerId: string, team: 'zeleni' | 'sareni', delta: number) => {
    const updater = (list: LineupPlayer[]) =>
      list.map((p) =>
        p.playerId === playerId
          ? { ...p, penaltyGoals: Math.max(0, p.penaltyGoals + delta) }
          : p
      );
    if (team === 'zeleni') setZeleniLineup(updater);
    else setSareniLineup(updater);
  };

  const updateOwnGoals = (playerId: string, team: 'zeleni' | 'sareni', delta: number) => {
    const updater = (list: LineupPlayer[]) =>
      list.map((p) =>
        p.playerId === playerId
          ? { ...p, ownGoals: Math.max(0, p.ownGoals + delta) }
          : p
      );
    if (team === 'zeleni') setZeleniLineup(updater);
    else setSareniLineup(updater);
  };

  const handleQuickAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    try {
      await onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
      setIsAddingPlayer(false);
    } catch (err: any) {
      alert('Greška pri dodavanju igrača: ' + (err.message || 'Igrač možda već postoji.'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (zeleniLineup.length === 0 || sareniLineup.length === 0) {
      alert('Morate odabrati barem jednog igrača za svaku ekipu!');
      return;
    }

    if (!seasonId) {
      alert('Molimo odaberite sezonu!');
      return;
    }

    setIsSubmitting(true);

    try {
      const matchData = {
        season_id: seasonId,
        date,
        zeleni_score: finalZeleniScore,
        sareni_score: finalSareniScore,
        mvp_player_id: mvpPlayerId || null,
        notes: notes.trim() || null,
      };

      const playersData: Array<{
        player_id: string;
        team: 'zeleni' | 'sareni';
        goals: number;
        penalty_goals: number;
        own_goals: number;
      }> = [
        ...zeleniLineup.map((p) => ({
          player_id: p.playerId,
          team: 'zeleni' as const,
          goals: p.regularGoals + p.penaltyGoals,
          penalty_goals: p.penaltyGoals,
          own_goals: p.ownGoals,
        })),
        ...sareniLineup.map((p) => ({
          player_id: p.playerId,
          team: 'sareni' as const,
          goals: p.regularGoals + p.penaltyGoals,
          penalty_goals: p.penaltyGoals,
          own_goals: p.ownGoals,
        })),
      ];

      await onAddMatch(matchData, playersData);

      // Trigger Confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      alert('⚽ Utakmica je uspješno spremljena!');
      onMatchSaved();
    } catch (err: any) {
      console.error(err);
      alert('Greška pri spremanju utakmice: ' + (err.message || 'Provjerite vezu s bazom.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // PIN Unlock screen
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-[#0f1712] border-2 border-[#1e3828] rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>

          <h3 className="text-xl font-black text-white">Unos Utakmice je Zaštićen</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            Unesite administratorski PIN kako biste unijeli rezultat i strijelce.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Unesite PIN (Zadano: 1234)"
                className="w-full text-center text-2xl tracking-widest font-mono py-3 px-4 bg-[#14231a] border border-[#23422e] rounded-xl text-white focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              {pinError && (
                <p className="text-rose-400 text-xs mt-2 flex items-center justify-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> Pogrešan PIN kod! Pokušajte ponovo.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Otključaj Unos</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-500 mt-6">
            * Zadana šifra je <strong>1234</strong>. Šifru možete promijeniti u postavkama.
          </p>
        </div>
      </div>
    );
  }

  // All players in match
  const allMatchPlayerIds = [...zeleniLineup.map((p) => p.playerId), ...sareniLineup.map((p) => p.playerId)];
  const allMatchPlayers = players.filter((p) => allMatchPlayerIds.includes(p.id));

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-[#0f1712] p-5 rounded-3xl border border-[#1e3326] shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-emerald-400" />
            <span>Unos Rezultata Utakmice</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Odaberite igrače po timovima, zabilježite golove i proglasite MVP-a susreta.
          </p>
        </div>

        <button
          onClick={() => setIsUnlocked(false)}
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-[#16271c] px-3.5 py-1.5 rounded-xl border border-[#25422e]"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Zaključaj</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Match Info: Date & Season */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0f1712] p-5 rounded-3xl border border-[#1e3326] shadow-xl">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Datum termina:
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#14231a] border border-[#23422e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Sezona:
            </label>
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              required
              className="w-full bg-[#14231a] border border-[#23422e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_current ? '⭐ (Aktivna)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Available Players Pool */}
        <div className="bg-[#0f1712] p-5 rounded-3xl border border-[#1e3326] shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Dostupni igrači ({availablePlayers.length})
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingPlayer(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Dodaj novog igrača</span>
            </button>
          </div>

          {availablePlayers.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              Svi aktivni igrači su već raspoređeni u timove.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availablePlayers.map((player) => (
                <div
                  key={player.id}
                  className="bg-[#14231a] border border-[#23422e] rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-white shadow-sm"
                >
                  <span className="font-bold">{player.name}</span>
                  
                  <div className="flex items-center gap-1 ml-1 border-l border-[#264431] pl-2">
                    <button
                      type="button"
                      onClick={() => assignPlayer(player.id, 'zeleni')}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-black transition-colors"
                      title="Dodaj u Zelene"
                    >
                      + Zeleni
                    </button>
                    <button
                      type="button"
                      onClick={() => assignPlayer(player.id, 'sareni')}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-black transition-colors"
                      title="Dodaj u Šarene"
                    >
                      + Šareni
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add Player Inline */}
        {isAddingPlayer && (
          <div className="p-4 bg-[#14231a] rounded-2xl border border-emerald-500/40 flex flex-col sm:flex-row items-center gap-3 animate-fadeIn">
            <input
              type="text"
              placeholder="Ime igrača (npr. Mario)..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="flex-1 bg-[#0f1712] border border-[#264431] rounded-xl px-3.5 py-2 text-sm text-white"
              autoFocus
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleQuickAddPlayer}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-colors"
              >
                Spremi
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPlayer(false)}
                className="px-3 py-2 text-slate-400 hover:text-white text-xs"
              >
                Odustani
              </button>
            </div>
          </div>
        )}

        {/* LIVE SCOREBOARD */}
        <div className="bg-[#090e0b] border-2 border-[#1e3828] rounded-3xl p-6 text-center shadow-2xl">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
            Automatski Rezultat (Iz zbroja golova)
          </div>
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block shadow" />
              <span className="font-black text-lg sm:text-2xl text-emerald-400">ZELENI</span>
              <span className="text-4xl sm:text-6xl font-mono font-black text-white ml-2">
                {finalZeleniScore}
              </span>
            </div>

            <span className="text-3xl sm:text-4xl text-slate-600 font-mono">:</span>

            <div className="flex items-center gap-3">
              <span className="text-4xl sm:text-6xl font-mono font-black text-white mr-2">
                {finalSareniScore}
              </span>
              <span className="font-black text-lg sm:text-2xl text-amber-400">ŠARENI</span>
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block shadow" />
            </div>

          </div>
        </div>

        {/* TWO COLUMNS: TEAM ZELENI & TEAM ŠARENI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ZELENI TEAM COLUMN */}
          <div className="bg-emerald-950/20 border-2 border-emerald-800/40 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/30">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 className="font-black text-lg text-emerald-400">Zeleni ({zeleniLineup.length})</h3>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-black text-emerald-300">
                  Ukupno: {calculatedZeleniScore} {calculatedZeleniScore === 1 ? 'gol' : 'golova'}
                </span>
                {sareniOwnGoalsToZeleni > 0 && (
                  <div className="text-[10px] text-emerald-400 font-bold">
                    ({zeleniTeamScored} dali + {sareniOwnGoalsToZeleni} autogol Šarenih)
                  </div>
                )}
              </div>
            </div>

            {zeleniLineup.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                Dodajte igrače iz gornjeg popisa dostupnih igrača.
              </p>
            ) : (
              <div className="space-y-3">
                {zeleniLineup.map((item) => {
                  const p = players.find((x) => x.id === item.playerId);
                  if (!p) return null;
                  const totalPlayerGoals = item.regularGoals + item.penaltyGoals;

                  return (
                    <div
                      key={item.playerId}
                      className="bg-[#0d1610] border border-[#1e3425] rounded-2xl p-3 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{p.name}</span>
                          {totalPlayerGoals > 0 && (
                            <span className="text-[11px] font-mono font-bold bg-emerald-950/90 border border-emerald-600/60 text-emerald-300 px-2 py-0.5 rounded-md">
                              ⚽ {totalPlayerGoals} {item.penaltyGoals > 0 ? `(${item.penaltyGoals}p)` : ''}
                            </span>
                          )}
                          {item.ownGoals > 0 && (
                            <span
                              className="text-[11px] font-mono font-bold bg-rose-950/90 border border-rose-600/60 text-rose-300 px-2 py-0.5 rounded-md"
                              title="Autogol pribrojen Šarenima"
                            >
                              ⚠️ {item.ownGoals} AG (za Šarene)
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removePlayer(item.playerId, 'zeleni')}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                          title="Ukloni iz ekipe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 3 Goal Counters: Gol iz igre, Penal, Autogol */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#192b1f]">
                        {/* Gol iz igre */}
                        <div className="bg-[#121c15] border border-[#213b29] rounded-xl p-1.5 flex flex-col items-center">
                          <span className="text-[10px] text-slate-300 font-bold mb-1">
                            ⚽ Iz igre
                          </span>
                          <div className="flex items-center justify-between w-full px-1">
                            <button
                              type="button"
                              onClick={() => updateRegularGoals(item.playerId, 'zeleni', -1)}
                              className="w-6 h-6 rounded bg-[#1c3123] text-slate-300 hover:text-white font-black flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-black text-white text-sm">
                              {item.regularGoals}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateRegularGoals(item.playerId, 'zeleni', 1)}
                              className="w-6 h-6 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Iz penala */}
                        <div className="bg-[#121c15] border border-[#213b29] rounded-xl p-1.5 flex flex-col items-center">
                          <span className="text-[10px] text-amber-300 font-bold mb-1">
                            🎯 Penal
                          </span>
                          <div className="flex items-center justify-between w-full px-1">
                            <button
                              type="button"
                              onClick={() => updatePenaltyGoals(item.playerId, 'zeleni', -1)}
                              className="w-6 h-6 rounded bg-[#1c3123] text-slate-300 hover:text-white font-black flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-black text-amber-300 text-sm">
                              {item.penaltyGoals}
                            </span>
                            <button
                              type="button"
                              onClick={() => updatePenaltyGoals(item.playerId, 'zeleni', 1)}
                              className="w-6 h-6 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Autogol (za Šarene) */}
                        <div className="bg-[#181112] border border-rose-900/60 rounded-xl p-1.5 flex flex-col items-center">
                          <span
                            className="text-[10px] text-rose-300 font-bold mb-1"
                            title="Autogol se dodaje ekipi Šareni"
                          >
                            ⚠️ Autogol
                          </span>
                          <div className="flex items-center justify-between w-full px-1">
                            <button
                              type="button"
                              onClick={() => updateOwnGoals(item.playerId, 'zeleni', -1)}
                              className="w-6 h-6 rounded bg-[#2b181a] text-slate-300 hover:text-white font-black flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-black text-rose-400 text-sm">
                              {item.ownGoals}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateOwnGoals(item.playerId, 'zeleni', 1)}
                              className="w-6 h-6 rounded bg-rose-600 hover:bg-rose-500 text-white font-black flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ŠARENI TEAM COLUMN */}
          <div className="bg-amber-950/20 border-2 border-amber-800/40 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-amber-800/30">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <h3 className="font-black text-lg text-amber-400">Šareni ({sareniLineup.length})</h3>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-black text-amber-300">
                  Ukupno: {calculatedSareniScore} {calculatedSareniScore === 1 ? 'gol' : 'golova'}
                </span>
                {zeleniOwnGoalsToSareni > 0 && (
                  <div className="text-[10px] text-amber-400 font-bold">
                    ({sareniTeamScored} dali + {zeleniOwnGoalsToSareni} autogol Zelenih)
                  </div>
                )}
              </div>
            </div>

            {sareniLineup.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                Dodajte igrače iz gornjeg popisa dostupnih igrača.
              </p>
            ) : (
              <div className="space-y-3">
                {sareniLineup.map((item) => {
                  const p = players.find((x) => x.id === item.playerId);
                  if (!p) return null;
                  const totalPlayerGoals = item.regularGoals + item.penaltyGoals;

                  return (
                    <div
                      key={item.playerId}
                      className="bg-[#0d1610] border border-[#1e3425] rounded-2xl p-3 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{p.name}</span>
                          {totalPlayerGoals > 0 && (
                            <span className="text-[11px] font-mono font-bold bg-amber-950/90 border border-amber-600/60 text-amber-300 px-2 py-0.5 rounded-md">
                              ⚽ {totalPlayerGoals} {item.penaltyGoals > 0 ? `(${item.penaltyGoals}p)` : ''}
                            </span>
                          )}
                          {item.ownGoals > 0 && (
                            <span
                              className="text-[11px] font-mono font-bold bg-rose-950/90 border border-rose-600/60 text-rose-300 px-2 py-0.5 rounded-md"
                              title="Autogol pribrojen Zelenima"
                            >
                              ⚠️ {item.ownGoals} AG (za Zelene)
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removePlayer(item.playerId, 'sareni')}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                          title="Ukloni iz ekipe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 3 Goal Counters: Gol iz igre, Penal, Autogol */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#192b1f]">
                        {/* Gol iz igre */}
                        <div className="bg-[#121c15] border border-[#213b29] rounded-xl p-1.5 flex flex-col items-center">
                          <span className="text-[10px] text-slate-300 font-bold mb-1">
                            ⚽ Iz igre
                          </span>
                          <div className="flex items-center justify-between w-full px-1">
                            <button
                              type="button"
                              onClick={() => updateRegularGoals(item.playerId, 'sareni', -1)}
                              className="w-6 h-6 rounded bg-[#1c3123] text-slate-300 hover:text-white font-black flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-black text-white text-sm">
                              {item.regularGoals}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateRegularGoals(item.playerId, 'sareni', 1)}
                              className="w-6 h-6 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Iz penala */}
                        <div className="bg-[#121c15] border border-[#213b29] rounded-xl p-1.5 flex flex-col items-center">
                          <span className="text-[10px] text-amber-300 font-bold mb-1">
                            🎯 Penal
                          </span>
                          <div className="flex items-center justify-between w-full px-1">
                            <button
                              type="button"
                              onClick={() => updatePenaltyGoals(item.playerId, 'sareni', -1)}
                              className="w-6 h-6 rounded bg-[#1c3123] text-slate-300 hover:text-white font-black flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-black text-amber-300 text-sm">
                              {item.penaltyGoals}
                            </span>
                            <button
                              type="button"
                              onClick={() => updatePenaltyGoals(item.playerId, 'sareni', 1)}
                              className="w-6 h-6 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Autogol (za Zelene) */}
                        <div className="bg-[#181112] border border-rose-900/60 rounded-xl p-1.5 flex flex-col items-center">
                          <span
                            className="text-[10px] text-rose-300 font-bold mb-1"
                            title="Autogol se dodaje ekipi Zeleni"
                          >
                            ⚠️ Autogol
                          </span>
                          <div className="flex items-center justify-between w-full px-1">
                            <button
                              type="button"
                              onClick={() => updateOwnGoals(item.playerId, 'sareni', -1)}
                              className="w-6 h-6 rounded bg-[#2b181a] text-slate-300 hover:text-white font-black flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-black text-rose-400 text-sm">
                              {item.ownGoals}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateOwnGoals(item.playerId, 'sareni', 1)}
                              className="w-6 h-6 rounded bg-rose-600 hover:bg-rose-500 text-white font-black flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* MVP SELECTION & NOTES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0f1712] p-5 rounded-3xl border border-[#1e3326] shadow-xl">
          
          {/* MVP Selector */}
          <div>
            <label className="block text-xs font-black text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-400" />
              MVP Utakmice (Igrač susreta):
            </label>
            <select
              value={mvpPlayerId}
              onChange={(e) => setMvpPlayerId(e.target.value)}
              className="w-full bg-[#14231a] border border-[#23422e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">🗳️ Odredi putem MVP ankete (Nakon termina)</option>
              {allMatchPlayers.map((p) => {
                const isZ = zeleniLineup.some((z) => z.playerId === p.id);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} [{isZ ? 'Zeleni' : 'Šareni'}]
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Možete ostaviti prazno i dopustiti igračima da glasaju u MVP Anketi bez administratorskog koda.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Bilješke / Komentar (Opcionalno):
            </label>
            <input
              type="text"
              placeholder="npr. Vrhunski termin, gol škaricama u 50. minuti..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#14231a] border border-[#23422e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-base sm:text-lg rounded-2xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isSubmitting ? 'Spremanje u bazu...' : 'Spremi Utakmicu'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
