import React, { useState } from 'react';
import { X, UserPlus, Check, Search, Edit2, ShieldAlert } from 'lucide-react';
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
  adminPin,
}) => {
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddPlayer(name.trim(), nickname.trim() || undefined);
      setName('');
      setNickname('');
    } catch (err: any) {
      alert('Greška pri dodavanju: ' + (err.message || 'Igrač možda već postoji.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditNickname(player.nickname || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await onUpdatePlayer(id, {
        name: editName.trim(),
        nickname: editNickname.trim() || undefined,
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

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.nickname && p.nickname.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Popis Igrača ({players.length})</h3>
            <p className="text-xs text-slate-400">Dodavanje i uređivanje igrača u ekipi.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Player Form */}
        <div className="p-5 bg-slate-950/40 border-b border-slate-800">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              placeholder="Ime igrača (npr. Mario)..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Nadimak (npr. Manđo)..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full sm:w-44 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>Dodaj Igrača</span>
            </button>
          </form>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pretraži popis igrača..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Players List */}
        <div className="p-5 overflow-y-auto divide-y divide-slate-800/60 flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">Nema igrača po tom kriteriju.</p>
          ) : (
            filtered.map((player) => (
              <div
                key={player.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
              >
                {editingId === player.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-950 border border-slate-600 px-2.5 py-1 rounded-lg text-sm text-white flex-1"
                    />
                    <input
                      type="text"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      placeholder="Nadimak"
                      className="bg-slate-950 border border-slate-600 px-2.5 py-1 rounded-lg text-sm text-white w-28"
                    />
                    <button
                      onClick={() => handleSaveEdit(player.id)}
                      className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg font-bold"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                        {player.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{player.name}</div>
                        {player.nickname && (
                          <div className="text-xs text-slate-400">"{player.nickname}"</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(player)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                          player.is_active
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {player.is_active ? 'Aktivan' : 'Neaktivan'}
                      </button>

                      <button
                        onClick={() => handleStartEdit(player)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Uredi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
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
