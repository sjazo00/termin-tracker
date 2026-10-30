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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Postavke Aplikacije</h3>
            <p className="text-xs text-slate-400">Povezivanje baze podataka, sezona i admin PIN-a.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'supabase'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Baza</span>
          </button>

          <button
            onClick={() => setActiveTab('seasons')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'seasons'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Sezone</span>
          </button>

          <button
            onClick={() => setActiveTab('pin')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pin'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Admin PIN</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-emerald-500 text-emerald-400'
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
                    ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
                    : 'bg-amber-950/30 border-amber-800/80 text-amber-300'
                }`}
              >
                {isSupabaseConnected ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {isSupabaseConnected
                      ? 'Supabase Cloud Baza je Povezana!'
                      : 'Aplikacija radi u lokalnom načinu rada (Demo)'}
                  </h4>
                  <p className="text-xs opacity-80 mt-0.5">
                    {isSupabaseConnected
                      ? 'Svi podaci se automatski spremaju u cloud i vidljivi su svim igračima na bilo kojem uređaju.'
                      : 'Unesite podatke vašeg Supabase projekta ispod kako bi se podaci sinkronizirali.'}
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
                    type="text"
                    required
                    placeholder="https://xxxxxxxx.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Supabase Anon / Public Key:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOi..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    Spremi i Poveži
                  </button>
                  {isSupabaseConnected && (
                    <button
                      type="button"
                      onClick={handleClearSupabase}
                      className="px-4 py-2.5 text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Ukloni vezu s bazom
                    </button>
                  )}
                </div>
              </form>

              {/* Quick instructions */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>Kako doći do ovih podataka u 2 minute?</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Prijavite se na <strong>supabase.com</strong> i kreirajte besplatan projekt (npr. "Termin").</li>
                  <li>Otvorite <strong>SQL Editor</strong> u Supabaseu i pokrenite skriptu iz datoteke <code className="text-emerald-400 font-mono">supabase-schema.sql</code>.</li>
                  <li>U postavkama projekta (<strong>Settings → API</strong>) kopirajte <strong>Project URL</strong> i <strong>anon/public key</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: SEASONS */}
          {activeTab === 'seasons' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Upravljanje Sezonama</h4>
                <p className="text-xs text-slate-400">
                  Možete kreirati novu sezonu za svaku godinu ili proljetni/jesenski ciklus.
                </p>
              </div>

              {/* Add Season */}
              <form onSubmit={handleCreateSeason} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="Naziv sezone (npr. Sezona 2026/2027)..."
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Kreiraj Sezonu</span>
                </button>
              </form>

              {/* Seasons List */}
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden">
                {seasons.map((s) => (
                  <div key={s.id} className="p-3.5 flex items-center justify-between text-sm">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{s.name}</span>
                      {s.is_current && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Aktivna
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN PIN */}
          {activeTab === 'pin' && (
            <div className="space-y-5 max-w-sm">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Promjena Admin PIN-a</h4>
                <p className="text-xs text-slate-400">
                  PIN sprječava neovlašteni unos rezultata ili brisanje utakmica.
                </p>
              </div>

              <form onSubmit={handleChangePin} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">
                    Trenutni PIN:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Trenutni PIN"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">
                    Novi PIN (min. 4 znamenke):
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Novi PIN"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                >
                  Promijeni PIN
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Sigurnosna Kopija Podataka</h4>
                <p className="text-xs text-slate-400">
                  Preuzmite kompletnu kopiju svih igrača, sezona i utakmica u JSON formatu na svoje računalo.
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white text-sm">JSON Export</div>
                  <div className="text-xs text-slate-400">Preuzimanje lokalne arhive</div>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Preuzmi Backup</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Zatvori
          </button>
        </div>

      </div>
    </div>
  );
};
