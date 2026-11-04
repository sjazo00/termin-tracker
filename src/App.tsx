import { useState, useEffect, useMemo } from 'react';
import { Navbar, type NavTabType } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { StatsView } from './components/StatsView';
import { PlayersView } from './components/PlayersView';
import { MatchesView } from './components/MatchesView';
import { AddMatchView } from './components/AddMatchView';
import { PlayersModal } from './components/PlayersModal';
import { SettingsModal } from './components/SettingsModal';
import { MvpPollModal } from './components/MvpPollModal';
import { dataService } from './lib/dataService';
import type { Player, Season, Match } from './types';
import { Loader2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTabType>('dashboard');
  const [statsMode, setStatsMode] = useState<'goals' | 'mvp' | 'winrate' | 'all'>('goals');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMvpPollOpen, setIsMvpPollOpen] = useState(false);
  const [mvpPollMatchId, setMvpPollMatchId] = useState<string | undefined>(undefined);

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
    const updated = await dataService.getPlayers();
    setPlayers(updated);
    return newPlayer;
  };

  const handleUpdatePlayer = async (id: string, updates: Partial<Player>) => {
    await dataService.updatePlayer(id, updates);
    const updated = await dataService.getPlayers();
    setPlayers(updated);
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
    playersData: Array<{
      player_id: string;
      team: 'zeleni' | 'sareni';
      goals: number;
      penalty_goals?: number;
      own_goals?: number;
    }>
  ) => {
    await dataService.addMatch(matchData, playersData);
    await loadData();
  };

  const handleDeleteMatch = async (id: string) => {
    await dataService.deleteMatch(id);
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setActiveTab('players');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateFromDashboard = (tab: NavTabType, mode?: string) => {
    if (mode && (mode === 'goals' || mode === 'mvp' || mode === 'winrate' || mode === 'all')) {
      setStatsMode(mode as any);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find latest match
  const latestMatch = matches.length > 0 ? matches[0] : undefined;

  const handleOpenMvpPoll = (match?: Match) => {
    setMvpPollMatchId(match?.id || latestMatch?.id);
    setIsMvpPollOpen(true);
  };

  const handleMvpAssigned = async (matchId: string, winnerId: string) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          const winnerPlayer = players.find((p) => p.id === winnerId);
          return {
            ...m,
            mvp_player_id: winnerId || null,
            mvp_player: winnerPlayer,
          };
        }
        return m;
      })
    );
    await loadData();
  };

  return (
    <div className="min-h-screen bg-[#070b08] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Football Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenPlayersModal={() => setIsPlayersModalOpen(true)}
        onOpenMvpPoll={() => handleOpenMvpPoll()}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="w-9 h-9 text-emerald-400 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Učitavanje podataka termina...</p>
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
                onNavigateTab={handleNavigateFromDashboard}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                isSupabaseConnected={isSupabaseConnected}
                onSelectPlayer={handleSelectPlayer}
                onOpenMvpPoll={handleOpenMvpPoll}
              />
            )}

            {activeTab === 'stats' && (
              <StatsView
                stats={stats}
                seasons={seasons}
                selectedSeasonId={selectedSeasonId}
                setSelectedSeasonId={setSelectedSeasonId}
                initialMode={statsMode}
                onSelectPlayer={handleSelectPlayer}
              />
            )}

            {activeTab === 'players' && (
              <PlayersView
                players={players}
                matches={matches}
                stats={stats}
                seasons={seasons}
                selectedSeasonId={selectedSeasonId}
                setSelectedSeasonId={setSelectedSeasonId}
                initialSelectedPlayerId={selectedPlayerId}
                onNavigateToMatch={() => setActiveTab('matches')}
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
                onSelectPlayer={handleSelectPlayer}
                onOpenMvpPoll={handleOpenMvpPoll}
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

      {/* Football-Themed Footer */}
      <footer className="border-t-2 border-[#15251b] bg-[#050806] py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">⚽ Termin 5 na 5</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-bold">Zeleni</span>
            <span className="text-slate-400">vs</span>
            <span className="text-amber-400 font-bold">Šareni</span>
            <span className="text-slate-600">•</span>
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
              Upravljanje Igračima
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

      <MvpPollModal
        isOpen={isMvpPollOpen}
        onClose={() => setIsMvpPollOpen(false)}
        matches={matches}
        initialMatchId={mvpPollMatchId}
        adminPin={adminPin}
        onMvpAssigned={handleMvpAssigned}
      />
    </div>
  );
}

export default App;
