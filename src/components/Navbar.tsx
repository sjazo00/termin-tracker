import React from 'react';
import {
  Trophy,
  Calendar,
  PlusCircle,
  Users,
  Settings,
  Database,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export type NavTabType = 'dashboard' | 'stats' | 'players' | 'matches' | 'add-match';

interface NavbarProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  onOpenSettings: () => void;
  onOpenPlayersModal: () => void;
  isSupabaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenPlayersModal,
  isSupabaseConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090e0b]/95 backdrop-blur-md border-b-2 border-[#1a2d21] shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Football Branding */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-green-800 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform border border-emerald-300">
              <span className="text-xl sm:text-2xl drop-shadow">⚽</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-white">
                  Termin <span className="text-emerald-400">5 na 5</span>
                </span>
                <span className="hidden xs:inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-[#14231a] text-emerald-300 border border-[#23422e]">
                  Utorak
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-400">Zeleni</span>
                <span className="text-slate-400">vs</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-amber-400">Šareni</span>
              </div>
            </div>
          </div>

          {/* Navigation Links - Desktop (Human-friendly Football Colors: Green / Black / White) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {/* Pregled */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-[#15241b]'
              }`}
            >
              <span>Pregled</span>
            </button>

            {/* Statistika (Combines Strijelci & MVP) */}
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'stats'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-[#15241b]'
              }`}
            >
              <Trophy className={`w-4 h-4 ${activeTab === 'stats' ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>Statistika</span>
            </button>

            {/* Igrači */}
            <button
              onClick={() => setActiveTab('players')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'players'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-[#15241b]'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'players' ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>Igrači</span>
            </button>

            {/* Utakmice */}
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'matches'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-[#15241b]'
              }`}
            >
              <Calendar className={`w-4 h-4 ${activeTab === 'matches' ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>Utakmice</span>
            </button>

            {/* Unos Utakmice */}
            <button
              onClick={() => setActiveTab('add-match')}
              className={`px-3.5 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ml-1 ${
                activeTab === 'add-match'
                  ? 'bg-white text-slate-950 shadow-lg'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Unos Utakmice</span>
            </button>
          </nav>

          {/* Action buttons (Manage Players modal, Settings, DB indicator) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPlayersModal}
              className="p-2 text-slate-300 hover:text-white hover:bg-[#14231a] rounded-xl transition-colors border border-[#1e3425]"
              title="Upravljanje popisom igrača (PIN)"
            >
              <UserCheck className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white hover:bg-[#14231a] rounded-xl transition-colors border border-[#1e3425] relative"
              title="Postavke baze i PIN-a"
            >
              <Settings className="w-5 h-5" />
              {!isSupabaseConnected && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Supabase status badge */}
            <button
              onClick={onOpenSettings}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                isSupabaseConnected
                  ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/70'
                  : 'bg-amber-950/70 border-amber-700/80 text-amber-300 hover:bg-amber-900/70'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSupabaseConnected ? 'Cloud Baza' : 'Lokalno (Demo)'}</span>
              {isSupabaseConnected ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              )}
            </button>
          </div>

        </div>

        {/* Mobile bottom-friendly navigation row */}
        <div className="flex md:hidden items-center justify-around py-2.5 border-t border-[#1a2d21] text-xs font-bold">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-1.5 px-2 rounded-lg ${
              activeTab === 'dashboard' ? 'text-emerald-400 font-black' : 'text-slate-400'
            }`}
          >
            Pregled
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-1.5 px-2 rounded-lg flex items-center gap-1 ${
              activeTab === 'stats' ? 'text-emerald-400 font-black' : 'text-slate-400'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Statistika
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`py-1.5 px-2 rounded-lg flex items-center gap-1 ${
              activeTab === 'players' ? 'text-emerald-400 font-black' : 'text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Igrači
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`py-1.5 px-2 rounded-lg flex items-center gap-1 ${
              activeTab === 'matches' ? 'text-emerald-400 font-black' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Utakmice
          </button>
          <button
            onClick={() => setActiveTab('add-match')}
            className={`py-1.5 px-2 rounded-lg flex items-center gap-1 ${
              activeTab === 'add-match'
                ? 'bg-emerald-500 text-slate-950 font-black px-2.5'
                : 'text-emerald-400 font-bold'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Unos
          </button>
        </div>

      </div>
    </header>
  );
};
