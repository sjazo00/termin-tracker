import React, { useState } from 'react';
import { X, UserPlus, Check, Search, Edit2 } from 'lucide-react';
import type { Player } from '../types';

interface PlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAddPlayer: (name: string, nickname?: string) => Promise<Player>;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => Promise<void>;
  adminPin: string;
}

export const PlayersModal: React.FC<PlayersModalProps> = ({
  isOpen,
  onClose,
  players,
  onAddPlayer,
  onUpdatePlayer,
}) => {
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const rawNames = name.includes('\n') ? name.split('\n') : name.split(',');
      const names = rawNames.map((s) => s.trim()).filter(Boolean);
      for (const singleName of names) {
        await onAddPlayer(singleName);
      }
      setName('');
    } catch (err: any) {
      alert('Greška pri dodavanju: ' + (err.message || 'Igrač možda već postoji.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await onUpdatePlayer(id, {
        name: editName.trim(),
      });
      setEditingId(null);
    } catch (err: any) {
      alert('Greška: ' + err.message);
    }
  };

  const handleToggleActive = async (player: Player) => {
    try {
      await onUpdatePlayer(player.id, { is_active: !player.is_active });
    } catch (err: any) {
      alert('Greška: ' + err.message);
    }
  };

  const handleSaveAndClose = async () => {
    setIsSubmitting(true);
    try {
      // 1. If inline editing is active, save that change
      if (editingId && editName.trim()) {
        await onUpdatePlayer(editingId, { name: editName.trim() });
        setEditingId(null);
      }
      // 2. If name input has content, add it immediately
      if (name.trim()) {
        const rawNames = name.includes('\n') ? name.split('\n') : name.split(',');
        const names = rawNames.map((s) => s.trim()).filter(Boolean);
        for (const singleName of names) {
          await onAddPlayer(singleName);
        }
        setName('');
      }
      onClose();
    } catch (err: any) {
      alert('Greška pri spremanju: ' + (err.message || 'Pokušajte ponovno.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.nickname && p.nickname.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0f1712] border-2 border-[#1e3828] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1b2f21] flex items-center justify-between bg-[#090e0b]">
          <div>
            <h3 className="text-xl font-black text-white">Upravljanje Igračima ({players.length})</h3>
            <p className="text-xs text-slate-400">Dodavanje, izmjena i aktivacija igrača u ekipi.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#16271c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Player Form */}
        <div className="p-5 bg-[#0b130e] border-b border-[#1b2f21]">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Ime novog igrača (npr. Mario ili Marko, Ivan, Luka)..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-[#14231a] border border-[#23422e] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Dodaj</span>
            </button>
          </form>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#1b2f21] bg-[#0d1610]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pretraži popis igrača..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#14231a] border border-[#23422e] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Players List */}
        <div className="p-5 overflow-y-auto flex-1 divide-y divide-[#18291d] max-h-[380px]">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-8">Nema pronađenih igrača.</p>
          ) : (
            filtered.map((player) => (
              <div
                key={player.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-[#132017] px-2 rounded-xl transition-colors"
              >
                {editingId === player.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-[#14231a] border border-emerald-500/80 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(player.id)}
                      className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Spremi
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                    >
                      Odustani
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#182d20] border border-[#264431] flex items-center justify-center font-bold text-xs text-emerald-400">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{player.name}</span>
                          {!player.is_active && (
                            <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.2 rounded">
                              Neaktivan
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(player)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1b2f22] rounded-lg transition-colors"
                        title="Uredi ime"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(player)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                          player.is_active
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900/60'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {player.is_active ? 'Aktivan' : 'Aktiviraj'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1b2f21] bg-[#090e0b] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            * Neaktivni igrači se ne prikazuju u brzim odabirima
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndClose}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-colors shadow flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Spremi & Zatvori</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
