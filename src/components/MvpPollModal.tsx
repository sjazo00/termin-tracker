import React, { useState, useEffect } from 'react';
import type { Match, Player, MvpVote } from '../types';
import { dataService } from '../lib/dataService';
import {
  Award,
  CheckCircle2,
  Lock,
  Trophy,
  Users,
  RotateCcw,
  X,
  Sparkles,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MvpPollModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  initialMatchId?: string;
  adminPin: string;
  onMvpAssigned?: (matchId: string, winnerId: string) => void;
}

export const MvpPollModal: React.FC<MvpPollModalProps> = ({
  isOpen,
  onClose,
  matches,
  initialMatchId,
  adminPin,
  onMvpAssigned,
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    initialMatchId || matches[0]?.id || ''
  );
  const [votes, setVotes] = useState<MvpVote[]>([]);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [selectedVoterId, setSelectedVoterId] = useState<string>('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [submittingVote, setSubmittingVote] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin reset state
  const [showAdminReset, setShowAdminReset] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);

  // Sync selected match if initialMatchId changes or matches load
  useEffect(() => {
    if (initialMatchId && matches.some((m) => m.id === initialMatchId)) {
      setSelectedMatchId(initialMatchId);
    } else if (!selectedMatchId && matches.length > 0) {
      setSelectedMatchId(matches[0].id);
    }
  }, [initialMatchId, matches]);

  const activeMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  // Load votes whenever activeMatch changes
  const loadVotes = async (matchId: string) => {
    if (!matchId) return;
    setLoadingVotes(true);
    try {
      const list = await dataService.getMvpVotes(matchId);
      setVotes(list);
    } catch (err) {
      console.error('Greška pri učitavanju glasova:', err);
    } finally {
      setLoadingVotes(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeMatch?.id) {
      loadVotes(activeMatch.id);
      setSelectedVoterId('');
      setSelectedCandidateId('');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, activeMatch?.id]);

  if (!isOpen || !activeMatch) return null;

  const matchPlayers = activeMatch.match_players || [];
  const totalEligibleVoters = matchPlayers.length || 10;
  const isLocked = votes.length >= totalEligibleVoters && totalEligibleVoters > 0;

  // Determine who already voted
  const votedPlayerIds = new Set(votes.map((v) => v.voter_player_id));

  // Determine team victory for tie breaker
  const zeleniWon = activeMatch.zeleni_score > activeMatch.sareni_score;
  const sareniWon = activeMatch.sareni_score > activeMatch.zeleni_score;

  // Calculate vote counts per candidate
  const candidateScores = matchPlayers.map((mp) => {
    const candidateVotes = votes.filter((v) => v.candidate_player_id === mp.player_id);
    const wonMatch = (mp.team === 'zeleni' && zeleniWon) || (mp.team === 'sareni' && sareniWon);
    return {
      player: mp.player,
      playerId: mp.player_id,
      team: mp.team,
      votesCount: candidateVotes.length,
      goals: mp.goals || 0,
      wonMatch,
      voters: candidateVotes.map((v) => v.voter_player?.name || 'Igrač'),
    };
  });

  // Sort candidates by:
  // 1. Most votes
  // 2. Team victory
  // 3. Goals in match
  candidateScores.sort((a, b) => {
    if (b.votesCount !== a.votesCount) return b.votesCount - a.votesCount;
    if (a.wonMatch !== b.wonMatch) return (b.wonMatch ? 1 : 0) - (a.wonMatch ? 1 : 0);
    return b.goals - a.goals;
  });

  const leadingCandidate = candidateScores.length > 0 ? candidateScores[0] : null;
  const officialMvpPlayer = activeMatch.mvp_player;

  // Submit vote handler
  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedVoterId) {
      setErrorMessage('Molimo odaberite tko ste vi na popisu igrača.');
      return;
    }

    if (!selectedCandidateId) {
      setErrorMessage('Molimo odaberite za koga glasate za MVP-a.');
      return;
    }

    if (selectedVoterId === selectedCandidateId) {
      setErrorMessage('Pravilo ankete: Nije dopušteno glasati za sebe!');
      return;
    }

    if (votedPlayerIds.has(selectedVoterId)) {
      setErrorMessage('Već ste zabilježeni kao glasač za ovu utakmicu.');
      return;
    }

    setSubmittingVote(true);
    try {
      await dataService.addMvpVote(activeMatch.id, selectedVoterId, selectedCandidateId);
      
      // Reload votes to get updated list
      const updatedVotes = await dataService.getMvpVotes(activeMatch.id);
      setVotes(updatedVotes);

      // Check if all players have now voted
      if (updatedVotes.length >= totalEligibleVoters) {
        // Automatic MVP resolution!
        const mvpResult = dataService.calculateMvpWinner(activeMatch, updatedVotes);
        if (mvpResult.winner) {
          await dataService.updateMatchMvp(activeMatch.id, mvpResult.winner.id);
          activeMatch.mvp_player_id = mvpResult.winner.id;
          activeMatch.mvp_player = mvpResult.winner;
          if (onMvpAssigned) {
            onMvpAssigned(activeMatch.id, mvpResult.winner.id);
          }
        }

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
        });

        setSuccessMessage(`🎉 Svih ${totalEligibleVoters} igrača je glasalo! Anketa je zaključana, a MVP je automatski dodijeljen!`);
      } else {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
        const voterObj = matchPlayers.find((p) => p.player_id === selectedVoterId);
        const candObj = matchPlayers.find((p) => p.player_id === selectedCandidateId);
        setSuccessMessage(`✅ Glas uspješno zabilježen: ${voterObj?.player?.name} -> ${candObj?.player?.name}!`);
      }

      // Reset selection
      setSelectedVoterId('');
      setSelectedCandidateId('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Greška pri spremanju glasa.');
    } finally {
      setSubmittingVote(false);
    }
  };

  // Admin reset votes handler
  const handleAdminReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput !== adminPin) {
      setAdminPinError(true);
      return;
    }

    try {
      await dataService.resetMvpVotes(activeMatch.id);
      await dataService.updateMatchMvp(activeMatch.id, null);
      activeMatch.mvp_player_id = null;
      activeMatch.mvp_player = undefined;
      setVotes([]);
      setShowAdminReset(false);
      setAdminPinInput('');
      setAdminPinError(false);
      setSuccessMessage('Glasovi su uspješno resetirani za ovaj termin.');
      if (onMvpAssigned) {
        onMvpAssigned(activeMatch.id, '');
      }
    } catch (err: any) {
      alert('Greška pri resetiranju: ' + err.message);
    }
  };

  const selectedVoterObj = matchPlayers.find((p) => p.player_id === selectedVoterId);
  const selectedCandidateObj = matchPlayers.find((p) => p.player_id === selectedCandidateId);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b120d] border-2 border-[#1e3828] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-[#070b08] border-b border-[#1b2f21] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-md">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">Anketa za MVP-a Utakmice</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/50">
                  Bez Admin Koda
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Svaki igrač glasa za drugog igrača. Transparentno i s automatskim rješavanjem izjednačenja.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* MATCH SELECTOR & MATCH SCOREBOARD */}
          <div className="bg-[#0f1712] border border-[#1e3326] rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>⚽</span> Odabir Utakmice:
              </label>
              
              <div className="relative">
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="bg-[#14231a] border border-[#23422e] rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-emerald-500 appearance-none pr-8 cursor-pointer"
                >
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.date} • Zeleni {m.zeleni_score}:{m.sareni_score} Šareni {m.mvp_player ? `(MVP: ${m.mvp_player.name})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Score pill */}
            <div className="flex items-center justify-between bg-[#080d09] px-4 py-2.5 rounded-xl border border-[#192b1e]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-xs sm:text-sm text-emerald-400">Zeleni</span>
                <span className="font-mono font-black text-white text-base ml-1">
                  {activeMatch.zeleni_score}
                </span>
              </div>
              <span className="text-slate-600 font-mono font-bold">:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-white text-base mr-1">
                  {activeMatch.sareni_score}
                </span>
                <span className="font-bold text-xs sm:text-sm text-amber-400">Šareni</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              </div>
            </div>

            {/* Progress Bar & Status */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  {isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-400">Anketa je zaključana (Popunjeno {votes.length}/{totalEligibleVoters})</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Glasanje u tijeku ({votes.length}/{totalEligibleVoters} igrača glasalo)</span>
                    </>
                  )}
                </span>
                <span className="font-mono font-black text-white">
                  {Math.round((votes.length / Math.max(1, totalEligibleVoters)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-[#16271c] rounded-full h-2.5 overflow-hidden border border-[#23422e]">
                <div
                  className={`h-full transition-all duration-500 ${
                    isLocked ? 'bg-gradient-to-r from-purple-500 to-emerald-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (votes.length / Math.max(1, totalEligibleVoters)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* SUCCESS OR ERROR ALERTS */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* OFFICIAL MVP BANNER (IF ASSIGNED OR LOCKED) */}
          {(officialMvpPlayer || isLocked) && (
            <div className="bg-gradient-to-r from-purple-950/70 via-purple-900/50 to-indigo-950/70 border-2 border-purple-500/60 rounded-3xl p-5 shadow-xl text-center space-y-2">
              <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-purple-500/20 text-yellow-300 mb-1 border border-purple-400/30">
                <Trophy className="w-8 h-8 animate-bounce text-yellow-400" />
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-purple-300">
                Službeni MVP Utakmice
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                {officialMvpPlayer?.name || leadingCandidate?.player?.name}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                <span className="bg-purple-900/80 px-3 py-1 rounded-full font-bold text-purple-200 border border-purple-600/50">
                  🗳️ {leadingCandidate?.votesCount || 0} glasova igrača
                </span>
                {leadingCandidate?.wonMatch && (
                  <span className="bg-emerald-950/80 px-3 py-1 rounded-full font-bold text-emerald-300 border border-emerald-600/50">
                    🏆 Pobjednička ekipa
                  </span>
                )}
                {(leadingCandidate?.goals || 0) > 0 && (
                  <span className="bg-amber-950/80 px-3 py-1 rounded-full font-bold text-amber-300 border border-amber-600/50">
                    ⚽ {leadingCandidate?.goals} golova
                  </span>
                )}
              </div>
            </div>
          )}

          {/* VOTING FORM (ONLY SHOWN IF POLL NOT FULLY LOCKED) */}
          {!isLocked && (
            <form onSubmit={handleVoteSubmit} className="space-y-6">
              
              {/* STEP 1: SELECT VOTER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs flex items-center justify-center font-black">
                      1
                    </span>
                    Tko si ti? (Označi svoje ime)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Samo igrači koji su igrali ovu utakmicu mogu glasati
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {matchPlayers.map((mp) => {
                    const hasVoted = votedPlayerIds.has(mp.player_id);
                    const isSelected = selectedVoterId === mp.player_id;
                    const isZeleni = mp.team === 'zeleni';

                    return (
                      <button
                        key={mp.player_id}
                        type="button"
                        disabled={hasVoted}
                        onClick={() => {
                          setSelectedVoterId(mp.player_id);
                          if (selectedCandidateId === mp.player_id) {
                            setSelectedCandidateId(''); // Can't vote for yourself
                          }
                          setErrorMessage(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          hasVoted
                            ? 'bg-[#101712] border-slate-800 opacity-40 cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/50 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-[#111c14] border-[#1f3827] hover:border-emerald-600/60 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isZeleni ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          {hasVoted ? (
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              Glasao ✓
                            </span>
                          ) : isSelected ? (
                            <span className="text-[9px] font-bold text-emerald-300 uppercase">
                              Odabran
                            </span>
                          ) : null}
                        </div>

                        <div className="font-black text-sm truncate">{mp.player?.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                          {isZeleni ? 'Zeleni' : 'Šareni'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: SELECT CANDIDATE (ENABLED ONCE VOTER IS PICKED) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-500 text-slate-950 text-xs flex items-center justify-center font-black">
                      2
                    </span>
                    Za koga glasaš za MVP-a utakmice?
                  </h4>
                  <span className="text-[11px] text-rose-400 font-bold">
                    * Ne možeš glasati za sebe
                  </span>
                </div>

                {!selectedVoterId ? (
                  <div className="p-6 text-center border border-dashed border-[#23422e] rounded-2xl bg-[#0d1610] text-slate-500 text-xs italic">
                    Prvo odaberite svoje ime u koraku 1 kako bi se omogućio odabir kandidata.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {matchPlayers.map((mp) => {
                      const isVoterHimself = mp.player_id === selectedVoterId;
                      const isSelected = selectedCandidateId === mp.player_id;
                      const isZeleni = mp.team === 'zeleni';

                      return (
                        <button
                          key={mp.player_id}
                          type="button"
                          disabled={isVoterHimself}
                          onClick={() => {
                            setSelectedCandidateId(mp.player_id);
                            setErrorMessage(null);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                            isVoterHimself
                              ? 'bg-rose-950/20 border-rose-900/30 opacity-40 cursor-not-allowed'
                              : isSelected
                              ? 'bg-purple-950/80 border-purple-400 ring-2 ring-purple-400/50 text-white shadow-lg shadow-purple-500/20'
                              : 'bg-[#111c14] border-[#1f3827] hover:border-purple-600/60 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isZeleni ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            />
                            {isVoterHimself ? (
                              <span className="text-[9px] font-bold text-rose-400 uppercase">
                                Ti (Zabranjeno)
                              </span>
                            ) : isSelected ? (
                              <span className="text-[9px] font-bold text-purple-300 uppercase">
                                Tvoj MVP ⭐
                              </span>
                            ) : null}
                          </div>

                          <div className="font-black text-sm truncate">{mp.player?.name}</div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                            <span className="capitalize">{isZeleni ? 'Zeleni' : 'Šareni'}</span>
                            {(mp.goals || 0) > 0 && (
                              <span className="font-mono font-bold text-white">⚽ {mp.goals}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* VOTE SUBMIT BUTTON & SUMMARY */}
              {selectedVoterId && selectedCandidateId && (
                <div className="p-4 rounded-2xl bg-[#121f16] border border-[#23422e] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
                  <div className="text-xs">
                    <span className="text-slate-400">Potvrda glasa: </span>
                    <strong className="text-emerald-400">{selectedVoterObj?.player?.name}</strong>
                    <span className="text-slate-400"> daje svoj glas za MVP-a igraču: </span>
                    <strong className="text-purple-300">{selectedCandidateObj?.player?.name}</strong>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingVote}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{submittingVote ? 'Zapisivanje glasa...' : 'Zabilježi moj glas'}</span>
                  </button>
                </div>
              )}

            </form>
          )}

          {/* CURRENT LEADERBOARD & TRANSPARENCY OF VOTES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#1a2d21]">
            
            {/* Poredak / Rang lista ankete */}
            <div className="bg-[#0f1712] border border-[#1e3326] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1b2f21] pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  Trenutni Poredak Ankete
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  Ukupno glasova: {votes.length}
                </span>
              </div>

              <div className="space-y-2">
                {candidateScores.map((cand, idx) => (
                  <div
                    key={cand.playerId}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      idx === 0 && cand.votesCount > 0
                        ? 'bg-purple-950/40 border-purple-500/40 text-white'
                        : 'bg-[#0d1610] border-[#1e3425] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400 w-4">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-white text-sm">
                        {cand.player?.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          cand.team === 'zeleni'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-amber-950 text-amber-400'
                        }`}
                      >
                        {cand.team === 'zeleni' ? 'Z' : 'Š'}
                      </span>
                      {cand.wonMatch && (
                        <span className="text-[9px] font-bold text-emerald-400" title="Pobjednik utakmice (1. kriterij za izjednačenje)">
                          🏆 Pobjeda
                        </span>
                      )}
                      {cand.goals > 0 && (
                        <span className="text-[10px] font-mono text-slate-300" title="Golovi u utakmici (2. kriterij za izjednačenje)">
                          ⚽ {cand.goals}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-purple-300 bg-purple-950 px-2 py-0.5 rounded-md border border-purple-800/40">
                        {cand.votesCount} {cand.votesCount === 1 ? 'glas' : 'glasa'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-xl bg-[#090e0b] border border-[#182a1d] text-[10px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300">⚖️ Pravila za rješavanje izjednačenja:</div>
                <div>1. Veći broj glasova</div>
                <div>2. Pobjeda ekipe u toj utakmici</div>
                <div>3. Više postignutih golova u toj utakmici</div>
              </div>
            </div>

            {/* Transparentnost: Tko je za koga glasao */}
            <div className="bg-[#0f1712] border border-[#1e3326] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1b2f21] pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Tko je za koga glasao ({votes.length})
                </h4>
                <span className="text-[11px] text-slate-500 italic">Javno i transparentno</span>
              </div>

              {votes.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  Još nema unesenih glasova za ovu utakmicu.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {votes.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-[#0d1610] border border-[#1e3425]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {v.voter_player?.name || 'Igrač'}
                        </span>
                        <span className="text-slate-500">glasao za 👉</span>
                        <span className="font-black text-purple-300">
                          {v.candidate_player?.name || 'Kandidat'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {v.created_at ? new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ADMIN CONTROLS (BEHIND PIN) */}
          <div className="pt-2 border-t border-[#1b2f21]">
            {!showAdminReset ? (
              <button
                type="button"
                onClick={() => setShowAdminReset(true)}
                className="text-[11px] text-slate-500 hover:text-slate-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Admin opcije (Poništi/Resetiraj glasanje s PIN-om)</span>
              </button>
            ) : (
              <form onSubmit={handleAdminReset} className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-rose-300">Admin PIN za reset ankete:</span>
                <input
                  type="password"
                  placeholder="PIN"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  className="bg-[#121c15] border border-rose-800/60 rounded-xl px-3 py-1 text-xs text-white w-24 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Potvrdi Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminReset(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Odustani
                </button>
                {adminPinError && (
                  <span className="text-xs text-rose-400 font-bold">Neispravan PIN!</span>
                )}
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
