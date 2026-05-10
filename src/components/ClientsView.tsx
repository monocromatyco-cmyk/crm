import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, User, Building, Phone, Mail, MapPin, StickyNote } from 'lucide-react';
import { Client } from '../types';
import { genId } from '../store';

interface Props {
  clients: Client[];
  onChange: (clients: Client[]) => void;
}

function emptyClient(): Client {
  return {
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
  };
}

export default function ClientsView({ clients, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Client | null>(null);
  const [isNew, setIsNew] = useState(false);

  const filtered = clients.filter((c) => {
    const s = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(s) ||
      c.companyName.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      c.phone.includes(s)
    );
  });

  function openNew() {
    setEditing(emptyClient());
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

  function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
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
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay clientes registrados</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-slate-800">{c.fullName}</p>
                {c.companyName && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Building className="w-3 h-3" /> {c.companyName}
                  </p>
                )}
                <div className="flex gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                  {c.phone && <span>{c.phone}</span>}
                  {c.email && <span>{c.email}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(c)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <Edit2 className="w-4 h-4 text-slate-400" />
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-bold text-lg text-slate-800">{isNew ? 'Nuevo cliente' : 'Editar cliente'}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Nombre completo *" icon={<User className="w-3.5 h-3.5" />}>
                <input
                  value={editing.fullName}
                  onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                  className="input-field"
                  placeholder="Juan Pérez"
                />
              </Field>
              <Field label="Empresa" icon={<Building className="w-3.5 h-3.5" />}>
                <input
                  value={editing.companyName}
                  onChange={(e) => setEditing({ ...editing, companyName: e.target.value })}
                  className="input-field"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Representante">
                  <input
                    value={editing.representativeName}
                    onChange={(e) => setEditing({ ...editing, representativeName: e.target.value })}
                    className="input-field"
                  />
                </Field>
                <Field label="Cargo">
                  <input
                    value={editing.role}
                    onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                    className="input-field"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Teléfono" icon={<Phone className="w-3.5 h-3.5" />}>
                  <input
                    value={editing.phone}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    className="input-field"
                  />
                </Field>
                <Field label="Email" icon={<Mail className="w-3.5 h-3.5" />}>
                  <input
                    value={editing.email}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    className="input-field"
                    type="email"
                  />
                </Field>
              </div>
              <Field label="Dirección" icon={<MapPin className="w-3.5 h-3.5" />}>
                <input
                  value={editing.address}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                  className="input-field"
                />
              </Field>
              <Field label="Notas" icon={<StickyNote className="w-3.5 h-3.5" />}>
                <textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-200">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
