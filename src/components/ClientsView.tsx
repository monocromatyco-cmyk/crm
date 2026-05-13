import { useState } from 'react';
import { Client } from '../types';
import { genId } from '../store';
import { Search, Plus, User, Building2, Phone, Mail, MapPin, X, StickyNote, Briefcase, Trash2 } from 'lucide-react';

interface Props {
  clients: Client[];
  onChange: (clients: Client[]) => void;
}

export default function ClientsView({ clients, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Client | null>(null);
  const [isNew, setIsNew] = useState(false);

  const filtered = clients.filter((c) => {
    const s = search.toLowerCase();
    return c.fullName.toLowerCase().includes(s) || c.companyName.toLowerCase().includes(s) || c.email.toLowerCase().includes(s);
  });

  function openNew() {
    setEditing({
      id: genId(), companyName: '', representativeName: '', role: '', fullName: '',
      phone: '', email: '', address: '', notes: '', createdAt: new Date().toISOString(),
    });
    setIsNew(true);
  }

  function openEdit(c: Client) {
    setEditing({ ...c });
    setIsNew(false);
  }

  function handleSave() {
    if (!editing || !editing.fullName.trim()) return;
    if (isNew) {
      onChange([editing, ...clients]);
    } else {
      onChange(clients.map((c) => (c.id === editing.id ? editing : c)));
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar este cliente?')) {
      onChange(clients.filter((c) => c.id !== id));
      setEditing(null);
    }
  }

  return (
    <div className="space-y-4 view-enter">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar clientes..."
            className="input-field pl-10"
          />
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <User className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => openEdit(c)}
              className="glass-card p-4 hover:border-blue-500/30 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-blue-400">
                    {c.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-200 truncate">{c.fullName}</p>
                  {c.companyName && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" /> {c.companyName}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                    {c.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                    {c.email && <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
          <div className="glass-card w-full max-w-lg my-8 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{isNew ? 'Nuevo cliente' : 'Editar cliente'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Nombre completo *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={editing.fullName}
                  onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Empresa</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={editing.companyName}
                  onChange={(e) => setEditing({ ...editing, companyName: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Representante</label>
                <input
                  value={editing.representativeName}
                  onChange={(e) => setEditing({ ...editing, representativeName: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Cargo</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={editing.role}
                    onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={editing.phone}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={editing.email}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    className="input-field pl-10"
                    type="email"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Dirección</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={editing.address}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Notas</label>
              <div className="relative">
                <StickyNote className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="input-field pl-10 min-h-[80px] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
              {!isNew && (
                <button onClick={() => handleDelete(editing.id)} className="btn-danger flex items-center gap-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
