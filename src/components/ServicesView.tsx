import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Package, DollarSign } from 'lucide-react';
import { Service } from '../types';
import { genId } from '../store';

interface Props {
  services: Service[];
  currency: string;
  onChange: (services: Service[]) => void;
}

const empty: Omit<Service, 'id' | 'createdAt'> = {
  name: '', description: '', unit: 'pza', basePrice: 0,
};

export default function ServicesView({ services, currency, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n);

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  function openNew() {
    setEditing({ ...empty, id: genId(), createdAt: new Date().toISOString() });
    setIsNew(true);
  }

  function openEdit(s: Service) {
    setEditing({ ...s });
    setIsNew(false);
  }

  function handleSave() {
    if (!editing || !editing.name.trim()) return;
    if (isNew) {
      onChange([editing, ...services]);
    } else {
      onChange(services.map((s) => (s.id === editing.id ? editing : s)));
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar este servicio?')) {
      onChange(services.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar servicios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay servicios registrados</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-sky-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
              <p className="font-semibold truncate text-slate-800">{s.name}</p>
              {s.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{s.description}</p>}
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-slate-400">{s.unit}</span>
                <span className="font-bold text-emerald-600">{fmt(s.basePrice)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">{isNew ? 'Nuevo servicio' : 'Editar servicio'}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs text-slate-500 mb-1 block">Nombre *</span>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="input-field"
                  placeholder="Diseño web"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 mb-1 block">Descripción</span>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="input-field resize-none"
                  rows={3}
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-slate-500 mb-1 block">Unidad</span>
                  <select
                    value={editing.unit}
                    onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                    className="input-field"
                  >
                    <option value="pza">pza</option>
                    <option value="hr">hr</option>
                    <option value="srv">srv</option>
                    <option value="paq">paq</option>
                    <option value="mes">mes</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3" /> Precio base
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editing.basePrice}
                    onChange={(e) => setEditing({ ...editing, basePrice: Number(e.target.value) })}
                    className="input-field"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
