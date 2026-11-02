import React, { useState } from 'react';
import {
  X,
  Database,
  Key,
  Calendar,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';
import type { Season } from '../types';
import { currentConfig, saveSupabaseConfig, clearSupabaseConfig } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSupabaseConnected: boolean;
  adminPin: string;
  setAdminPin: (pin: string) => void;
  seasons: Season[];
  onAddSeason: (name: string, isCurrent: boolean) => Promise<Season>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isSupabaseConnected,
  adminPin,
  setAdminPin,
  seasons,
  onAddSeason,
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'pin' | 'seasons' | 'backup'>('supabase');

  // Supabase form
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig?.url || '');
  const [supabaseKey, setSupabaseKey] = useState(currentConfig?.key || '');

  // PIN form
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');

  // New Season form
  const [newSeasonName, setNewSeasonName] = useState('');
  const [isNewSeasonCurrent, setIsNewSeasonCurrent] = useState(true);

  if (!isOpen) return null;

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      alert('Molimo unesite oba podatka (URL i Anon ključ).');
      return;
    }
    saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
  };

  const handleClearSupabase = () => {
    if (confirm('Želite li ukloniti podatke baze i vratiti se na lokalni način rada?')) {
      clearSupabaseConfig();
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPinInput !== adminPin) {
      alert('Trenutni PIN nije točan!');
      return;
    }
    if (newPinInput.length < 4) {
      alert('Novi PIN mora imati barem 4 znamenke!');
      return;
    }
    setAdminPin(newPinInput);
    localStorage.setItem('termin_admin_pin', newPinInput);
    alert('PIN je uspješno promijenjen!');
    setCurrentPinInput('');
    setNewPinInput('');
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonName.trim()) return;
    try {
      await onAddSeason(newSeasonName.trim(), isNewSeasonCurrent);
      setNewSeasonName('');
      alert('Nova sezona je uspješno kreirana!');
    } catch (err: any) {
      alert('Greška pri kreiranju sezone: ' + err.message);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      players: localStorage.getItem('termin_local_players'),
      seasons: localStorage.getItem('termin_local_seasons'),
      matches: localStorage.getItem('termin_local_matches'),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `termin-5na5-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0f1712] border-2 border-[#1e3828] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1b2f21] flex items-center justify-between bg-[#090e0b]">
          <div>
            <h3 className="text-xl font-black text-white">Postavke Aplikacije</h3>
            <p className="text-xs text-slate-400">Povezivanje baze podataka, sezona i admin PIN-a.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#16271c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1b2f21] bg-[#0b130e] px-4 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Baza</span>
          </button>

          <button
            onClick={() => setActiveTab('seasons')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'seasons'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Sezone</span>
          </button>

          <button
            onClick={() => setActiveTab('pin')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pin'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Admin PIN</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Sigurnosna Kopija</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: SUPABASE CONFIG */}
          {activeTab === 'supabase' && (
            <div className="space-y-5">
              {/* Status Box */}
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                  isSupabaseConnected
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                }`}
              >
                {isSupabaseConnected ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {isSupabaseConnected ? 'Povezano s Cloud Bazom' : 'Lokalni način (Demo / Offline)'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isSupabaseConnected
                      ? 'Svi podaci se sinkroniziraju uživo na Supabase serveru i vidljivi su svim igračima.'
                      : 'Podaci se spremaju u lokalnu memoriju preglednika. Povežite bazu kako bi rezultati bili trajni i javno dostupni ekipi.'}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveSupabase} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Supabase Project URL:
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full bg-[#14231a] border border-[#23422e] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Supabase Anon Key:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full bg-[#14231a] border border-[#23422e] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-colors shadow"
                  >
                    Spremi i Poveži Bazu
                  </button>

                  {isSupabaseConnected && (
                    <button
                      type="button"
                      onClick={handleClearSupabase}
                      className="px-4 py-2.5 bg-[#1b2f22] hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-[#2a4d36] rounded-xl text-sm transition-colors font-bold"
                    >
                      Odspoji Bazu
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SEASONS */}
          {activeTab === 'seasons' && (
            <div className="space-y-6">
              {/* Create Season Form */}
              <form onSubmit={handleCreateSeason} className="p-4 bg-[#14231a] border border-[#23422e] rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Kreiraj Novu Sezonu</span>
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Naziv sezone (npr. Proljeće 2026)..."
                    value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                    className="flex-1 bg-[#0f1712] border border-[#264431] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-colors whitespace-nowrap"
                  >
                    Kreiraj
                  </button>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isNewSeasonCurrent}
                    onChange={(e) => setIsNewSeasonCurrent(e.target.checked)}
                    className="rounded border-[#264431] text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Postavi kao trenutno aktivnu sezonu</span>
                </label>
              </form>

              {/* Existing Seasons List */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 mb-2">
                  Postojeće Sezone ({seasons.length}):
                </h4>
                <div className="divide-y divide-[#1b2f21] border border-[#1e3326] rounded-2xl bg-[#0b130e] overflow-hidden">
                  {seasons.map((s) => (
                    <div key={s.id} className="p-3.5 flex items-center justify-between text-sm">
                      <span className="font-bold text-white flex items-center gap-2">
                        {s.name}
                        {s.is_current && (
                          <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            Aktivna Sezona
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('hr-HR') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN PIN */}
          {activeTab === 'pin' && (
            <div className="space-y-4">
              <div className="bg-[#14231a] border border-[#23422e] p-4 rounded-2xl">
                <h4 className="text-sm font-black text-white">Promjena Administratorskog PIN-a</h4>
                <p className="text-xs text-slate-400 mt-1">
                  PIN kod je potreban za unos nove utakmice, brisanje utakmica i uređivanje popisa igrača.
                </p>
              </div>

              <form onSubmit={handleChangePin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Trenutni PIN:
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    placeholder="Unesite trenutni PIN (zadano: 1234)"
                    className="w-full bg-[#14231a] border border-[#23422e] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Novi PIN (minimalno 4 znamenke):
                  </label>
                  <input
                    type="password"
                    required
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="Unesite novi PIN"
                    className="w-full bg-[#14231a] border border-[#23422e] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-colors mt-2"
                >
                  Spremi Novi PIN
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-[#14231a] border border-[#23422e] p-4 rounded-2xl">
                <h4 className="text-sm font-black text-white">Lokalni Backup Podataka</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Možete preuzeti JSON sigurnosnu kopiju svih lokalno unesenih utakmica, igrača i sezona.
                </p>
              </div>

              <button
                onClick={handleExportBackup}
                className="w-full py-3 bg-[#182e20] hover:bg-[#203e2b] border border-[#2b5239] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Preuzmi Sigurnosnu Kopiju (JSON)</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1b2f21] bg-[#090e0b] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Zatvori
          </button>
        </div>

      </div>
    </div>
  );
};
