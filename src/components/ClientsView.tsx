import { useState } from 'react';
import { Search, Plus, User, Building, Phone, Mail, MapPin, Trash2, X, FileText } from 'lucide-react';
import { Client } from '../types';
import { genId } from '../store';

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
      id: genId(),
      companyName: '',
      representativeName: '',
      role: '',
      fullName: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      createdAt: new Date().toISOString(),
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
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          No hay clientes registrados
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} onClick={() => openEdit(c)} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{c.fullName}</p>
                  {c.companyName && (
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3" /> {c.companyName}
                    </p>
                  )}
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {c.phone && <span className="text-xs text-slate-400">{c.phone}</span>}
                    {c.email && <span className="text-xs text-slate-400">{c.email}</span>}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="font-bold text-lg text-slate-800">{isNew ? 'Nuevo cliente' : 'Editar cliente'}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={editing.fullName}
                    onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                    className="input-field pl-10"
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Empresa</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={editing.companyName}
                    onChange={(e) => setEditing({ ...editing, companyName: e.target.value })}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Representante</label>
                  <input
                    value={editing.representativeName}
                    onChange={(e) => setEditing({ ...editing, representativeName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Cargo</label>
                  <input
                    value={editing.role}
                    onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={editing.phone}
                      onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                <label className="text-xs font-medium text-slate-600 mb-1 block">Dirección</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={editing.address}
                    onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Notas</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    value={editing.notes}
                    onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                    className="input-field pl-10 min-h-[80px]"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-slate-200">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
                {isNew ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
