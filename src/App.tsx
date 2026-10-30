import { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { LeaderboardView } from './components/LeaderboardView';
import { MatchesView } from './components/MatchesView';
import { AddMatchView } from './components/AddMatchView';
import { PlayersModal } from './components/PlayersModal';
import { SettingsModal } from './components/SettingsModal';
import { dataService } from './lib/dataService';
import type { Player, Season, Match } from './types';
import { Loader2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leaderboard' | 'mvp' | 'matches' | 'add-match'>('dashboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Admin PIN (persisted in localStorage, default '1234')
  const [adminPin, setAdminPin] = useState(() => {
    return localStorage.getItem('termin_admin_pin') || '1234';
  });

  const isSupabaseConnected = dataService.isSupabaseConnected();

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedSeasons, fetchedPlayers, fetchedMatches] = await Promise.all([
        dataService.getSeasons(),
        dataService.getPlayers(),
        dataService.getMatches(),
      ]);

      setSeasons(fetchedSeasons);
      setPlayers(fetchedPlayers);
      setMatches(fetchedMatches);

      // Default selected season to current active season if available
      const activeSeason = fetchedSeasons.find((s) => s.is_current);
      if (activeSeason && selectedSeasonId === 'all') {
        setSelectedSeasonId(activeSeason.id);
      }
    } catch (err) {
      console.error('Greška pri učitavanju podataka:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats dynamically
  const stats = useMemo(() => {
    return dataService.calculateStats(players, matches, selectedSeasonId);
  }, [players, matches, selectedSeasonId]);

  // Handlers
  const handleAddPlayer = async (name: string, nickname?: string) => {
    const newPlayer = await dataService.addPlayer(name, nickname);
    setPlayers((prev) => [...prev, newPlayer]);
    return newPlayer;
  };

  const handleUpdatePlayer = async (id: string, updates: Partial<Player>) => {
    await dataService.updatePlayer(id, updates);
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleAddSeason = async (name: string, isCurrent: boolean) => {
    const newSeason = await dataService.addSeason(name, isCurrent);
    setSeasons((prev) => {
      let updated = isCurrent ? prev.map((s) => ({ ...s, is_current: false })) : [...prev];
      return [newSeason, ...updated];
    });
    if (isCurrent) {
      setSelectedSeasonId(newSeason.id);
    }
    return newSeason;
  };

  const handleAddMatch = async (
    matchData: Omit<Match, 'id' | 'created_at' | 'match_players' | 'mvp_player' | 'season'>,
    playersData: Array<{ player_id: string; team: 'zeleni' | 'sareni'; goals: number }>
  ) => {
    await dataService.addMatch(matchData, playersData);
    await loadData();
  };

  const handleDeleteMatch = async (id: string) => {
    await dataService.deleteMatch(id);
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };

  // Find latest match
  const latestMatch = matches.length > 0 ? matches[0] : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenPlayers={() => setIsPlayersModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-slate-400 text-sm">Učitavanje podataka termina...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                latestMatch={latestMatch}
                stats={stats}
                seasons={seasons}
                selectedSeasonId={selectedSeasonId}
                setSelectedSeasonId={setSelectedSeasonId}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                isSupabaseConnected={isSupabaseConnected}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardView
                stats={stats}
                seasons={seasons}
                selectedSeasonId={selectedSeasonId}
                setSelectedSeasonId={setSelectedSeasonId}
                initialMode="goals"
              />
            )}

            {activeTab === 'mvp' && (
              <LeaderboardView
                stats={stats}
                seasons={seasons}
                selectedSeasonId={selectedSeasonId}
                setSelectedSeasonId={setSelectedSeasonId}
                initialMode="mvp"
              />
            )}

            {activeTab === 'matches' && (
              <MatchesView
                matches={matches}
                seasons={seasons}
                selectedSeasonId={selectedSeasonId}
                setSelectedSeasonId={setSelectedSeasonId}
                onDeleteMatch={handleDeleteMatch}
                adminPin={adminPin}
              />
            )}

            {activeTab === 'add-match' && (
              <AddMatchView
                players={players}
                seasons={seasons}
                onAddMatch={handleAddMatch}
                onAddPlayer={handleAddPlayer}
                onMatchSaved={() => setActiveTab('dashboard')}
                adminPin={adminPin}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>⚽ Termin 5 na 5 • Zeleni vs Šareni</span>
            <span>•</span>
            <span>Utorak termin</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Postavke Baze & PIN
            </button>
            <button
              onClick={() => setIsPlayersModalOpen(true)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Popis Igrača
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PlayersModal
        isOpen={isPlayersModalOpen}
        onClose={() => setIsPlayersModalOpen(false)}
        players={players}
        onAddPlayer={handleAddPlayer}
        onUpdatePlayer={handleUpdatePlayer}
        adminPin={adminPin}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isSupabaseConnected={isSupabaseConnected}
        adminPin={adminPin}
        setAdminPin={setAdminPin}
        seasons={seasons}
        onAddSeason={handleAddSeason}
      />
    </div>
  );
}

export default App;
