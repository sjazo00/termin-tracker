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
  Award,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'leaderboard' | 'mvp' | 'matches' | 'add-match';
  setActiveTab: (tab: 'dashboard' | 'leaderboard' | 'mvp' | 'matches' | 'add-match') => void;
  onOpenSettings: () => void;
  onOpenPlayers: () => void;
  isSupabaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenPlayers,
  isSupabaseConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Branding */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl sm:text-2xl">⚽</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  Termin <span className="text-emerald-400">5 na 5</span>
                </span>
                <span className="hidden xs:inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Utorak
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-400 font-semibold">Zeleni</span>
                <span>vs</span>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-amber-300 font-semibold">Šareni</span>
              </div>
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>Pregled</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'leaderboard'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Strijelci</span>
            </button>

            <button
              onClick={() => setActiveTab('mvp')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'mvp'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4 text-purple-400" />
              <span>MVP Ljestvica</span>
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'matches'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Utakmice</span>
            </button>

            <button
              onClick={() => setActiveTab('add-match')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'add-match'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/25'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Unos Utakmice</span>
            </button>
          </nav>

          {/* Action buttons (Players, Settings, DB indicator) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPlayers}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              title="Igrači i sastavi"
            >
              <Users className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 relative"
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
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isSupabaseConnected
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/60'
                  : 'bg-amber-950/60 border-amber-800/80 text-amber-300 hover:bg-amber-900/60'
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
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-1.5 px-2 rounded-md ${
              activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            Pregled
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-1.5 px-2 rounded-md flex items-center gap-1 ${
              activeTab === 'leaderboard' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Strijelci
          </button>
          <button
            onClick={() => setActiveTab('mvp')}
            className={`py-1.5 px-2 rounded-md flex items-center gap-1 ${
              activeTab === 'mvp' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-purple-400" />
            MVP
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`py-1.5 px-2 rounded-md flex items-center gap-1 ${
              activeTab === 'matches' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            Utakmice
          </button>
          <button
            onClick={() => setActiveTab('add-match')}
            className={`py-1.5 px-2 rounded-md flex items-center gap-1 ${
              activeTab === 'add-match'
                ? 'bg-emerald-500 text-slate-950 font-bold px-2.5'
                : 'text-emerald-400 font-medium'
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
